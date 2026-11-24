import { describe, expect, it, vi } from 'vitest';
import { allowedRequestOrigin, matchingLeadership, normalizeEmail, provisionLeadershipRequest, type ProvisioningDependencies, type VerifiedIdentity } from './leadership-policy';

const identity: VerifiedIdentity = { id: '11111111-1111-4111-8111-111111111111', email: 'leader@example.test', emailConfirmedAt: '2026-11-01T00:00:00Z' };
function setup(secrets: Record<string, string> = { STGL_OWNER_EMAIL_1: identity.email }) {
  const deps: ProvisioningDependencies = {
    verifyToken: vi.fn(async () => identity),
    readSecret: vi.fn(name => secrets[name]),
    isEligible: vi.fn(async () => true),
    provision: vi.fn(async () => 'provisioned' as const),
  };
  return deps;
}
function request(body?: unknown, token: string | null = 'valid-token', method = 'POST') {
  return new Request('https://spruceland.lovable.app/api/public/provision-leadership', {
    method, headers: token ? { Authorization: `Bearer ${token}` } : {},
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}

describe('numbered leadership allowlist', () => {
  it('normalizes email whitespace and case', () => { expect(normalizeEmail('  LEADER@Example.Test ')).toBe('leader@example.test'); });
  it('scans all 1 through 100 positions for each of the four prefixes', () => {
    const deps = setup({ STGL_OWNER_EMAIL_100: identity.email, YALELO_ADMIN_EMAIL_42: identity.email });
    expect(matchingLeadership(identity.email, deps.readSecret)).toEqual(['stgl_owner', 'yalelo_admin']);
    expect(deps.readSecret).toHaveBeenCalledTimes(400);
    expect(deps.readSecret).toHaveBeenCalledWith('SUPER_ADMIN_EMAIL_100');
    expect(deps.readSecret).toHaveBeenCalledWith('YALELO_ADMIN_EMAIL_1');
  });
  it('does not stop at a match or a gap and deduplicates within a category', () => {
    const deps = setup({ STGL_ADMIN_EMAIL_1: ' LEADER@EXAMPLE.TEST ', STGL_ADMIN_EMAIL_99: identity.email });
    expect(matchingLeadership(identity.email, deps.readSecret)).toEqual(['stgl_admin']);
    expect(deps.readSecret).toHaveBeenCalledTimes(400);
  });
  it('ignores position 101 and missing prefixes', () => {
    const deps = setup({ SUPER_ADMIN_EMAIL_101: identity.email });
    expect(matchingLeadership(identity.email, deps.readSecret)).toEqual([]);
  });
});

describe('self-only provisioning', () => {
  it('rejects missing authentication with 401 before any secret or write', async () => {
    const deps = setup(); expect((await provisionLeadershipRequest(request(undefined, null), deps)).status).toBe(401);
    expect(deps.readSecret).not.toHaveBeenCalled(); expect(deps.provision).not.toHaveBeenCalled();
  });
  it('rejects an invalid token with 401', async () => {
    const deps = setup(); deps.verifyToken = vi.fn(async () => null);
    expect((await provisionLeadershipRequest(request(), deps)).status).toBe(401);
    expect(deps.provision).not.toHaveBeenCalled();
  });
  it('rejects unverified email with 403', async () => {
    const deps = setup(); deps.verifyToken = vi.fn(async () => ({ ...identity, emailConfirmedAt: '' }));
    expect((await provisionLeadershipRequest(request(), deps)).status).toBe(403);
    expect(deps.readSecret).not.toHaveBeenCalled(); expect(deps.provision).not.toHaveBeenCalled();
  });
  it('rejects non-allowlisted verified users with 403', async () => {
    const deps = setup({}); expect((await provisionLeadershipRequest(request(), deps)).status).toBe(403);
    expect(deps.isEligible).not.toHaveBeenCalled(); expect(deps.provision).not.toHaveBeenCalled();
  });
  it('rejects banned/suspended/inactive account eligibility without writing', async () => {
    const deps = setup(); deps.isEligible = vi.fn(async () => false);
    expect((await provisionLeadershipRequest(request(), deps)).status).toBe(403);
    expect(deps.provision).not.toHaveBeenCalled();
  });
  it.each(['p_user_id', 'email', 'role', 'organization_id'])('rejects caller-selected %s', async field => {
    const deps = setup(); expect((await provisionLeadershipRequest(request({ [field]: 'attacker-chosen' }), deps)).status).toBe(400);
    expect(deps.provision).not.toHaveBeenCalled();
  });
  it('passes only validated caller identity and fixed STGL owner mapping', async () => {
    const deps = setup(); const response = await provisionLeadershipRequest(request({}), deps);
    expect(response.status).toBe(200); expect(deps.provision).toHaveBeenCalledExactlyOnceWith(identity, 'stgl_owner');
    const text = await response.text(); expect(text).not.toContain(identity.email); expect(text).not.toContain(identity.id);
  });
  it('does not grant platform or Yalelo authority from STGL allowlisting', async () => {
    const deps = setup({ STGL_ADMIN_EMAIL_1: identity.email });
    await provisionLeadershipRequest(request(), deps);
    expect(deps.provision).toHaveBeenCalledExactlyOnceWith(identity, 'stgl_admin');
  });
  it('processes multiple categories only when separately allowlisted', async () => {
    const deps = setup({ STGL_OWNER_EMAIL_1: identity.email, YALELO_ADMIN_EMAIL_37: identity.email });
    const response = await provisionLeadershipRequest(request(), deps);
    expect(response.status).toBe(200); expect(deps.provision).toHaveBeenCalledTimes(2);
    expect(deps.provision).toHaveBeenNthCalledWith(1, identity, 'stgl_owner');
    expect(deps.provision).toHaveBeenNthCalledWith(2, identity, 'yalelo_admin');
  });
  it('reports existing history without attempting a replacement transaction', async () => {
    const deps = setup(); deps.provision = vi.fn(async () => 'already_processed' as const);
    expect(await (await provisionLeadershipRequest(request(), deps)).json()).toEqual({ results: [{ leadership_type: 'stgl_owner', status: 'already_processed' }] });
  });
  it('reports partial failures separately without exposing provider error details', async () => {
    const deps = setup({ STGL_OWNER_EMAIL_1: identity.email, YALELO_ADMIN_EMAIL_1: identity.email });
    deps.provision = vi.fn(async (_, type) => { if (type === 'yalelo_admin') throw new Error('private server details'); return 'provisioned' as const; });
    const response = await provisionLeadershipRequest(request(), deps);
    expect(response.status).toBe(207); expect(await response.text()).not.toContain('private server details');
  });
  it('rejects GET with 405', async () => { expect((await provisionLeadershipRequest(request(undefined, null, 'GET'), setup())).status).toBe(405); });
  it('returns no-store for identity-sensitive responses', async () => { expect((await provisionLeadershipRequest(request(), setup())).headers.get('Cache-Control')).toBe('no-store'); });
});

describe('restricted CORS', () => {
  it('allows same origin, but never wildcard origins', () => {
    expect(allowedRequestOrigin(new Request('https://spruceland.lovable.app/api/public/provision-leadership', { headers: { Origin: 'https://spruceland.lovable.app' } }))).toBe('https://spruceland.lovable.app');
    expect(allowedRequestOrigin(new Request('https://spruceland.lovable.app/api/public/provision-leadership', { headers: { Origin: 'https://untrusted.example' } }), '*')).toBe(false);
  });
  it('supports exact configured https origins and no-origin native requests', () => {
    expect(allowedRequestOrigin(new Request('https://spruceland.lovable.app/api/public/provision-leadership', { headers: { Origin: 'https://partners.example' } }), 'https://partners.example')).toBe('https://partners.example');
    expect(allowedRequestOrigin(request())).toBeNull();
  });
});