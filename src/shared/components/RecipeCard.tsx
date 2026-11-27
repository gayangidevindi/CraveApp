import { useEffect, useRef, useState, type ComponentProps } from 'react';
import { Feather } from '@expo/vector-icons';
import {
  Animated,
  Image,
  Pressable,
  Platform,
  StyleSheet,
  Text,
  View,
  type ImageSourcePropType,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { useCraveThemeStyles } from '../theme/useCraveTheme';
import { useReducedMotion } from '../hooks/useReducedMotion';

type FeatherIconName = ComponentProps<typeof Feather>['name'];

export interface RecipeCardProps {
  title: string;
  description?: string;
  category?: string;
  prepTime?: string;
  rating?: number;
  imageSource?: ImageSourcePropType;
  imagePlaceholderIcon?: FeatherIconName;
  isFavorite?: boolean;
  showFavorite?: boolean;
  featured?: boolean;
  favoriteDisabled?: boolean;
  onPress?: () => void;
  onFavoritePress?: () => void;
  style?: StyleProp<ViewStyle>;
}

export function RecipeCard({
  title,
  description,
  category,
  prepTime,
  rating,
  imageSource,
  imagePlaceholderIcon = 'coffee',
  isFavorite = false,
  showFavorite = false,
  featured = false,
  favoriteDisabled = false,
  onPress,
  onFavoritePress,
  style,
}: RecipeCardProps) {
  const { theme, styles } = useCraveThemeStyles(createStyles);
  const reducedMotion = useReducedMotion();
  const [failedImageKey, setFailedImageKey] = useState<string | null>(null);
  const [heartScale] = useState(() => new Animated.Value(1));
  const previousFavorite = useRef(isFavorite);
  const imageKey =
    typeof imageSource === 'object' &&
    imageSource !== null &&
    'uri' in imageSource
      ? imageSource.uri ?? ''
      : String(imageSource ?? '');

  useEffect(() => {
    if (previousFavorite.current === isFavorite) {
      return;
    }

    previousFavorite.current = isFavorite;
    if (reducedMotion) {
      heartScale.setValue(1);
      return;
    }

    const animation = Animated.sequence([
      Animated.spring(heartScale, {
        toValue: 1.22,
        useNativeDriver: Platform.OS !== 'web',
        speed: 26,
        bounciness: 7,
      }),
      Animated.spring(heartScale, {
        toValue: 1,
        useNativeDriver: Platform.OS !== 'web',
        speed: 26,
        bounciness: 4,
      }),
    ]);
    animation.start();
    return () => animation.stop();
  }, [heartScale, isFavorite, reducedMotion]);

  return (
    <View style={[styles.card, style]}>
      <Pressable
        onPress={onPress}
        disabled={!onPress}
        accessibilityRole={onPress ? 'button' : undefined}
        accessibilityLabel={onPress ? `View recipe: ${title}` : undefined}
        style={({ pressed }) => [
          styles.content,
          pressed && styles.pressed,
        ]}
      >
        <View
          style={[
            styles.imageContainer,
            featured && styles.featuredImageContainer,
          ]}
        >
          {imageSource && failedImageKey !== imageKey ? (
            <Image
              source={imageSource}
              resizeMode="cover"
              style={styles.image}
              accessible={false}
              onError={() => setFailedImageKey(imageKey)}
            />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Feather
                name={imagePlaceholderIcon}
                size={36}
                color={theme.colors.primary}
                accessible={false}
              />
            </View>
          )}
        </View>
        <View style={[styles.details, featured && styles.featuredDetails]}>
          {featured ? (
            <Text style={styles.featuredLabel}>TODAY&apos;S PICK</Text>
          ) : null}
          {category ? (
            <Text style={styles.category} numberOfLines={1}>
              {category}
            </Text>
          ) : null}
          <Text
            style={[styles.title, featured && styles.featuredTitle]}
            numberOfLines={2}
          >
            {title}
          </Text>
          {description ? (
            <Text style={styles.description} numberOfLines={2}>
              {description}
            </Text>
          ) : null}
          {prepTime || rating !== undefined ? (
            <View style={styles.metadata}>
              {prepTime ? (
                <View style={styles.metadataItem}>
                  <Feather
                    name="clock"
                    size={15}
                    color={theme.colors.chocolateBrown}
                    accessible={false}
                  />
                  <Text style={styles.metadataText}>{prepTime}</Text>
                </View>
              ) : null}
              {rating !== undefined ? (
                <View style={styles.metadataItem}>
                  <Feather
                    name="star"
                    size={15}
                    color={theme.colors.deepOrange}
                    accessible={false}
                  />
                  <Text style={styles.metadataText}>{rating.toFixed(1)}</Text>
                </View>
              ) : null}
            </View>
          ) : null}
        </View>
      </Pressable>
      {onFavoritePress ? (
        <Pressable
          onPress={onFavoritePress}
          disabled={favoriteDisabled}
          accessibilityRole="button"
          accessibilityLabel={
            isFavorite ? `Remove ${title} from favourites` : `Add ${title} to favourites`
          }
          accessibilityState={{
            selected: isFavorite,
            disabled: favoriteDisabled,
          }}
          hitSlop={4}
          style={styles.favoriteButton}
        >
          <Animated.View style={{ transform: [{ scale: heartScale }] }}>
            <Feather
              name="heart"
              size={20}
              color={
                isFavorite
                  ? theme.colors.deepOrange
                  : theme.colors.darkBrown
              }
              fill={isFavorite ? theme.colors.deepOrange : 'transparent'}
              accessible={false}
            />
          </Animated.View>
        </Pressable>
      ) : showFavorite ? (
        <View
          style={styles.favoriteButton}
          accessibilityElementsHidden
          accessible={false}
        >
          <Feather
            name="heart"
            size={20}
            color={theme.colors.darkBrown}
            accessible={false}
          />
        </View>
      ) : null}
    </View>
  );
}

function createStyles(theme: import('../theme/theme').CraveTheme) {
  return StyleSheet.create({
  card: {
    position: 'relative',
    width: '100%',
    overflow: 'hidden',
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.card,
    ...theme.shadows.card,
  },
  content: {
    width: '100%',
  },
  pressed: {
    transform: [{ scale: 0.99 }],
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 1.65,
    overflow: 'hidden',
    backgroundColor: theme.colors.softYellow,
  },
  featuredImageContainer: {
    aspectRatio: 2.2,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.softYellow,
  },
  details: {
    gap: theme.spacing.xs,
    padding: theme.spacing.md,
  },
  featuredDetails: {
    padding: theme.spacing.lg,
  },
  featuredLabel: {
    color: theme.colors.deepOrange,
    fontSize: theme.typography.overline,
    fontWeight: theme.typography.weight.bold,
    letterSpacing: 0.8,
  },
  category: {
    color: theme.colors.deepOrange,
    fontSize: theme.typography.caption,
    fontWeight: theme.typography.weight.semibold,
  },
  title: {
    color: theme.colors.heading,
    fontSize: theme.typography.heading,
    fontWeight: theme.typography.weight.bold,
    lineHeight: theme.typography.lineHeight.heading,
  },
  featuredTitle: {
    fontSize: theme.typography.title,
    lineHeight: theme.typography.lineHeight.title,
  },
  description: {
    color: theme.colors.chocolateBrown,
    fontSize: theme.typography.body,
    lineHeight: theme.typography.lineHeight.body,
  },
  metadata: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
    marginTop: theme.spacing.xs,
  },
  metadataItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  metadataText: {
    color: theme.colors.darkBrown,
    fontSize: theme.typography.caption,
  },
  favoriteButton: {
    position: 'absolute',
    top: theme.spacing.sm,
    right: theme.spacing.sm,
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.floating,
  },
  });
}
