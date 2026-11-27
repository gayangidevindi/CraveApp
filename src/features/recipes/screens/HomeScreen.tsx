import { Feather } from '@expo/vector-icons';
import type { FetchBaseQueryError } from '@reduxjs/toolkit/query';
import type { SerializedError } from '@reduxjs/toolkit';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { MainTabScreenProps } from '../../../navigation/types';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { useDebouncedValue } from '../../../shared/hooks/useDebouncedValue';
import { CategoryChip } from '../../../shared/components/CategoryChip';
import { EmptyState } from '../../../shared/components/EmptyState';
import { ErrorState } from '../../../shared/components/ErrorState';
import { OfflineBanner } from '../../../shared/components/OfflineBanner';
import { RecipeCard } from '../../../shared/components/RecipeCard';
import { SearchField } from '../../../shared/components/SearchField';
import { RecipeSkeletonCard } from '../../../shared/components/RecipeSkeletonCard';
import { ToastMessage } from '../../../shared/components/ToastMessage';
import {
  hydrateRecipeSync,
} from '../state/recipeSyncSlice';
import {
  loadUserFavourites,
  toggleUserFavourite,
} from '../state/favouritesSlice';
import {
  loadRecentlyViewed,
} from '../state/recentlyViewedSlice';
import {
  useFilterMealsByAreaQuery,
  useFilterMealsByCategoryQuery,
  useGetFeaturedMealQuery,
  useGetMealAreasQuery,
  useGetMealCategoriesQuery,
  useLazyGetRandomMealQuery,
  useSearchMealsQuery,
  type Meal,
} from '../services/mealApi';
import {
  normalizeUniqueCategories,
  normalizeUniqueStrings,
  uniqueRecipesById,
} from '../utils/normalizeRecipeData';
import { useCraveThemeStyles } from '../../../shared/theme/useCraveTheme';
import { userMessages } from '../../../shared/constants/userMessages';

type Props = MainTabScreenProps<'Home'>;
type QueryError = FetchBaseQueryError | SerializedError | undefined;

function getErrorMessage(error: QueryError): string {
  if (error && 'status' in error && error.status === 'FETCH_ERROR') {
    return userMessages.connectionTrouble;
  }

  if (error && 'status' in error && error.status === 'CUSTOM_ERROR') {
    return 'This is not available right now. Please try again later.';
  }

  return userMessages.unexpectedError;
}

