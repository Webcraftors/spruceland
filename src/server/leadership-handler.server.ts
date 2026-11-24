import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';
import { allowedRequestOrigin, provisionLeadershipRequest } from './leadership-policy';

export async function handleLeadershipRequest(request: Request): Promise<Response> {
  const origin = allowedRequestOrigin(request, process.env['PROVISION_LEADERSHIP_ALLOWED_ORIGINS'] ?? '');
  if (origin === false) return Response.json({ error: 'Origin not permitted' }, { status: 403, headers: { 'Cache-Control': 'no-store' } });
  const cors: Record<string, string> = origin ? { 'Access-Control-Allow-Origin': origin, Vary: 'Origin' } : {};
  if (request.method === 'OPTIONS') {
    if (request.headers.get('Access-Control-Request-Method') !== 'POST') return new Response(null, { status: 405, headers: { ...cors, Allow: 'POST, OPTIONS' } });
    return new Response(null, { status: 204, headers: { ...cors, 'Access-Control-Allow-Methods': 'POST', 'Access-Control-Allow-Headers': 'authorization, content-type', 'Cache-Control': 'no-store' } });
  }
  if (!/^Bearer\s+\S+$/i.test(request.headers.get('Authorization') ?? '')) return Response.json({ error: 'Authentication required' }, { status: 401, headers: { ...cors, 'Cache-Control': 'no-store' } });
  try {
    const url = process.env['SUPABASE_URL'];
    const key = process.env['SUPABASE_PUBLISHABLE_KEY'];
    if (!url || !key) return Response.json({ error: 'Authentication unavailable' }, { status: 503, headers: { ...cors, 'Cache-Control': 'no-store' } });
    const authClient = createClient<Database>(url, key, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      global: { fetch: (input, init) => {
        const headers = new Headers(init?.headers);
        if (key.startsWith('sb_') && headers.get('Authorization') === `Bearer ${key}`) headers.delete('Authorization');
        headers.set('apikey', key);
        return fetch(input, { ...init, headers });
      } },
    });
    const response = await provisionLeadershipRequest(request, {
      verifyToken: async token => {
        const { data: { user }, error } = await authClient.auth.getUser(token);
        if (error || !user?.email) return null;
        return { id: user.id, email: user.email, emailConfirmedAt: user.email_confirmed_at ?? '' };
      },
      readSecret: name => process.env[name],
      isEligible: async identity => {
        // The privileged client is loaded only AFTER token verification and allowlist matching.
        const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
        const { data: { user }, error } = await supabaseAdmin.auth.admin.getUserById(identity.id);
        if (error || !user) throw new Error('Verification unavailable');
        const bannedUntil = (user as typeof user & { banned_until?: string }).banned_until;
        if (bannedUntil && (!Number.isFinite(Date.parse(bannedUntil)) || Date.parse(bannedUntil) > Date.now())) return false;
        if (user.is_anonymous || !user.email_confirmed_at || user.email?.trim().toLowerCase() !== identity.email.trim().toLowerCase()) return false;
        const { data: profile, error: profileError } = await supabaseAdmin.from('profiles').select('status').eq('id', identity.id).maybeSingle();
        if (profileError) throw new Error('Verification unavailable');
        return profile?.status === 'active';
      },
      provision: async (identity, type) => {
        const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
        const { data, error } = await supabaseAdmin.rpc('provision_leadership', { p_user_id: identity.id, p_verified_email: identity.email, p_leadership_type: type });
        if (error) throw new Error('Provisioning failed');
        const result = data && typeof data === 'object' && !Array.isArray(data) ? data['status'] : null;
        if (result !== 'provisioned' && result !== 'already_processed') throw new Error('Invalid provisioning result');
        return result;
      },
    });
    Object.entries(cors).forEach(([name, value]) => response.headers.set(name, value));
    return response;
  } catch {
    // Never log provider errors: they can carry identities, request headers or SQL details.
    return Response.json({ error: 'Provisioning unavailable' }, { status: 503, headers: { ...cors, 'Cache-Control': 'no-store' } });
  }
}