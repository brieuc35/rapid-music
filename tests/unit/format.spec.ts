import { compactNumber, initials, timeAgo } from '@/utils/format';

describe('compactNumber', () => {
  it('laisse les petits nombres tels quels', () => {
    expect(compactNumber(0)).toBe('0');
    expect(compactNumber(999)).toBe('999');
  });

  it('formate les milliers avec un séparateur français', () => {
    expect(compactNumber(1000)).toBe('1 k');
    expect(compactNumber(14200)).toBe('14,2 k');
  });

  it('formate les millions', () => {
    expect(compactNumber(1800000)).toBe('1,8 M');
  });
});

describe('initials', () => {
  it('prend jusqu\'à deux initiales', () => {
    expect(initials('Nova Beats')).toBe('NB');
    expect(initials('LYOR')).toBe('L');
  });
});

describe('timeAgo', () => {
  const now = new Date('2026-07-24T12:00:00Z');

  it('gère l\'instant présent', () => {
    expect(timeAgo('2026-07-24T11:59:30Z', now)).toBe("à l'instant");
  });

  it('calcule les heures', () => {
    expect(timeAgo('2026-07-24T09:00:00Z', now)).toBe('il y a 3 h');
  });

  it('calcule les jours', () => {
    expect(timeAgo('2026-07-22T12:00:00Z', now)).toBe('il y a 2 j');
  });
});
