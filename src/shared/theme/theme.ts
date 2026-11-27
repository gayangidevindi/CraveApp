export type ThemeMode = 'light' | 'dark';

export interface ThemeColors {
  primary: string;
  deepOrange: string;
  chocolateBrown: string;
  darkBrown: string;
  goldenYellow: string;
  softYellow: string;
  warmCream: string;
  white: string;
  background: string;
  card: string;
  elevatedSurface: string;
  heading: string;
  text: string;
  secondaryText: string;
  border: string;
  onPrimary: string;
  overlay: string;
  shadow: string;
  success: string;
  successBackground: string;
  error: string;
  errorBackground: string;
  info: string;
  infoBackground: string;
  warning: string;
  warningBackground: string;
}

const sharedTokens = {
  spacing: {
    xxs: 2,
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 40,
  },
  radius: {
    sm: 10,
    md: 14,
    lg: 20,
    xl: 24,
    pill: 999,
  },
  typography: {
    overline: 11,
    caption: 12,
    label: 14,
    body: 16,
    subtitle: 18,
    heading: 22,
    title: 28,
    display: 32,
    lineHeight: {
      overline: 16,
      caption: 18,
      body: 24,
      heading: 30,
      title: 36,
      display: 40,
    },
    weight: {
      regular: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
  },
} as const;

const lightColors: ThemeColors = {
  primary: '#F97316',
  deepOrange: '#EA580C',
  chocolateBrown: '#4E342E',
  darkBrown: '#292524',
  goldenYellow: '#FBBF24',
  softYellow: '#FEF3C7',
  warmCream: '#FFF7ED',
  white: '#FFFFFF',
  background: '#FFF7ED',
  card: '#FFFFFF',
  elevatedSurface: '#FEF3C7',
  heading: '#4E342E',
  text: '#292524',
  secondaryText: '#78716C',
  border: '#E7E5E4',
  onPrimary: '#292524',
  overlay: 'rgba(41, 37, 36, 0.52)',
  shadow: '#292524',
  success: '#166534',
  successBackground: '#DCFCE7',
  error: '#B91C1C',
  errorBackground: '#FEE2E2',
  info: '#1D4ED8',
  infoBackground: '#DBEAFE',
  warning: '#92400E',
  warningBackground: '#FEF3C7',
};

const darkColors: ThemeColors = {
  primary: '#FB923C',
  deepOrange: '#F97316',
  chocolateBrown: '#D6D3D1',
  darkBrown: '#F5F5F4',
  goldenYellow: '#FBBF24',
  softYellow: '#352A24',
  warmCream: '#17120F',
  white: '#FFFFFF',
  background: '#17120F',
  card: '#29211D',
  elevatedSurface: '#352A24',
  heading: '#FFF7ED',
  text: '#F5F5F4',
  secondaryText: '#D6D3D1',
  border: '#57473E',
  onPrimary: '#292524',
  overlay: 'rgba(0, 0, 0, 0.72)',
  shadow: '#000000',
  success: '#86EFAC',
  successBackground: '#14532D',
  error: '#FCA5A5',
  errorBackground: '#7F1D1D',
  info: '#93C5FD',
  infoBackground: '#1E3A8A',
  warning: '#FCD34D',
  warningBackground: '#78350F',
};

export interface CraveTheme {
  mode: ThemeMode;
  colors: ThemeColors;
  spacing: typeof sharedTokens.spacing;
  radius: typeof sharedTokens.radius;
  typography: typeof sharedTokens.typography;
  shadows: {
    card: {
      shadowColor: string;
      shadowOffset: { width: number; height: number };
      shadowOpacity: number;
      shadowRadius: number;
      elevation: number;
    };
    button: {
      shadowColor: string;
      shadowOffset: { width: number; height: number };
      shadowOpacity: number;
      shadowRadius: number;
      elevation: number;
    };
    floating: {
      shadowColor: string;
      shadowOffset: { width: number; height: number };
      shadowOpacity: number;
      shadowRadius: number;
      elevation: number;
    };
  };
}

function createTheme(mode: ThemeMode, colors: ThemeColors): CraveTheme {
  const shadowOpacity = mode === 'dark' ? 0.28 : 0.08;

  return {
    mode,
    colors,
    ...sharedTokens,
    shadows: {
      card: {
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity,
        shadowRadius: 12,
        elevation: 3,
      },
      button: {
        shadowColor: colors.deepOrange,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: mode === 'dark' ? 0.24 : 0.18,
        shadowRadius: 6,
        elevation: 3,
      },
      floating: {
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: mode === 'dark' ? 0.38 : 0.14,
        shadowRadius: 10,
        elevation: 5,
      },
    },
  };
}

export const themes: Record<ThemeMode, CraveTheme> = {
  light: createTheme('light', lightColors),
  dark: createTheme('dark', darkColors),
};

export const theme = themes.light;
