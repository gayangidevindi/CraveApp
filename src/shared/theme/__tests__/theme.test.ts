import { theme } from '../theme';

describe('theme palette', () => {
  it('uses the assignment primary orange', () => {
    expect(theme.colors.primary).toBe('#F97316');
  });

  it('keeps warm cream and dark brown available for accessible screens', () => {
    expect(theme.colors.warmCream).toBe('#FFF7ED');
    expect(theme.colors.darkBrown).toBe('#292524');
  });

  it('provides shared spacing and typography tokens', () => {
    expect(theme.spacing.md).toBeGreaterThan(0);
    expect(theme.typography.body).toBeGreaterThan(0);
  });
});
