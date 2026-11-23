import { Feather } from '@expo/vector-icons';
import type { FetchBaseQueryError } from '@reduxjs/toolkit/query';
import type { SerializedError } from '@reduxjs/toolkit';
import { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
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
import { LoadingState } from '../../../shared/components/LoadingState';
import { OfflineBanner } from '../../../shared/components/OfflineBanner';
import { RecipeCard } from '../../../shared/components/RecipeCard';
import { toggleUserFavourite } from '../state/favouritesSlice';
import {
  useFilterMealsByCategoryQuery,
  useGetFeaturedMealQuery,
  useGetMealCategoriesQuery,
  useSearchMealsQuery,
  type Meal,
} from '../services/mealApi';
import { theme } from '../../../shared/theme/theme';

type Props = MainTabScreenProps<'Home'>;
type QueryError = FetchBaseQueryError | SerializedError | undefined;

function getErrorMessage(error: QueryError): string {
  if (!error) {
    return 'Please try again in a moment.';
  }

  if ('status' in error) {
    if (error.status === 'CUSTOM_ERROR') {
      return error.error;
    }

    if (error.status === 'FETCH_ERROR') {
      return 'Unable to reach TheMealDB. Check your internet connection and try again.';
    }

    if (
      typeof error.data === 'object' &&
      error.data !== null &&
      'message' in error.data &&
      typeof error.data.message === 'string'
    ) {
      return error.data.message;
    }

    return 'The recipe service could not complete your request. Please try again.';
  }

  return error.message ?? 'The recipe service could not complete your request.';
}

export function HomeScreen({ navigation }: Props) {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const networkOffline = useAppSelector((state) => state.network.isOffline);
  const favouritesState = useAppSelector((state) => state.favourites);
  const { width } = useWindowDimensions();
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const debouncedSearch = useDebouncedValue(searchText.trim(), 350);
  const isDebouncing =
    selectedCategory === null && searchText.trim() !== debouncedSearch;
  const numberOfColumns = width >= 720 ? 3 : width < 400 ? 1 : 2;

  const categoriesQuery = useGetMealCategoriesQuery();
  const featuredQuery = useGetFeaturedMealQuery();
  const searchQuery = useSearchMealsQuery(debouncedSearch, {
    skip: selectedCategory !== null,
  });
  const categoryQuery = useFilterMealsByCategoryQuery(
    selectedCategory ?? '',
    { skip: selectedCategory === null },
  );
  const recipesQuery =
    selectedCategory === null ? searchQuery : categoryQuery;
  const recipes = recipesQuery.data ?? [];
  const featuredMeal = featuredQuery.data;
  const meals = isDebouncing ? [] : recipes;
  const userName = user?.firstName || user?.username || 'there';
  const userId = user ? String(user.id) : null;
  const favouriteMeals = userId
    ? (favouritesState.byUser[userId] ?? [])
    : [];
  const favouritesLoaded =
    userId !== null && favouritesState.loadedByUser[userId] === true;
  const favouritesSaving =
    userId !== null && favouritesState.savingByUser[userId] === true;
  const favouritesError =
    userId !== null ? favouritesState.errorByUser[userId] : null;

  const toggleFavourite = (meal: Meal) => {
    if (userId !== null) {
      void dispatch(toggleUserFavourite({ userId, meal }));
    }
  };

  const refreshContent = async () => {
    setRefreshing(true);

    try {
      await Promise.all([
        categoriesQuery.refetch(),
        featuredQuery.refetch(),
        selectedCategory === null
          ? searchQuery.refetch()
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
      return <LoadingState label="Finding recipes..." />;
    }

    if (recipesQuery.isError) {
      return (
        <ErrorState
          title="Recipes could not load"
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
        title={debouncedSearch ? 'No recipes found' : 'No recipes available'}
        message={
          debouncedSearch
            ? `No recipes matched "${debouncedSearch}". Try another search.`
            : 'Try again later to discover more recipes.'
        }
        icon="search"
      />
    );
  };

  const renderHeader = () => (
    <View>
      {networkOffline ? <OfflineBanner /> : null}
      <View style={styles.topBar}>
        <View style={styles.greeting}>
          <Text style={styles.greetingLabel}>Good food, good to see you</Text>
          <Text style={styles.userName}>{userName}</Text>
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
        <Text style={styles.sectionTitle}>What are you craving?</Text>
        <View style={styles.searchInput}>
          <Feather
            name="search"
            size={18}
            color={theme.colors.chocolateBrown}
            accessible={false}
          />
          <CustomSearchInput
            value={searchText}
            onChangeText={(value) => {
              setSearchText(value);
              if (value.length > 0) {
                setSelectedCategory(null);
              }
            }}
          />
        </View>
      </View>

      <View style={styles.categoriesSection}>
        <Text style={styles.sectionTitle}>Categories</Text>
        {categoriesQuery.isLoading ? (
          <View style={styles.categoriesLoading}>
            <ActivityIndicator size="small" color={theme.colors.deepOrange} />
            <Text style={styles.supportingText}>Loading categories...</Text>
          </View>
        ) : categoriesQuery.isError ? (
          <ErrorState
            title="Categories unavailable"
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
              onPress={() => setSelectedCategory(null)}
            />
            {categoriesQuery.data?.map((category) => (
              <CategoryChip
                key={category.idCategory}
                label={category.strCategory}
                selected={selectedCategory === category.strCategory}
                onPress={() => {
                  setSearchText('');
                  setSelectedCategory(category.strCategory);
                }}
              />
            ))}
          </ScrollView>
        )}
      </View>

      <View style={styles.featuredSection}>
        <Text style={styles.sectionTitle}>Featured recipe</Text>
        {featuredQuery.isLoading ? (
          <View style={styles.featuredLoading}>
            <ActivityIndicator size="small" color={theme.colors.deepOrange} />
            <Text style={styles.supportingText}>
              Finding a featured recipe...
            </Text>
          </View>
        ) : featuredQuery.isError ? (
          <ErrorState
            title="Featured recipe unavailable"
            message={getErrorMessage(featuredQuery.error)}
            retryLabel="Retry"
            onRetry={() => {
              void featuredQuery.refetch();
            }}
          />
        ) : featuredMeal ? (
          <RecipeCard
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
            title="No featured recipe"
            message="Try refreshing to discover a recipe."
            icon="coffee"
          />
        )}
      </View>

      <View style={styles.recipesHeading}>
        <Text style={styles.sectionTitle}>
          {selectedCategory
            ? `${selectedCategory} recipes`
            : debouncedSearch
              ? 'Search results'
              : 'Explore recipes'}
        </Text>
        {recipesQuery.isError && recipes.length > 0 ? (
          <ErrorState
            title="Could not refresh recipes"
            message={getErrorMessage(recipesQuery.error)}
            retryLabel="Retry"
            onRetry={() => {
              void recipesQuery.refetch();
            }}
          />
        ) : null}
      </View>
      {favouritesError ? (
        <ErrorState
          title="Favourites could not be saved"
          message={favouritesError}
        />
      ) : null}
    </View>
  );

  const renderFooter = () => (
    <Text style={styles.attribution}>
      Recipe data and imagery provided by TheMealDB.
    </Text>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <FlatList
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
        ListFooterComponent={renderFooter}
        contentContainerStyle={styles.listContent}
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
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

interface CustomSearchInputProps {
  value: string;
  onChangeText: (value: string) => void;
}

function CustomSearchInput({ value, onChangeText }: CustomSearchInputProps) {
  return (
    <TextInput
      accessibilityLabel="Search recipes"
      placeholder="Search recipes by name"
      placeholderTextColor={theme.colors.chocolateBrown}
      value={value}
      onChangeText={onChangeText}
      autoCapitalize="none"
      autoCorrect={false}
      returnKeyType="search"
      style={styles.searchTextInput}
    />
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.warmCream,
  },
  listContent: {
    flexGrow: 1,
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
    color: theme.colors.chocolateBrown,
    fontSize: theme.typography.body,
  },
  userName: {
    color: theme.colors.darkBrown,
    fontSize: theme.typography.title,
    fontWeight: theme.typography.weight.bold,
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
    marginTop: theme.spacing.lg,
  },
  searchInput: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.sm,
    paddingLeft: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.chocolateBrown,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.white,
  },
  searchTextInput: {
    minHeight: 50,
    flex: 1,
    paddingVertical: theme.spacing.sm,
    paddingRight: theme.spacing.md,
    color: theme.colors.darkBrown,
    fontSize: theme.typography.body,
  },
  sectionTitle: {
    color: theme.colors.darkBrown,
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
  featuredSection: {
    marginTop: theme.spacing.md,
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
  gridRecipeCard: {
    width: 'auto',
    flex: 1,
  },
  supportingText: {
    color: theme.colors.chocolateBrown,
    fontSize: theme.typography.caption,
  },
  attribution: {
    paddingTop: theme.spacing.md,
    color: theme.colors.chocolateBrown,
    fontSize: theme.typography.caption,
    textAlign: 'center',
  },
});
