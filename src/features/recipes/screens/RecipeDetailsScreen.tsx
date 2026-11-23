import { Feather } from '@expo/vector-icons';
import type { SerializedError } from '@reduxjs/toolkit';
import type { FetchBaseQueryError } from '@reduxjs/toolkit/query';
import { useEffect, useState } from 'react';
import {
  Image,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { MainStackParamList } from '../../../navigation/types';
import { EmptyState } from '../../../shared/components/EmptyState';
import { ErrorState } from '../../../shared/components/ErrorState';
import { LoadingState } from '../../../shared/components/LoadingState';
import { OfflineBanner } from '../../../shared/components/OfflineBanner';
import {
  loadUserFavourites,
  toggleUserFavourite,
} from '../state/favouritesSlice';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { theme } from '../../../shared/theme/theme';
import { useGetRecipeDetailsQuery } from '../services/mealApi';
import {
  parseRecipeIngredients,
  parseRecipeInstructions,
} from '../utils/recipeDetails';

type Props = NativeStackScreenProps<MainStackParamList, 'RecipeDetails'>;
type QueryError = FetchBaseQueryError | SerializedError | undefined;

function getErrorMessage(error: QueryError): string {
  if (error && 'status' in error && error.status === 'CUSTOM_ERROR') {
    return error.error;
  }

  if (error && 'status' in error && error.status === 'FETCH_ERROR') {
    return 'Unable to reach TheMealDB. Check your connection and try again.';
  }

  return 'This recipe could not be loaded. Please try again.';
}

export function RecipeDetailsScreen({ navigation, route }: Props) {
  const dispatch = useAppDispatch();
  const { width } = useWindowDimensions();
  const [imageFailed, setImageFailed] = useState(false);
  const [tutorialError, setTutorialError] = useState<string | null>(null);
  const recipeId = route.params.recipeId.trim();
  const user = useAppSelector((state) => state.auth.user);
  const userId = user ? String(user.id) : null;
  const isOffline = useAppSelector((state) => state.network.isOffline);
  const favouritesState = useAppSelector((state) => state.favourites);
  const favourites = userId
    ? (favouritesState.byUser[userId] ?? [])
    : [];
  const favouritesLoaded =
    userId !== null && favouritesState.loadedByUser[userId] === true;
  const favouritesSaving =
    userId !== null && favouritesState.savingByUser[userId] === true;
  const favouritesError =
    userId !== null ? favouritesState.errorByUser[userId] : null;
  const isFavorite = favourites.some(
    (favourite) => favourite.idMeal === recipeId,
  );

  useEffect(() => {
    if (
      userId !== null &&
      favouritesState.loadedByUser[userId] !== true &&
      favouritesState.loadingByUser[userId] !== true
    ) {
      void dispatch(loadUserFavourites(userId));
    }
  }, [
    dispatch,
    favouritesState.loadedByUser,
    favouritesState.loadingByUser,
    userId,
  ]);

  const {
    data: meal,
    isError,
    isLoading,
    error,
    refetch,
  } = useGetRecipeDetailsQuery(recipeId, { skip: recipeId.length === 0 });

  const openTutorial = async (url: string) => {
    try {
      const parsedUrl = new URL(url);
      const isYoutubeUrl =
        parsedUrl.protocol === 'https:' &&
        (parsedUrl.hostname === 'youtube.com' ||
          parsedUrl.hostname.endsWith('.youtube.com') ||
          parsedUrl.hostname === 'youtu.be');

      if (!isYoutubeUrl) {
        setTutorialError('The tutorial link is not a valid YouTube address.');
        return;
      }

      await Linking.openURL(parsedUrl.toString());
      setTutorialError(null);
    } catch {
      setTutorialError(
        'Could not open the tutorial. Please try again or open YouTube manually.',
      );
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        {isOffline ? <OfflineBanner /> : null}
        <LoadingState label="Loading recipe details..." />
      </SafeAreaView>
    );
  }

  if (isError) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        {isOffline ? <OfflineBanner /> : null}
        <ErrorState
          title="Recipe unavailable"
          message={getErrorMessage(error)}
          retryLabel="Try again"
          onRetry={() => {
            void refetch();
          }}
        />
      </SafeAreaView>
    );
  }

  if (!meal) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        {isOffline ? <OfflineBanner /> : null}
        <EmptyState
          title="Recipe not found"
          message={
            recipeId
              ? 'This recipe is no longer available from TheMealDB.'
              : 'A valid recipe ID is required to show details.'
          }
          icon="coffee"
          actionLabel="Go back"
          onAction={() => navigation.goBack()}
        />
      </SafeAreaView>
    );
  }

  const ingredients = parseRecipeIngredients(meal);
  const instructions = parseRecipeInstructions(meal.strInstructions);
  const youtubeUrl = meal.strYoutube?.trim();
  const imageWidth = Math.min(width - theme.spacing.lg * 2, 720);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          width >= 760 && styles.wideScrollContent,
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.content, { maxWidth: imageWidth }]}>
          {isOffline ? <OfflineBanner /> : null}
          <View style={styles.actions}>
            <Pressable
              onPress={() => {
                if (userId !== null) {
                  void dispatch(toggleUserFavourite({ userId, meal }));
                }
              }}
              disabled={
                userId === null || !favouritesLoaded || favouritesSaving
              }
              accessibilityRole="button"
              accessibilityLabel={
                isFavorite
                  ? `Remove ${meal.strMeal} from favourites`
                  : `Add ${meal.strMeal} to favourites`
              }
              accessibilityState={{
                selected: isFavorite,
                disabled:
                  userId === null || !favouritesLoaded || favouritesSaving,
              }}
              hitSlop={4}
              style={({ pressed }) => [
                styles.iconButton,
                pressed && styles.pressed,
                (userId === null || !favouritesLoaded || favouritesSaving) &&
                  styles.disabled,
              ]}
            >
              <Feather
                name="heart"
                size={22}
                color={isFavorite ? theme.colors.deepOrange : theme.colors.darkBrown}
                accessible={false}
              />
            </Pressable>
          </View>
          {favouritesError ? (
            <Text style={styles.favoriteError} accessibilityRole="alert">
              {favouritesError}
            </Text>
          ) : null}

          {meal.strMealThumb && !imageFailed ? (
            <Image
              key={meal.idMeal}
              source={{ uri: meal.strMealThumb }}
              resizeMode="cover"
              onError={() => setImageFailed(true)}
              accessibilityLabel={`${meal.strMeal} recipe`}
              style={[styles.heroImage, { height: imageWidth / 1.45 }]}
            />
          ) : (
            <View
              style={[styles.imagePlaceholder, { height: imageWidth / 1.45 }]}
              accessible={false}
            >
              <Feather
                name="coffee"
                size={44}
                color={theme.colors.deepOrange}
                accessible={false}
              />
            </View>
          )}

          <Text style={styles.title}>{meal.strMeal}</Text>

          <View style={styles.metadata}>
            {meal.strCategory ? (
              <View style={styles.metadataChip}>
                <Feather
                  name="tag"
                  size={15}
                  color={theme.colors.deepOrange}
                  accessible={false}
                />
                <Text style={styles.metadataText}>{meal.strCategory}</Text>
              </View>
            ) : null}
            {meal.strArea ? (
              <View style={styles.metadataChip}>
                <Feather
                  name="globe"
                  size={15}
                  color={theme.colors.deepOrange}
                  accessible={false}
                />
                <Text style={styles.metadataText}>{meal.strArea} cuisine</Text>
              </View>
            ) : null}
          </View>

          {meal.strTags ? (
            <Text style={styles.tags}>
              {meal.strTags
                .split(',')
                .map((tag) => tag.trim())
                .filter(Boolean)
                .join('  ·  ')}
            </Text>
          ) : null}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Ingredients ({ingredients.length})
            </Text>
            {ingredients.length > 0 ? (
              <View style={styles.ingredientList}>
                {ingredients.map(({ ingredient, measure }, index) => (
                  <View
                    key={`${meal.idMeal}-${index}`}
                    style={styles.ingredientRow}
                  >
                    <Feather
                      name="check-circle"
                      size={17}
                      color={theme.colors.deepOrange}
                      accessible={false}
                    />
                    <Text style={styles.ingredientText}>
                      {measure ? `${measure} ` : ''}
                      {ingredient}
                    </Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.emptyCopy}>
                Ingredient details are not available for this recipe.
              </Text>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Instructions</Text>
            {instructions.length > 0 ? (
              <View style={styles.instructionList}>
                {instructions.map((instruction, index) => (
                  <View
                    key={`${meal.idMeal}-step-${index}`}
                    style={styles.instructionRow}
                  >
                    {instruction.number ? (
                      <View style={styles.stepNumber}>
                        <Text style={styles.stepNumberText}>
                          {instruction.number}
                        </Text>
                      </View>
                    ) : null}
                    <Text
                      style={[
                        styles.instructionText,
                        instruction.number === undefined &&
                          styles.paragraphInstruction,
                      ]}
                    >
                      {instruction.text}
                    </Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.emptyCopy}>
                Cooking instructions are not available for this recipe.
              </Text>
            )}
          </View>

          {youtubeUrl ? (
            <View style={styles.tutorialSection}>
              <Pressable
                onPress={() => {
                  void openTutorial(youtubeUrl);
                }}
                accessibilityRole="button"
                accessibilityLabel="Open recipe video on YouTube"
                style={({ pressed }) => [
                  styles.tutorialButton,
                  pressed && styles.pressed,
                ]}
              >
                <Feather
                  name="youtube"
                  size={19}
                  color={theme.colors.white}
                  accessible={false}
                />
                <Text style={styles.tutorialButtonText}>Watch tutorial</Text>
              </Pressable>
              {tutorialError ? (
                <Text style={styles.tutorialError} accessibilityRole="alert">
                  {tutorialError}
                </Text>
              ) : null}
            </View>
          ) : null}

          <Text style={styles.attribution}>
            Recipe data and imagery provided by TheMealDB.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.warmCream,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  wideScrollContent: {
    paddingHorizontal: theme.spacing.xl,
  },
  content: {
    width: '100%',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: theme.spacing.sm,
  },
  iconButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.white,
    ...theme.shadows.card,
  },
  pressed: {
    opacity: 0.75,
  },
  favoriteError: {
    marginTop: theme.spacing.xs,
    color: theme.colors.deepOrange,
    fontSize: theme.typography.caption,
    textAlign: 'right',
  },
  disabled: {
    opacity: 0.6,
  },
  heroImage: {
    width: '100%',
    marginTop: theme.spacing.md,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.softYellow,
  },
  imagePlaceholder: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: theme.spacing.md,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.softYellow,
  },
  title: {
    marginTop: theme.spacing.lg,
    color: theme.colors.darkBrown,
    fontSize: theme.typography.title,
    fontWeight: theme.typography.weight.bold,
    lineHeight: theme.typography.lineHeight.title,
  },
  metadata: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.md,
  },
  metadataChip: {
    minHeight: 36,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.softYellow,
  },
  metadataText: {
    color: theme.colors.darkBrown,
    fontSize: theme.typography.caption,
    fontWeight: theme.typography.weight.semibold,
  },
  tags: {
    marginTop: theme.spacing.sm,
    color: theme.colors.chocolateBrown,
    fontSize: theme.typography.caption,
  },
  section: {
    marginTop: theme.spacing.xl,
  },
  sectionTitle: {
    marginBottom: theme.spacing.md,
    color: theme.colors.darkBrown,
    fontSize: theme.typography.heading,
    fontWeight: theme.typography.weight.bold,
  },
  ingredientList: {
    gap: theme.spacing.sm,
    padding: theme.spacing.md,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.white,
    ...theme.shadows.card,
  },
  ingredientRow: {
    minHeight: 32,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  ingredientText: {
    flex: 1,
    color: theme.colors.darkBrown,
    fontSize: theme.typography.body,
    lineHeight: theme.typography.lineHeight.body,
  },
  instructionList: {
    gap: theme.spacing.md,
  },
  instructionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.sm,
  },
  stepNumber: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.primary,
  },
  stepNumberText: {
    color: theme.colors.white,
    fontSize: theme.typography.caption,
    fontWeight: theme.typography.weight.bold,
  },
  instructionText: {
    flex: 1,
    color: theme.colors.darkBrown,
    fontSize: theme.typography.body,
    lineHeight: theme.typography.lineHeight.body,
  },
  paragraphInstruction: {
    marginBottom: theme.spacing.xs,
  },
  emptyCopy: {
    color: theme.colors.chocolateBrown,
    fontSize: theme.typography.body,
    lineHeight: theme.typography.lineHeight.body,
  },
  tutorialSection: {
    marginTop: theme.spacing.xl,
  },
  tutorialButton: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.deepOrange,
    ...theme.shadows.button,
  },
  tutorialButtonText: {
    color: theme.colors.white,
    fontSize: theme.typography.body,
    fontWeight: theme.typography.weight.bold,
  },
  tutorialError: {
    marginTop: theme.spacing.sm,
    color: theme.colors.deepOrange,
    fontSize: theme.typography.caption,
    lineHeight: theme.typography.lineHeight.caption,
    textAlign: 'center',
  },
  attribution: {
    marginTop: theme.spacing.xl,
    color: theme.colors.chocolateBrown,
    fontSize: theme.typography.caption,
    textAlign: 'center',
  },
});
