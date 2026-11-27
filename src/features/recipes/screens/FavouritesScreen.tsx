import { Feather } from '@expo/vector-icons';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { MainTabScreenProps } from '../../../navigation/types';
import { useDebouncedValue } from '../../../shared/hooks/useDebouncedValue';
import { CategoryChip } from '../../../shared/components/CategoryChip';
import { EmptyState } from '../../../shared/components/EmptyState';
import { ErrorState } from '../../../shared/components/ErrorState';
import { LoadingState } from '../../../shared/components/LoadingState';
import { OfflineBanner } from '../../../shared/components/OfflineBanner';
import { RecipeCard } from '../../../shared/components/RecipeCard';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { useCraveThemeStyles } from '../../../shared/theme/useCraveTheme';
import type { Meal } from '../services/mealApi';
import {
  loadUserFavourites,
  toggleUserFavourite,
} from '../state/favouritesSlice';

type Props = MainTabScreenProps<'Favourites'>;
type SortOrder = 'recent' | 'oldest' | 'name-asc' | 'name-desc';

const sortOptions: { value: SortOrder; label: string }[] = [
  { value: 'recent', label: 'Recently added' },
  { value: 'oldest', label: 'Oldest added' },
  { value: 'name-asc', label: 'Name A-Z' },
  { value: 'name-desc', label: 'Name Z-A' },
];