export function HomeScreen({ navigation }: Props) {
  const { theme, styles } = useCraveThemeStyles(createStyles);
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const networkOffline = useAppSelector((state) => state.network.isOffline);
  const favouritesState = useAppSelector((state) => state.favourites);
  const recentlyViewedState = useAppSelector((state) => state.recentlyViewed);
  const { width } = useWindowDimensions();
  const contentMaxWidth = Math.min(width, 1120);
  const listRef = useRef<FlatList<Meal>>(null);
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedArea, setSelectedArea] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [favouriteFeedback, setFavouriteFeedback] = useState<{
    message: string;
    tone: 'success' | 'error';
  } | null>(null);
  const debouncedSearch = useDebouncedValue(searchText.trim(), 350);
  const isDebouncing =
    selectedCategory === null &&
    selectedArea === null &&
    searchText.trim() !== debouncedSearch;
  const numberOfColumns = width >= 720 ? 3 : width < 400 ? 1 : 2;

  const categoriesQuery = useGetMealCategoriesQuery();
  const areasQuery = useGetMealAreasQuery();
  const featuredQuery = useGetFeaturedMealQuery();
  const [requestRandomMeal, randomMealQuery] = useLazyGetRandomMealQuery();
  const searchQuery = useSearchMealsQuery(debouncedSearch, {
    skip: selectedCategory !== null || selectedArea !== null,
  });
  const categoryQuery = useFilterMealsByCategoryQuery(
    selectedCategory ?? '',
    { skip: selectedCategory === null || selectedArea !== null },
  );
  const areaQuery = useFilterMealsByAreaQuery(
    selectedArea ?? '',
    { skip: selectedArea === null },
  );
  const recipesQuery =
    selectedCategory !== null
      ? categoryQuery
      : selectedArea !== null
        ? areaQuery
        : searchQuery;
  const recipes = useMemo(
    () => uniqueRecipesById(recipesQuery.data ?? []),
    [recipesQuery.data],
  );
  const categories = useMemo(
    () => normalizeUniqueCategories(categoriesQuery.data ?? []),
    [categoriesQuery.data],
  );
  const cuisineOptions = useMemo(
    () => normalizeUniqueStrings(areasQuery.data ?? []),
    [areasQuery.data],
  );
  const featuredMeal = featuredQuery.data;
  const meals = isDebouncing ? [] : recipes;
  const userName = user?.firstName || user?.username || 'there';
  const userId = user ? String(user.id) : null;
  const recentlyViewed = useMemo(
    () =>
      userId
        ? uniqueRecipesById(recentlyViewedState.byUser[userId] ?? [])
        : [],
    [recentlyViewedState.byUser, userId],
  );
  const historyLoaded =
    userId !== null && recentlyViewedState.loadedByUser[userId] === true;
  const historyLoading =
    userId !== null && recentlyViewedState.loadingByUser[userId] === true;
  const historyError =
    userId !== null ? recentlyViewedState.errorByUser[userId] : null;
  const greeting = getTimeGreeting(new Date().getHours());
  const favouriteMeals = useMemo(
    () =>
      userId
        ? uniqueRecipesById(favouritesState.byUser[userId] ?? [])
        : [],
    [favouritesState.byUser, userId],
  );
  const favouritesLoaded =
    userId !== null && favouritesState.loadedByUser[userId] === true;
  const favouritesSaving =
    userId !== null && favouritesState.savingByUser[userId] === true;
  const favouritesError =
    userId !== null ? favouritesState.errorByUser[userId] : null;

  useEffect(() => {
    if (userId !== null && !historyLoaded && !historyLoading) {
      void dispatch(loadRecentlyViewed(userId));
    }
  }, [dispatch, historyLoaded, historyLoading, userId]);

  useEffect(() => {
    void dispatch(hydrateRecipeSync());
  }, [dispatch]);

  const toggleFavourite = async (meal: Meal) => {
    if (userId === null) {
      return;
    }

    const isSaved = favouriteMeals.some(
      (favourite) => favourite.idMeal === meal.idMeal,
    );

    try {
      await dispatch(toggleUserFavourite({ userId, meal })).unwrap();
      setFavouriteFeedback({
        message: isSaved
          ? 'Removed from favourites.'
          : 'Added to favourites!',
        tone: 'success',
      });
    } catch {
      setFavouriteFeedback({
        message: userMessages.unableToSaveFavourites,
        tone: 'error',
      });
    }
  };

  const refreshContent = async () => {
    setRefreshing(true);

    try {
      await Promise.all([
        categoriesQuery.refetch(),
        areasQuery.refetch(),
        featuredQuery.refetch(),
        selectedCategory === null
          ? selectedArea === null
            ? searchQuery.refetch()
            : areaQuery.refetch()
          : categoryQuery.refetch(),
      ]);
    } finally {
      setRefreshing(false);
    }
  };

  const openRecipe = (meal: Meal) => {
    navigation.navigate('RecipeDetails', { recipeId: meal.idMeal });
  };

  const renderRecipe = ({ item }: { item: Meal }) => (
    <RecipeCard
      title={item.strMeal}
      imageSource={item.strMealThumb ? { uri: item.strMealThumb } : undefined}
      category={item.strCategory || selectedCategory || undefined}
      isFavorite={favouriteMeals.some(
        (favourite) => favourite.idMeal === item.idMeal,
      )}
      favoriteDisabled={!favouritesLoaded || favouritesSaving}
      onFavoritePress={() => toggleFavourite(item)}
      onPress={() => openRecipe(item)}
      style={[
        styles.recipeCard,
        numberOfColumns > 1 && styles.gridRecipeCard,
      ]}
    />
  );

  const renderListEmpty = () => {
    if (isDebouncing || recipesQuery.isLoading) {
      return (
        <View style={styles.skeletonGrid}>
          {Array.from({ length: Math.min(numberOfColumns * 2, 4) }, (_, index) => (
            <RecipeSkeletonCard
              key={`recipe-skeleton-${index}`}
              style={[
                styles.skeletonCard,
                numberOfColumns > 1 && styles.gridRecipeCard,
              ]}
            />
          ))}
        </View>
      );
    }

    if (recipesQuery.isError) {
      return (
        <ErrorState
          title="Unable to load recipes"
          message={getErrorMessage(recipesQuery.error)}
          retryLabel="Try again"
          onRetry={() => {
            void recipesQuery.refetch();
          }}
        />
      );
    }

    return (
      <EmptyState
        title={
          debouncedSearch || selectedArea || selectedCategory
            ? 'No recipes found'
            : 'No recipes available'
        }
        message="Try a different search or explore another cuisine."
        icon="search"
      />
    );
  };

  const renderHeader = () => (
    <View>
      {networkOffline ? <OfflineBanner /> : null}
      <View style={styles.topBar}>
        <View style={styles.greeting}>
          <Text style={styles.greetingLabel}>
            {greeting}, {userName}!
          </Text>
          <Text style={styles.supportingText}>
            What would you like to cook today?
          </Text>
        </View>
        <Pressable
          onPress={() => navigation.navigate('Profile')}
          accessibilityRole="button"
          accessibilityLabel="Open your profile"
          hitSlop={4}
          style={styles.avatar}
        >
          {user?.image ? (
            <Image source={{ uri: user.image }} style={styles.avatarImage} />
          ) : (
            <Feather
              name="user"
              size={22}
              color={theme.colors.darkBrown}
              accessible={false}
            />
          )}
        </Pressable>
      </View>

      <View style={styles.search}>
        <SearchField
          accessibilityLabel="Search recipes"
          placeholder="Search recipes by name"
          value={searchText}
          onChangeText={(value) => {
            setSearchText(value);
            if (value.length > 0) {
              setSelectedCategory(null);
              setSelectedArea(null);
            }
          }}
          onClear={() => setSearchText('')}
        />
      </View>

      <View style={styles.categoriesSection}>
        <Text style={styles.sectionTitle}>Recipe categories</Text>
        {categoriesQuery.isLoading ? (
          <View style={styles.categoriesLoading}>
            <ActivityIndicator size="small" color={theme.colors.deepOrange} />
            <Text style={styles.supportingText}>Loading categories...</Text>
          </View>
        ) : categoriesQuery.isError ? (
          <ErrorState
            title="Unable to load categories"
            message={getErrorMessage(categoriesQuery.error)}
            retryLabel="Retry"
            onRetry={() => {
              void categoriesQuery.refetch();
            }}
          />
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryList}
          >
            <CategoryChip
              label="All"
              selected={selectedCategory === null}
              onPress={() => {
                setSelectedCategory(null);
                setSelectedArea(null);
              }}
            />
            {categories.map((category) => (
              <CategoryChip
                key={category.idCategory}
                label={category.strCategory}
                selected={selectedCategory === category.strCategory}
                onPress={() => {
                  setSearchText('');
                  setSelectedArea(null);
                  setSelectedCategory(category.strCategory);
                }}
              />
            ))}
          </ScrollView>
        )}
      </View>

      <View style={styles.categoriesSection}>
        <Text style={styles.sectionTitle}>Explore cuisines</Text>
        {areasQuery.isLoading ? (
          <View style={styles.categoriesLoading}>
            <ActivityIndicator size="small" color={theme.colors.deepOrange} />
            <Text style={styles.supportingText}>Loading cuisines...</Text>
          </View>
        ) : areasQuery.isError ? (
          <ErrorState
            title="Unable to load cuisines"
            message={getErrorMessage(areasQuery.error)}
            retryLabel="Retry"
            onRetry={() => {
              void areasQuery.refetch();
            }}
          />
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryList}
          >
            <CategoryChip
              label="All cuisines"
              selected={selectedArea === null}
              onPress={() => setSelectedArea(null)}
            />
            {cuisineOptions.map((area) => (
              <CategoryChip
                key={area}
                label={area}
                selected={selectedArea === area}
                onPress={() => {
                  setSearchText('');
                  setSelectedCategory(null);
                  setSelectedArea(area);
                }}
              />
            ))}
          </ScrollView>
        )}
      </View>

      {historyLoaded && recentlyViewed.length > 0 ? (
        <View style={styles.recentSection}>
          <Text style={styles.sectionTitle}>Recently viewed</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.recentList}
          >
            {recentlyViewed.map((meal) => (
              <RecipeCard
                key={`recent-${meal.idMeal}`}
                title={meal.strMeal}
                imageSource={
                  meal.strMealThumb ? { uri: meal.strMealThumb } : undefined
                }
                category={meal.strCategory ?? undefined}
                isFavorite={favouriteMeals.some(
                  (favourite) => favourite.idMeal === meal.idMeal,
                )}
                favoriteDisabled={!favouritesLoaded || favouritesSaving}
                onFavoritePress={() => toggleFavourite(meal)}
                onPress={() => openRecipe(meal)}
                style={styles.recentCard}
              />
            ))}
          </ScrollView>
        </View>
      ) : historyError ? (
        <ErrorState
          title="Unable to load recently viewed recipes"
          message={historyError}
          retryLabel="Retry"
          onRetry={() => {
            if (userId !== null) {
              void dispatch(loadRecentlyViewed(userId));
            }
          }}
        />
      ) : null}

      <View style={styles.featuredSection}>
        <Text style={styles.sectionTitle}>Today&apos;s pick</Text>
        {featuredQuery.isLoading ? (
          <View style={styles.featuredLoading}>
            <ActivityIndicator size="small" color={theme.colors.deepOrange} />
            <Text style={styles.supportingText}>
              Finding today&apos;s pick...
            </Text>
          </View>
        ) : featuredQuery.isError ? (
          <ErrorState
            title="Unable to load today's pick"
            message={getErrorMessage(featuredQuery.error)}
            retryLabel="Retry"
            onRetry={() => {
              void featuredQuery.refetch();
            }}
          />
        ) : featuredMeal ? (
          <RecipeCard
            featured
            title={featuredMeal.strMeal}
            imageSource={
              featuredMeal.strMealThumb
                ? { uri: featuredMeal.strMealThumb }
                : undefined
            }
            category={featuredMeal.strCategory ?? undefined}
            description={
              featuredMeal.strArea
                ? `${featuredMeal.strArea} cuisine`
                : undefined
            }
            isFavorite={favouriteMeals.some(
              (favourite) => favourite.idMeal === featuredMeal.idMeal,
            )}
            favoriteDisabled={!favouritesLoaded || favouritesSaving}
            onFavoritePress={() => toggleFavourite(featuredMeal)}
            onPress={() => openRecipe(featuredMeal)}
            style={styles.featuredCard}
          />
        ) : (
          <EmptyState
            title="No pick available right now"
            message="Try refreshing to find something delicious."
            icon="coffee"
          />
        )}
      </View>

      <View style={styles.randomSection}>
        <View style={styles.randomHeading}>
          <View style={styles.randomCopy}>
            <Text style={styles.sectionTitle}>Need inspiration?</Text>
            <Text style={styles.supportingText}>
              Let us choose something delicious for you.
            </Text>
          </View>
          <Pressable
            onPress={() => {
              void requestRandomMeal();
            }}
            disabled={randomMealQuery.isFetching}
            accessibilityRole="button"
            accessibilityLabel="Discover a random recipe"
            accessibilityState={{ disabled: randomMealQuery.isFetching }}
            style={({ pressed }) => [
              styles.randomButton,
              pressed && styles.pressed,
              randomMealQuery.isFetching && styles.disabled,
            ]}
          >
            {randomMealQuery.isFetching ? (
              <ActivityIndicator color={theme.colors.onPrimary} />
            ) : (
              <Feather
                name="shuffle"
                size={18}
                color={theme.colors.onPrimary}
                accessible={false}
              />
            )}
            <Text style={styles.randomButtonText}>Surprise me</Text>
          </Pressable>
        </View>
        {randomMealQuery.isError ? (
          <ErrorState
            title="Unable to find a recipe right now"
            message={getErrorMessage(randomMealQuery.error)}
            retryLabel="Try again"
            onRetry={() => {
              void requestRandomMeal();
            }}
          />
        ) : randomMealQuery.data ? (
          <RecipeCard
            title={randomMealQuery.data.strMeal}
            imageSource={
              randomMealQuery.data.strMealThumb
                ? { uri: randomMealQuery.data.strMealThumb }
                : undefined
            }
            category={randomMealQuery.data.strCategory ?? undefined}
            description={
              randomMealQuery.data.strArea
                ? `${randomMealQuery.data.strArea} cuisine`
                : undefined
            }
            isFavorite={favouriteMeals.some(
              (favourite) => favourite.idMeal === randomMealQuery.data?.idMeal,
            )}
            favoriteDisabled={!favouritesLoaded || favouritesSaving}
            onFavoritePress={() => {
              if (randomMealQuery.data) {
                toggleFavourite(randomMealQuery.data);
              }
            }}
            onPress={() => {
              if (randomMealQuery.data) {
                openRecipe(randomMealQuery.data);
              }
            }}
            style={styles.featuredCard}
          />
        ) : null}
      </View>

      <View style={styles.recipesHeading}>
        <Text style={styles.sectionTitle}>
          {selectedCategory
            ? `${selectedCategory} recipes`
            : selectedArea
              ? `${selectedArea} cuisine`
            : debouncedSearch
              ? 'Search results'
              : 'Discover something delicious'}
        </Text>
        {recipesQuery.isError && recipes.length > 0 ? (
          <ErrorState
            title="Unable to refresh recipes"
            message={getErrorMessage(recipesQuery.error)}
            retryLabel="Retry"
            onRetry={() => {
              void recipesQuery.refetch();
            }}
          />
        ) : null}
      </View>
      {favouritesError && !favouritesLoaded ? (
        <ErrorState
          title="Unable to load favourites"
          message="Please try again."
          retryLabel="Try again"
          onRetry={() => {
            if (userId !== null) {
              void dispatch(loadUserFavourites(userId));
            }
          }}
        />
      ) : null}
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <FlatList
        ref={listRef}
        key={numberOfColumns}
        data={meals}
        extraData={selectedCategory}
        keyExtractor={(item) => item.idMeal}
        renderItem={renderRecipe}
        numColumns={numberOfColumns}
        columnWrapperStyle={
          numberOfColumns > 1 ? styles.recipeRow : undefined
        }
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderListEmpty}
        contentContainerStyle={[
          styles.listContent,
          { maxWidth: contentMaxWidth },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              void refreshContent();
            }}
            tintColor={theme.colors.deepOrange}
            colors={[theme.colors.deepOrange]}
          />
        }
        onScroll={(event) => {
          setShowBackToTop(event.nativeEvent.contentOffset.y > 480);
        }}
        scrollEventThrottle={100}
        showsVerticalScrollIndicator={false}
      />
      {showBackToTop ? (
        <Pressable
          onPress={() => {
            listRef.current?.scrollToOffset({ offset: 0, animated: true });
          }}
          accessibilityRole="button"
          accessibilityLabel="Back to top"
          style={({ pressed }) => [
            styles.backToTop,
            pressed && styles.pressed,
          ]}
        >
          <Feather
            name="arrow-up"
            size={20}
            color={theme.colors.onPrimary}
            accessible={false}
          />
        </Pressable>
      ) : null}
      <View style={styles.toastContainer} pointerEvents="box-none">
        <ToastMessage
          message={favouriteFeedback?.message ?? null}
          tone={favouriteFeedback?.tone ?? 'success'}
          onDismiss={() => setFavouriteFeedback(null)}
        />
      </View>
    </SafeAreaView>
  );
}

