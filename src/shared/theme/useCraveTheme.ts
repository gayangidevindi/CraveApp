import { useMemo } from 'react';

import { useAppSelector } from '../../store/hooks';
import { themes, type CraveTheme } from './theme';

export function useCraveTheme() {
  const mode = useAppSelector((state) => state.theme.mode);
  return themes[mode];
}

export function useCraveThemeStyles<T>(
  createStyles: (theme: CraveTheme) => T,
) {
  const theme = useCraveTheme();
  const styles = useMemo(() => createStyles(theme), [theme, createStyles]);
  return { theme, styles };
}