export function FavouritesScreen({ navigation }: Props) {
  const { theme, styles } = useCraveThemeStyles(createStyles);
  const dispatch = useAppDispatch();
  const { width } = useWindowDimensions();
  const user = useAppSelector((state) => state.auth.user);
  const isOffline = useAppSelector((state) => state.network.isOffline);
  const favouritesState = useAppSelector((state) => state.favourites);
  const userId = user ? String(user.id) : null;
  const favourites = useMemo(
    () => (userId ? (favouritesState.byUser[userId] ?? []) : []),
    [favouritesState.byUser, userId],
  );
  const addedAt = useMemo(
    () =>
      userId !== null
        ? (favouritesState.addedAtByUser[userId] ?? {})
        : {},
    [favouritesState.addedAtByUser, userId],
  );
  const loaded = userId !== null && favouritesState.loadedByUser[userId] === true;
  const loading = userId !== null && favouritesState.loadingByUser[userId] === true;
  const saving = userId !== null && favouritesState.savingByUser[userId] === true;
  const error = userId !== null ? favouritesState.errorByUser[userId] : null;
  const [searchText, setSearchText] = useState('');
  const debouncedSearch = useDebouncedValue(searchText.trim(), 300);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>('recent');
  const [undoMeal, setUndoMeal] = useState<Meal | null>(null);
  const undoTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const numberOfColumns = width >= 720 ? 3 : width < 400 ? 1 : 2;
  const categories = useMemo(
    () =>
      Array.from(
        new Set(
          favourites
            .map((meal) => meal.strCategory?.trim())
            .filter((category): category is string => Boolean(category)),
        ),
      ).sort((left, right) => left.localeCompare(right)),
    [favourites],
  );
  const filteredFavourites = useMemo(() => {
    const query = debouncedSearch.toLocaleLowerCase();
    return favourites
      .filter(
        (meal) =>
          (!query || meal.strMeal.toLocaleLowerCase().includes(query)) &&
          (!selectedCategory || meal.strCategory === selectedCategory),
      )
      .sort((left, right) => {
        if (sortOrder === 'name-asc') {
          return left.strMeal.localeCompare(right.strMeal);
        }
        if (sortOrder === 'name-desc') {
          return right.strMeal.localeCompare(left.strMeal);
        }
        const timeDifference =
          (addedAt[left.idMeal] ?? 0) - (addedAt[right.idMeal] ?? 0);
        return sortOrder === 'recent' ? -timeDifference : timeDifference;
      });
  }, [addedAt, debouncedSearch, favourites, selectedCategory, sortOrder]);

  useEffect(() => {
    if (userId !== null && !loaded && !loading) {
      void dispatch(loadUserFavourites(userId));
    }
  }, [dispatch, loaded, loading, userId]);

  useEffect(
    () => () => {
      if (undoTimeout.current !== null) {
        clearTimeout(undoTimeout.current);
      }
    },
    [],
  );

  const removeFavourite = async (meal: Meal) => {
    if (userId === null) {
      return;
    }
    try {
      await dispatch(toggleUserFavourite({ userId, meal })).unwrap();
      if (undoTimeout.current !== null) {
        clearTimeout(undoTimeout.current);
      }
      setUndoMeal(meal);
      undoTimeout.current = setTimeout(() => {
        setUndoMeal(null);
        undoTimeout.current = null;
      }, 5000);
    } catch {
      // The shared favourites error state displays the persistence failure.
    }
  };

  const undoRemoval = async () => {
    if (userId === null || undoMeal === null || saving) {
      return;
    }
    const meal = undoMeal;
    setUndoMeal(null);
    if (undoTimeout.current !== null) {
      clearTimeout(undoTimeout.current);
      undoTimeout.current = null;
    }
    try {
      await dispatch(toggleUserFavourite({ userId, meal })).unwrap();
    } catch {
      // The shared favourites error state displays the persistence failure.
    }
  };

  const hasFilters = searchText.length > 0 || selectedCategory !== null;

  const renderHeader = () => (
    <View>
      {isOffline ? <OfflineBanner /> : null}
      <Text style={styles.title}>Favourites</Text>
      <Text style={styles.count}>
        {favourites.length} saved{' '}
        {favourites.length === 1 ? 'recipe' : 'recipes'}
        {hasFilters ? ` | ${filteredFavourites.length} matching` : ''}
      </Text>

      <View style={styles.searchInput}>
        <Feather
          name="search"
          size={18}
          color={theme.colors.secondaryText}
          accessible={false}
        />
        <TextInput
          accessibilityLabel="Search saved recipes"
          placeholder="Search saved recipes"
          placeholderTextColor={theme.colors.secondaryText}
          value={searchText}
          onChangeText={setSearchText}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
          style={styles.searchTextInput}
        />
        {searchText.length > 0 ? (
          <Pressable
            onPress={() => setSearchText('')}
            accessibilityRole="button"
            accessibilityLabel="Clear favourites search"
            style={styles.clearButton}
          >
            <Feather
              name="x-circle"
              size={20}
              color={theme.colors.secondaryText}
              accessible={false}
            />
          </Pressable>
        ) : null}
      </View>

      {categories.length > 0 ? (
        <View style={styles.filterSection}>
          <Text style={styles.filterTitle}>Category</Text>
          <FlatList
            horizontal
            data={categories}
            keyExtractor={(category) => category}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipList}
            ListHeaderComponent={
              <CategoryChip
                label="All"
                selected={selectedCategory === null}
                onPress={() => setSelectedCategory(null)}
              />
            }
            renderItem={({ item }) => (
              <CategoryChip
                label={item}
                selected={selectedCategory === item}
                onPress={() => setSelectedCategory(item)}
              />
            )}
          />
        </View>
      ) : null}

      <View style={styles.filterSection}>
        <Text style={styles.filterTitle}>Sort by</Text>
        <View style={styles.sortOptions}>
          {sortOptions.map((option) => (
            <CategoryChip
              key={option.value}
              label={option.label}
              selected={sortOrder === option.value}
              onPress={() => setSortOrder(option.value)}
            />
          ))}
        </View>
      </View>
      {hasFilters ? (
        <Pressable
          onPress={() => {
            setSearchText('');
            setSelectedCategory(null);
          }}
          accessibilityRole="button"
          accessibilityLabel="Clear favourites filters"
          style={styles.clearFilters}
        >
          <Feather
            name="x"
            size={16}
            color={theme.colors.deepOrange}
            accessible={false}
          />
          <Text style={styles.clearFiltersText}>Clear filters</Text>
        </Pressable>
      ) : null}
    </View>
  );

  const renderEmpty = () => {
    if (!loaded || loading) {
      return error ? (
        <ErrorState
          title="Favourites could not load"
          message={error}
          retryLabel="Try again"
          onRetry={() => {
            if (userId !== null) {
              void dispatch(loadUserFavourites(userId));
            }
          }}
        />
      ) : (
        <LoadingState label="Loading your favourites..." />
      );
    }

    return hasFilters ? (
      <EmptyState
        title="No matching recipes"
        message="Try a different search or category."
        icon="search"
        actionLabel="Clear filters"
        onAction={() => {
          setSearchText('');
          setSelectedCategory(null);
        }}
      />
    ) : (
      <EmptyState
        title="No favourites yet"
        message="Save a recipe with the heart button and it will be available here, even offline."
        icon="heart"
      />
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <FlatList
        key={numberOfColumns}
        data={filteredFavourites}
        extraData={`${saving}:${undoMeal?.idMeal ?? ''}`}
        keyExtractor={(meal) => meal.idMeal}
        numColumns={numberOfColumns}
        columnWrapperStyle={
          numberOfColumns > 1 ? styles.recipeRow : undefined
        }
        contentContainerStyle={styles.content}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={
          error && loaded ? (
            <ErrorState
              title="Favourites could not be updated"
              message={error}
            />
          ) : undefined
        }
        renderItem={({ item }) => (
          <RecipeCard
            title={item.strMeal}
            imageSource={
              item.strMealThumb ? { uri: item.strMealThumb } : undefined
            }
            category={item.strCategory ?? undefined}
            isFavorite
            favoriteDisabled={saving}
            onFavoritePress={() => {
              void removeFavourite(item);
            }}
            onPress={() =>
              navigation.navigate('RecipeDetails', {
                recipeId: item.idMeal,
              })
            }
            style={[
              styles.recipeCard,
              numberOfColumns > 1 && styles.gridRecipeCard,
            ]}
          />
        )}
        showsVerticalScrollIndicator={false}
      />
      {undoMeal ? (
        <View style={styles.undoBar} accessibilityLiveRegion="polite">
          <Text style={styles.undoText}>Removed {undoMeal.strMeal}</Text>
          <Pressable
            onPress={() => {
              void undoRemoval();
            }}
            disabled={saving}
            accessibilityRole="button"
            accessibilityLabel={`Undo removing ${undoMeal.strMeal}`}
            style={styles.undoButton}
          >
            <Text style={styles.undoButtonText}>UNDO</Text>
          </Pressable>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

function createStyles(theme: import('../../../shared/theme/theme').CraveTheme) {
  return StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    content: {
      flexGrow: 1,
      padding: theme.spacing.lg,
      paddingBottom: theme.spacing.xl,
    },
    title: {
      marginTop: theme.spacing.md,
      color: theme.colors.heading,
      fontSize: theme.typography.title,
      fontWeight: theme.typography.weight.bold,
    },
    count: {
      marginTop: theme.spacing.xs,
      color: theme.colors.secondaryText,
      fontSize: theme.typography.body,
    },
    searchInput: {
      minHeight: 52,
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
      marginTop: theme.spacing.md,
      paddingLeft: theme.spacing.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.md,
      backgroundColor: theme.colors.card,
    },
    searchTextInput: {
      minHeight: 48,
      flex: 1,
      color: theme.colors.text,
      fontSize: theme.typography.body,
    },
    clearButton: {
      width: 48,
      height: 48,
      alignItems: 'center',
      justifyContent: 'center',
    },
    filterSection: {
      gap: theme.spacing.sm,
      marginTop: theme.spacing.lg,
    },
    filterTitle: {
      color: theme.colors.heading,
      fontSize: theme.typography.label,
      fontWeight: theme.typography.weight.semibold,
    },
    chipList: {
      gap: theme.spacing.sm,
      paddingVertical: theme.spacing.xs,
    },
    sortOptions: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.sm,
    },
    clearFilters: {
      minHeight: 44,
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      gap: theme.spacing.xs,
      marginTop: theme.spacing.sm,
    },
    clearFiltersText: {
      color: theme.colors.deepOrange,
      fontSize: theme.typography.caption,
      fontWeight: theme.typography.weight.semibold,
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
    undoBar: {
      position: 'absolute',
      right: theme.spacing.md,
      bottom: theme.spacing.md,
      left: theme.spacing.md,
      minHeight: 56,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: theme.spacing.md,
      paddingHorizontal: theme.spacing.md,
      borderRadius: theme.radius.md,
      backgroundColor: theme.colors.card,
      ...theme.shadows.floating,
    },
    undoText: {
      flex: 1,
      color: theme.colors.text,
      fontSize: theme.typography.caption,
    },
    undoButton: {
      minWidth: 64,
      minHeight: 44,
      alignItems: 'center',
      justifyContent: 'center',
    },
    undoButtonText: {
      color: theme.colors.deepOrange,
      fontSize: theme.typography.label,
      fontWeight: theme.typography.weight.bold,
    },
  });
}