function getTimeGreeting(hour: number): string {
  if (hour < 12) {
    return 'Good morning';
  }
  if (hour < 18) {
    return 'Good afternoon';
  }
  return 'Good evening';
}

function createStyles(theme: import('../../../shared/theme/theme').CraveTheme) {
  return StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  listContent: {
    flexGrow: 1,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
    paddingTop: theme.spacing.sm,
  },
  greeting: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  greetingLabel: {
    color: theme.colors.heading,
    fontSize: theme.typography.title,
    fontWeight: theme.typography.weight.bold,
    lineHeight: theme.typography.lineHeight.title,
  },
  avatar: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: theme.colors.primary,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.softYellow,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  search: {
    gap: theme.spacing.sm,
    marginTop: theme.spacing.lg,
  },
  sectionTitle: {
    color: theme.colors.heading,
    fontSize: theme.typography.heading,
    fontWeight: theme.typography.weight.bold,
  },
  categoriesSection: {
    marginTop: theme.spacing.xl,
  },
  categoryList: {
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.md,
  },
  categoriesLoading: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  recentSection: {
    marginTop: theme.spacing.xl,
  },
  recentList: {
    gap: theme.spacing.md,
    paddingVertical: theme.spacing.md,
  },
  recentCard: {
    width: 210,
  },
  featuredSection: {
    marginTop: theme.spacing.md,
  },
  randomSection: {
    marginTop: theme.spacing.xl,
    gap: theme.spacing.md,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.xl,
    backgroundColor: theme.colors.elevatedSurface,
  },
  randomHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  randomCopy: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  randomButton: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.primary,
    ...theme.shadows.button,
  },
  randomButtonText: {
    color: theme.colors.onPrimary,
    fontSize: theme.typography.label,
    fontWeight: theme.typography.weight.bold,
  },
  disabled: {
    opacity: 0.6,
  },
  pressed: {
    opacity: 0.75,
  },
  featuredLoading: {
    minHeight: 100,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  featuredCard: {
    marginTop: theme.spacing.md,
  },
  recipesHeading: {
    marginTop: theme.spacing.xl,
    marginBottom: theme.spacing.md,
  },
  recipeRow: {
    gap: theme.spacing.md,
  },
  recipeCard: {
    marginBottom: theme.spacing.md,
  },
  skeletonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
    paddingTop: theme.spacing.sm,
  },
  skeletonCard: {
    width: '100%',
    marginBottom: theme.spacing.md,
  },
  gridRecipeCard: {
    width: 'auto',
    flex: 1,
  },
  supportingText: {
    color: theme.colors.secondaryText,
    fontSize: theme.typography.caption,
  },
  toastContainer: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    left: 0,
  },
  backToTop: {
    position: 'absolute',
    right: theme.spacing.lg,
    bottom: theme.spacing.lg,
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.deepOrange,
    ...theme.shadows.floating,
  },
  });
}
