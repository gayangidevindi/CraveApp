import {
  Image,
  StyleSheet,
  useWindowDimensions,
  type ImageSourcePropType,
} from 'react-native';

import { useCraveThemeStyles } from '../../../shared/theme/useCraveTheme';

interface AuthPhotoHeaderProps {
  source: ImageSourcePropType;
  accessibilityLabel: string;
  compact?: boolean;
}

export function AuthPhotoHeader({
  source,
  accessibilityLabel,
  compact = false,
}: AuthPhotoHeaderProps) {
  const { styles } = useCraveThemeStyles(createStyles);
  const { width, height } = useWindowDimensions();
  const headerHeight = compact
    ? Math.max(104, Math.min(width * 0.36, height * 0.19, 156))
    : Math.max(112, Math.min(width * 0.4, height * 0.24, 192));

  return (
    <Image
      source={source}
      resizeMode="cover"
      accessible
      accessibilityLabel={accessibilityLabel}
      style={[styles.image, { height: headerHeight }]}
    />
  );
}

function createStyles(theme: import('../../../shared/theme/theme').CraveTheme) {
  return StyleSheet.create({
    image: {
      width: '100%',
      backgroundColor: theme.colors.elevatedSurface,
    },
  });
}
