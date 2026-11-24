import { describe, expect, it } from 'vitest';
import { isInternalRole, parseClientContext } from './account-access';

describe('account access boundaries', () => {
  it('only recognizes the five existing internal roles', () => {
    expect(['owner', 'head_tech', 'technician', 'administrator', 'crm'].every(isInternalRole)).toBe(true);
    expect(isInternalRole('Client Admin')).toBe(false);
    expect(isInternalRole(null)).toBe(false);
    expect(isInternalRole('super_admin')).toBe(false);
  });
  it('rejects incomplete company/store profiles', () => {
    expect(parseClientContext({ clientId: 'yalelo', role: 'owner' })).toBeNull();
    expect(parseClientContext(null)).toBeNull();
  });
});