import { Feather } from '@expo/vector-icons';
import type { SerializedError } from '@reduxjs/toolkit';
import type { FetchBaseQueryError } from '@reduxjs/toolkit/query';
import { useEffect, useState } from 'react';
import {
  Animated,
  Image,
  Linking,
  Platform,
  Pressable,
  Share,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { MainStackParamList } from '../../../navigation/types';
import { EmptyState } from '../../../shared/components/EmptyState';
import { ErrorState } from '../../../shared/components/ErrorState';
import { LoadingState } from '../../../shared/components/LoadingState';
import { OfflineBanner } from '../../../shared/components/OfflineBanner';
import { ToastMessage } from '../../../shared/components/ToastMessage';
import { useReducedMotion } from '../../../shared/hooks/useReducedMotion';
import {
  loadUserFavourites,
  toggleUserFavourite,
} from '../state/favouritesSlice';
import {
  loadRecentlyViewed,
  recordRecentlyViewed,
} from '../state/recentlyViewedSlice';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { useCraveThemeStyles } from '../../../shared/theme/useCraveTheme';
import { useGetRecipeDetailsQuery } from '../services/mealApi';
import {
  readIngredientChecklist,
  saveIngredientChecklist,
} from '../services/ingredientChecklistStorage';
import {
  parseRecipeIngredients,
  parseRecipeInstructions,
} from '../utils/recipeDetails';
import { extractCookingDuration } from '../utils/cookingMode';
import { CookingModeModal } from '../components/CookingModeModal';

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
  const { theme, styles } = useCraveThemeStyles(createStyles);
  const dispatch = useAppDispatch();
  const { width } = useWindowDimensions();
  const reducedMotion = useReducedMotion();
  const [heartScale] = useState(() => new Animated.Value(1));
  const [imageFailed, setImageFailed] = useState(false);
  const [tutorialError, setTutorialError] = useState<string | null>(null);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);
  const [checkedIngredients, setCheckedIngredients] = useState<string[]>([]);
  const [checklistLoadedFor, setChecklistLoadedFor] = useState<string | null>(
    null,
  );
  const [checklistSaving, setChecklistSaving] = useState(false);
  const [checklistError, setChecklistError] = useState<string | null>(null);
  const [cookingMode, setCookingMode] = useState(false);
  const recipeId = route.params.recipeId.trim();
  const user = useAppSelector((state) => state.auth.user);
  const userId = user ? String(user.id) : null;
  const isOffline = useAppSelector((state) => state.network.isOffline);
  const favouritesState = useAppSelector((state) => state.favourites);
  const recentlyViewedState = useAppSelector((state) => state.recentlyViewed);
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
  const recentlyViewedLoaded =
    userId !== null &&
    recentlyViewedState.loadedByUser[userId] === true;

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

  useEffect(() => {
    if (
      userId !== null &&
      recentlyViewedState.loadedByUser[userId] !== true &&
      recentlyViewedState.loadingByUser[userId] !== true
    ) {
      void dispatch(loadRecentlyViewed(userId));
    }
  }, [
    dispatch,
    recentlyViewedState.loadedByUser,
    recentlyViewedState.loadingByUser,
    userId,
  ]);

  const {
    data: meal,
    isError,
    isLoading,
    error,
    refetch,
  } = useGetRecipeDetailsQuery(recipeId, { skip: recipeId.length === 0 });

  useEffect(() => {
    if (userId !== null && recentlyViewedLoaded && meal) {
      void dispatch(recordRecentlyViewed({ userId, meal }));
    }
  }, [dispatch, meal, recentlyViewedLoaded, userId]);

  useEffect(() => {
    if (userId === null || meal === null || meal === undefined) {
      return;
    }

    const checklistKey = `${userId}/${recipeId}`;
    let active = true;
    void readIngredientChecklist(userId, recipeId)
      .then((items) => {
        if (active) {
          setCheckedIngredients(items);
          setChecklistLoadedFor(checklistKey);
          setChecklistError(null);
        }
      })
      .catch((error: unknown) => {
        if (active) {
          setChecklistError(
            error instanceof Error
              ? error.message
              : 'Saved ingredient checklist could not be loaded.',
          );
          setChecklistLoadedFor(checklistKey);
        }
      });

    return () => {
      active = false;
    };
  }, [meal, recipeId, userId]);

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

  const toggleFavourite = async () => {
    if (userId === null || meal === null || meal === undefined) {
      return;
    }

    if (!reducedMotion) {
      Animated.sequence([
        Animated.spring(heartScale, {
          toValue: 1.22,
          useNativeDriver: true,
          speed: 28,
          bounciness: 8,
        }),
        Animated.spring(heartScale, {
          toValue: 1,
          useNativeDriver: true,
          speed: 28,
          bounciness: 3,
        }),
      ]).start();
    }

    try {
      await dispatch(toggleUserFavourite({ userId, meal })).unwrap();
      setActionFeedback(
        isFavorite
          ? 'Recipe removed from favourites.'
          : 'Recipe added to favourites.',
      );
    } catch {
      setActionFeedback('Favourite could not be updated. Please try again.');
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
  const checklistKey = userId === null ? null : `${userId}/${recipeId}`;
  const checklistReady =
    checklistKey !== null && checklistLoadedFor === checklistKey;
  const checkedIngredientCount = ingredients.filter((ingredient, index) =>
    checkedIngredients.includes(`${index}:${ingredient.ingredient}`),
  ).length;

  const updateChecklist = async (nextChecked: string[]) => {
    if (userId === null) {
      setChecklistError('Sign in to save ingredient checklist progress.');
      return;
    }

    setChecklistSaving(true);
    setChecklistError(null);
    try {
      await saveIngredientChecklist(userId, recipeId, nextChecked);
      setCheckedIngredients(nextChecked);
      setActionFeedback('Ingredient checklist updated.');
    } catch (checklistSaveError) {
      setChecklistError(
        checklistSaveError instanceof Error
          ? checklistSaveError.message
          : 'Ingredient checklist could not be saved.',
      );
    } finally {
      setChecklistSaving(false);
    }
  };

  const shareRecipe = async () => {
    try {
      const sourceUrl =
        typeof meal.strSource === 'string' && meal.strSource.startsWith('https://')
          ? meal.strSource
          : `https://www.themealdb.com/meal/${encodeURIComponent(meal.idMeal)}`;
      if (Platform.OS === 'web') {
        if (typeof navigator !== 'undefined' && navigator.share) {
          try {
            await navigator.share({
              title: meal.strMeal,
              text: `Recipe details: ${sourceUrl}`,
              url: sourceUrl,
            });
          } catch (error) {
            if (error instanceof Error && error.name === 'AbortError') {
              return;
            }
            throw error;
          }
          setActionFeedback('Recipe ready to share.');
        } else {
          const copied = await Clipboard.setStringAsync(
            `${meal.strMeal}\nRecipe details: ${sourceUrl}`,
          );
          if (!copied) {
            throw new Error('Clipboard access was not available.');
          }
          setActionFeedback('Recipe link copied to clipboard.');
        }
      } else {
        const result = await Share.share(
          {
            title: meal.strMeal,
            message: `${meal.strMeal}\nRecipe details: ${sourceUrl}`,
            url: sourceUrl,
          },
          { dialogTitle: `Share ${meal.strMeal}` },
        );
        if (result.action !== Share.dismissedAction) {
          setActionFeedback('Recipe ready to share.');
        }
      }
    } catch {
      setActionFeedback('Could not open the share menu. Please try again.');
    }
  };

  const copyIngredients = async () => {
    if (ingredients.length === 0) {
      setActionFeedback('No ingredients are available to copy.');
      return;
    }

    try {
      const ingredientText = [
        `${meal.strMeal} - ingredients`,
        ...ingredients.map(
          ({ ingredient, measure }) =>
            `- ${measure ? `${measure} ` : ''}${ingredient}`,
        ),
      ].join('\n');
      const copied = await Clipboard.setStringAsync(ingredientText);
      if (!copied) {
        throw new Error('Clipboard access was not available.');
      }
      setActionFeedback('Ingredients copied to clipboard.');
    } catch {
      setActionFeedback(
        'Could not copy ingredients. Check clipboard permissions and try again.',
      );
    }
  };

  const openCookingMode = () => {
    if (instructions.length === 0) {
      return;
    }
    setCookingMode(true);
  };

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
                void toggleFavourite();
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
              <Animated.View style={{ transform: [{ scale: heartScale }] }}>
                <Feather
                  name="heart"
                  size={22}
                  color={isFavorite ? theme.colors.deepOrange : theme.colors.darkBrown}
                  fill={isFavorite ? theme.colors.deepOrange : 'transparent'}
                  accessible={false}
                />
              </Animated.View>
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
              Ingredients ({checkedIngredientCount}/{ingredients.length} checked)
            </Text>
            {ingredients.length > 0 ? (
              <View style={styles.ingredientActions}>
                <Pressable
                  onPress={() => {
                    void copyIngredients();
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="Copy ingredients to clipboard"
                  style={styles.secondaryAction}
                >
                  <Feather
                    name="copy"
                    size={17}
                    color={theme.colors.deepOrange}
                    accessible={false}
                  />
                  <Text style={styles.secondaryActionText}>Copy ingredients</Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    void updateChecklist([]);
                  }}
                  disabled={!checklistReady || checklistSaving}
                  accessibilityRole="button"
                  accessibilityLabel="Reset ingredient checklist"
                  accessibilityState={{
                    disabled: !checklistReady || checklistSaving,
                  }}
                  style={[
                    styles.secondaryAction,
                    (!checklistReady || checklistSaving) && styles.disabled,
                  ]}
                >
                  <Feather
                    name="rotate-ccw"
                    size={17}
                    color={theme.colors.deepOrange}
                    accessible={false}
                  />
                  <Text style={styles.secondaryActionText}>Reset</Text>
                </Pressable>
              </View>
            ) : null}
            {checklistError ? (
              <Text style={styles.tutorialError} accessibilityRole="alert">
                {checklistError}
              </Text>
            ) : null}
            {ingredients.length > 0 ? (
              <View style={styles.ingredientList}>
                {ingredients.map(({ ingredient, measure }, index) => (
                  <Pressable
                    key={`${meal.idMeal}-${index}`}
                    onPress={() => {
                      const itemKey = `${index}:${ingredient}`;
                      const nextChecked = checkedIngredients.includes(itemKey)
                        ? checkedIngredients.filter((item) => item !== itemKey)
                        : [...checkedIngredients, itemKey];
                      void updateChecklist(nextChecked);
                    }}
                    disabled={!checklistReady || checklistSaving}
                    accessibilityRole="checkbox"
                    accessibilityLabel={`${measure ? `${measure} ` : ''}${ingredient}`}
                    accessibilityState={{
                      checked: checkedIngredients.includes(
                        `${index}:${ingredient}`,
                      ),
                      disabled: !checklistReady || checklistSaving,
                    }}
                    style={styles.ingredientRow}
                  >
                    <Feather
                      name={
                        checkedIngredients.includes(`${index}:${ingredient}`)
                          ? 'check-square'
                          : 'square'
                      }
                      size={20}
                      color={theme.colors.deepOrange}
                      accessible={false}
                    />
                    <Text
                      style={[
                        styles.ingredientText,
                        checkedIngredients.includes(`${index}:${ingredient}`) &&
                          styles.checkedIngredientText,
                      ]}
                    >
                      {measure ? `${measure} ` : ''}
                      {ingredient}
                    </Text>
                  </Pressable>
                ))}
              </View>
            ) : (
              <Text style={styles.emptyCopy}>
                Ingredient details are not available for this recipe.
              </Text>
            )}
          </View>

          <View style={styles.section}>
            <View style={styles.instructionsHeader}>
              <View style={styles.instructionHeadingGroup}>
                <Text
                  style={[
                    styles.sectionTitle,
                    styles.instructionSectionTitle,
                  ]}
                >
                  Cooking Instructions
                </Text>
                <Text style={styles.instructionCount}>
                  {instructions.length}{' '}
                  {instructions.length === 1 ? 'valid step' : 'valid steps'}
                </Text>
              </View>
              <Pressable
                onPress={openCookingMode}
                disabled={instructions.length === 0}
                accessibilityRole="button"
                accessibilityLabel={
                  instructions.length > 0
                    ? 'Start Cooking Mode'
                    : 'Cooking Mode unavailable because there are no valid instructions'
                }
                accessibilityState={{ disabled: instructions.length === 0 }}
                style={({ pressed }) => [
                  styles.cookingModeButton,
                  instructions.length === 0 && styles.disabled,
                  pressed && styles.pressed,
                ]}
              >
                <Feather
                  name={instructions.length > 0 ? 'play' : 'info'}
                  size={17}
                  color={theme.colors.onPrimary}
                  accessible={false}
                />
                <Text style={styles.cookingModeButtonText}>
                  {instructions.length > 0
                    ? 'Start Cooking'
                    : 'Unavailable'}
                </Text>
              </Pressable>
            </View>
            {instructions.length > 0 ? (
              <View style={styles.instructionList}>
                {instructions.map((instruction) => {
                  const duration = extractCookingDuration(instruction.text);

                  return (
                    <View
                      key={`${meal.idMeal}-step-${instruction.number}`}
                      style={styles.instructionCard}
                    >
                      <View style={styles.instructionStepHeader}>
                        <View style={styles.stepNumber}>
                          <Text style={styles.stepNumberText}>
                            {instruction.number}
                          </Text>
                        </View>
                        <Text style={styles.instructionStepTitle}>
                          Step {instruction.number}
                        </Text>
                        {duration ? (
                          <View style={styles.instructionDurationChip}>
                            <Feather
                              name="clock"
                              size={14}
                              color={theme.colors.deepOrange}
                              accessible={false}
                            />
                            <Text style={styles.instructionDurationText}>
                              {duration.label}
                            </Text>
                          </View>
                        ) : null}
                      </View>
                      <Text style={styles.instructionText}>
                        {instruction.text}
                      </Text>
                    </View>
                  );
                })}
              </View>
            ) : (
              <Text style={styles.emptyCopy}>
                No valid cooking instructions are available for this recipe.
              </Text>
            )}
          </View>

          <View style={styles.tutorialSection}>
            {youtubeUrl ? (
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
                  color={theme.colors.onPrimary}
                  accessible={false}
                />
                <Text style={styles.tutorialButtonText}>Watch tutorial</Text>
              </Pressable>
            ) : (
              <Text style={styles.emptyCopy}>
                No YouTube tutorial is available for this recipe.
              </Text>
            )}
            {tutorialError ? (
              <Text style={styles.tutorialError} accessibilityRole="alert">
                {tutorialError}
              </Text>
            ) : null}
          </View>

          <Pressable
            onPress={() => {
              void shareRecipe();
            }}
            accessibilityRole="button"
            accessibilityLabel={`Share ${meal.strMeal}`}
            style={({ pressed }) => [
              styles.shareButton,
              pressed && styles.pressed,
            ]}
          >
            <Feather
              name="share-2"
              size={18}
              color={theme.colors.deepOrange}
              accessible={false}
            />
            <Text style={styles.shareButtonText}>Share recipe</Text>
          </Pressable>

          <Text style={styles.attribution}>
            Recipe data and imagery provided by TheMealDB.
          </Text>
        </View>
      </ScrollView>

      {cookingMode ? (
        <CookingModeModal
          meal={meal}
          instructions={instructions}
          onClose={() => setCookingMode(false)}
        />
      ) : null}
      <View style={styles.toastContainer} pointerEvents="box-none">
        <ToastMessage
          message={actionFeedback}
          tone={
            actionFeedback?.toLowerCase().includes('could not')
              ? 'error'
              : 'success'
          }
          onDismiss={() => setActionFeedback(null)}
        />
      </View>
    </SafeAreaView>
  );
}

