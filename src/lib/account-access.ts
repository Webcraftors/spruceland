import { supabase } from '@/integrations/supabase/client';
import type { ClientSession } from '@/domain/types';
import type { Role } from '@/lib/session';

export function isInternalRole(value: unknown): value is Role {
  return typeof value === 'string' && ['owner', 'head_tech', 'technician', 'administrator', 'crm'].includes(value);
}

export function parseClientContext(value: unknown): ClientSession | null {
  if (!value || typeof value !== 'object') return null;
  const c = value as Partial<ClientSession>;
  if (typeof c.clientId !== 'string' || typeof c.clientName !== 'string' || typeof c.employeeName !== 'string' || typeof c.employeeRef !== 'string' || typeof c.department !== 'string' || typeof c.signedInAt !== 'string') return null;
  if (!c.site || typeof c.site.name !== 'string' || typeof c.site.city !== 'string' || typeof c.site.province !== 'string') return null;
  return c as ClientSession;
}

export async function readAccount() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  const { data: profile, error: profileError } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  if (profileError) throw new Error('Your account profile could not be loaded. Please try again.');
  const { data: role, error: roleError } = await supabase.rpc('current_internal_role');
  if (roleError) throw new Error('Your access could not be checked. Please try again.');
  return { user, profile, role: isInternalRole(role) ? role : null, client: parseClientContext(profile.client_context) };
}

export type Account = NonNullable<Awaited<ReturnType<typeof readAccount>>>;