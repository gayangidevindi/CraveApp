import { theme, themes } from '../theme';

describe('theme palette', () => {
  it('uses the assignment primary orange', () => {
    expect(theme.colors.primary).toBe('#F97316');
  });

  it('keeps warm cream and dark brown available for accessible screens', () => {
    expect(theme.colors.warmCream).toBe('#FFF7ED');
    expect(theme.colors.darkBrown).toBe('#292524');
    expect(theme.colors.chocolateBrown).toBe('#4E342E');
  });

  it('defines the requested dark palette and high-contrast surfaces', () => {
    expect(theme.colors.background).toBe('#FFF7ED');
    expect(theme.colors.card).toBe('#FFFFFF');

    const darkTheme = themes.dark;
    expect(darkTheme.colors.background).toBe('#17120F');
    expect(darkTheme.colors.card).toBe('#29211D');
    expect(darkTheme.colors.elevatedSurface).toBe('#352A24');
    expect(darkTheme.colors.primary).toBe('#FB923C');
    expect(darkTheme.colors.deepOrange).toBe('#F97316');
    expect(darkTheme.colors.heading).toBe('#FFF7ED');
    expect(darkTheme.colors.text).toBe('#F5F5F4');
    expect(darkTheme.colors.secondaryText).toBe('#D6D3D1');
    expect(darkTheme.colors.border).toBe('#57473E');
  });

  it('provides shared spacing and typography tokens', () => {
    expect(theme.spacing.md).toBeGreaterThan(0);
    expect(theme.typography.body).toBeGreaterThan(0);
  });

  it('provides semantic feedback colours for both themes', () => {
    expect(theme.colors.successBackground).toBe('#DCFCE7');
    expect(theme.colors.errorBackground).toBe('#FEE2E2');
    expect(theme.colors.infoBackground).toBe('#DBEAFE');
    expect(theme.colors.warningBackground).toBe('#FEF3C7');

    const darkTheme = themes.dark;
    expect(darkTheme.colors.successBackground).toBe('#14532D');
    expect(darkTheme.colors.errorBackground).toBe('#7F1D1D');
    expect(darkTheme.colors.infoBackground).toBe('#1E3A8A');
    expect(darkTheme.colors.warningBackground).toBe('#78350F');
  });

  it('provides rounded corners and cross-platform shadow tokens', () => {
    expect(theme.radius.pill).toBeGreaterThan(theme.radius.lg);
    expect(theme.shadows.card.elevation).toBeGreaterThan(0);
    expect(theme.shadows.card.shadowRadius).toBeGreaterThan(0);
  });
});