function createStyles(theme: import('../../../shared/theme/theme').CraveTheme) {
  return StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
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
  toastContainer: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    left: 0,
  },
  iconButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.card,
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
    color: theme.colors.heading,
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
    color: theme.colors.heading,
    fontSize: theme.typography.heading,
    fontWeight: theme.typography.weight.bold,
  },
  ingredientList: {
    gap: theme.spacing.sm,
    padding: theme.spacing.md,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.card,
    ...theme.shadows.card,
  },
  ingredientActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  secondaryAction: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
  },
  secondaryActionText: {
    color: theme.colors.deepOrange,
    fontSize: theme.typography.caption,
    fontWeight: theme.typography.weight.semibold,
  },
  ingredientRow: {
    minHeight: 48,
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
  checkedIngredientText: {
    color: theme.colors.secondaryText,
    textDecorationLine: 'line-through',
  },
  instructionsHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  instructionHeadingGroup: {
    flex: 1,
    gap: 2,
  },
  instructionSectionTitle: {
    marginBottom: 0,
  },
  instructionCount: {
    color: theme.colors.secondaryText,
    fontSize: theme.typography.caption,
  },
  cookingModeButton: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.deepOrange,
  },
  cookingModeButtonText: {
    color: theme.colors.onPrimary,
    fontSize: theme.typography.caption,
    fontWeight: theme.typography.weight.bold,
  },
  instructionList: {
    gap: theme.spacing.md,
  },
  instructionCard: {
    gap: theme.spacing.sm,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.card,
    ...theme.shadows.card,
  },
  instructionStepHeader: {
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    flexWrap: 'wrap',
  },
  stepNumber: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.deepOrange,
  },
  stepNumberText: {
    color: theme.colors.white,
    fontSize: theme.typography.caption,
    fontWeight: theme.typography.weight.bold,
  },
  instructionStepTitle: {
    color: theme.colors.heading,
    fontSize: theme.typography.body,
    fontWeight: theme.typography.weight.bold,
  },
  instructionDurationChip: {
    minHeight: 32,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.softYellow,
  },
  instructionDurationText: {
    color: theme.colors.deepOrange,
    fontSize: theme.typography.caption,
    fontWeight: theme.typography.weight.semibold,
  },
  instructionText: {
    color: theme.colors.darkBrown,
    fontSize: theme.typography.body,
    lineHeight: theme.typography.lineHeight.body,
  },
  emptyCopy: {
    color: theme.colors.chocolateBrown,
    fontSize: theme.typography.body,
    lineHeight: theme.typography.lineHeight.body,
  },
  tutorialSection: {
    marginTop: theme.spacing.xl,
    gap: theme.spacing.sm,
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
    color: theme.colors.onPrimary,
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
  shareButton: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.deepOrange,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.card,
  },
  shareButtonText: {
    color: theme.colors.deepOrange,
    fontSize: theme.typography.body,
    fontWeight: theme.typography.weight.semibold,
  },
  attribution: {
    marginTop: theme.spacing.xl,
    color: theme.colors.chocolateBrown,
    fontSize: theme.typography.caption,
    textAlign: 'center',
  },
  });
}
