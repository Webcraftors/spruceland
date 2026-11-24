/** Pure provisioning policy. No environment values, tokens or database state are retained here. */
export const LEADERSHIP_CATEGORIES = [
  { prefix: 'SUPER_ADMIN_EMAIL_', type: 'super_admin' },
  { prefix: 'STGL_OWNER_EMAIL_', type: 'stgl_owner' },
  { prefix: 'STGL_ADMIN_EMAIL_', type: 'stgl_admin' },
  { prefix: 'YALELO_ADMIN_EMAIL_', type: 'yalelo_admin' },
] as const;

export type LeadershipType = (typeof LEADERSHIP_CATEGORIES)[number]['type'];
export interface VerifiedIdentity { id: string; email: string; emailConfirmedAt: string }
export const normalizeEmail = (value: string) => value.trim().toLowerCase();

export function matchingLeadership(email: string, readSecret: (name: string) => string | undefined): LeadershipType[] {
  const normalized = normalizeEmail(email);
  if (!normalized) return [];
  return LEADERSHIP_CATEGORIES.filter(({ prefix }) => {
    let match = false;
    // Always scan all 100 positions: neither a match nor a missing index ends a prefix scan.
    for (let index = 1; index <= 100; index++) {
      const allowed = readSecret(`${prefix}${index}`);
      if (allowed && normalizeEmail(allowed) === normalized) match = true;
    }
    return match;
  }).map(({ type }) => type);
}

export interface ProvisioningDependencies {
  verifyToken: (token: string) => Promise<VerifiedIdentity | null>;
  readSecret: (name: string) => string | undefined;
  isEligible: (identity: VerifiedIdentity) => Promise<boolean>;
  provision: (identity: VerifiedIdentity, type: LeadershipType) => Promise<'provisioned' | 'already_processed'>;
}

function reply(status: number, body: unknown, headers?: HeadersInit) {
  return Response.json(body, { status, headers: { 'Cache-Control': 'no-store', ...headers } });
}

/** No caller-selected target, role, organization or email is accepted. */
export async function provisionLeadershipRequest(request: Request, deps: ProvisioningDependencies): Promise<Response> {
  if (request.method !== 'POST') return reply(405, { error: 'Method not allowed' }, { Allow: 'POST' });
  const match = /^Bearer\s+(\S+)$/i.exec(request.headers.get('Authorization') ?? '');
  const token = match?.[1];
  if (!token) return reply(401, { error: 'Authentication required' });
  let identity: VerifiedIdentity | null;
  try { identity = await deps.verifyToken(token); }
  catch { return reply(401, { error: 'Invalid authentication' }); }
  if (!identity?.id || !identity.email) return reply(401, { error: 'Invalid authentication' });
  if (!identity.emailConfirmedAt || !Number.isFinite(Date.parse(identity.emailConfirmedAt))) return reply(403, { error: 'Verified email required' });
  // Accept an absent body or an empty object only; never consume identity parameters.
  const body = await request.text();
  if (body.length > 1024) return reply(413, { error: 'Request body too large' });
  if (body.trim()) {
    try {
      const input: unknown = JSON.parse(body);
      if (!input || Array.isArray(input) || typeof input !== 'object' || Object.keys(input).length) return reply(400, { error: 'No provisioning parameters are accepted' });
    } catch { return reply(400, { error: 'Invalid request body' }); }
  }
  const categories = matchingLeadership(identity.email, deps.readSecret);
  if (!categories.length) return reply(403, { error: 'Leadership provisioning is not permitted' });
  try {
    if (!await deps.isEligible(identity)) return reply(403, { error: 'Account is not eligible' });
  } catch { return reply(503, { error: 'Account verification unavailable' }); }
  const results: { leadership_type: LeadershipType; status: 'provisioned' | 'already_processed' | 'failed' }[] = [];
  for (const type of categories) {
    try { results.push({ leadership_type: type, status: await deps.provision(identity, type) }); }
    catch { results.push({ leadership_type: type, status: 'failed' }); }
  }
  // Each SQL call is its own transaction; matching categories are reported independently.
  const failed = results.filter(r => r.status === 'failed').length;
  return reply(failed === results.length ? 409 : failed ? 207 : 200, { results });
}

/** Exact origin allowlist; requests without Origin still require a verified bearer token. */
export function allowedRequestOrigin(request: Request, extraOrigins = ''): string | null | false {
  const origin = request.headers.get('Origin');
  if (!origin) return null;
  const allowed = new Set([new URL(request.url).origin]);
  for (const entry of extraOrigins.split(',')) {
    try { const url = new URL(entry.trim()); if (url.protocol === 'https:' && url.origin === entry.trim()) allowed.add(url.origin); } catch { /* Ignore malformed configuration. */ }
  }
  return allowed.has(origin) ? origin : false;
}