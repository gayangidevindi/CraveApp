const colors = {
  primary: '#F97316',
  deepOrange: '#EA580C',
  chocolateBrown: '#4E342E',
  darkBrown: '#292524',
  goldenYellow: '#FBBF24',
  softYellow: '#FEF3C7',
  warmCream: '#FFF7ED',
  white: '#FFFFFF',
} as const;

export const theme = {
  colors,
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 40,
  },
  radius: {
    sm: 8,
    md: 12,
    lg: 20,
    xl: 24,
    pill: 999,
  },
  typography: {
    caption: 13,
    label: 14,
    body: 16,
    subtitle: 18,
    heading: 22,
    title: 28,
    display: 32,
    lineHeight: {
      caption: 18,
      body: 24,
      heading: 30,
      title: 36,
    },
    weight: {
      regular: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
  },
  shadows: {
    card: {
      shadowColor: colors.darkBrown,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
      elevation: 3,
    },
    button: {
      shadowColor: colors.deepOrange,
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.18,
      shadowRadius: 6,
      elevation: 3,
    },
    floating: {
      shadowColor: colors.darkBrown,
      shadowOffset: { width: 0, height: 5 },
      shadowOpacity: 0.14,
      shadowRadius: 10,
      elevation: 5,
    },
  },
} as const;
