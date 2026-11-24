import { useEffect } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { MainTabScreenProps } from '../../../navigation/types';
import { EmptyState } from '../../../shared/components/EmptyState';
import { ErrorState } from '../../../shared/components/ErrorState';
import { LoadingState } from '../../../shared/components/LoadingState';
import { OfflineBanner } from '../../../shared/components/OfflineBanner';
import { RecipeCard } from '../../../shared/components/RecipeCard';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { useCraveThemeStyles } from '../../../shared/theme/useCraveTheme';
import {
  loadUserFavourites,
  toggleUserFavourite,
} from '../state/favouritesSlice';

type Props = MainTabScreenProps<'Favourites'>;

export function FavouritesScreen({ navigation }: Props) {
  const { styles } = useCraveThemeStyles(createStyles);
  const dispatch = useAppDispatch();
  const { width } = useWindowDimensions();
  const user = useAppSelector((state) => state.auth.user);
  const isOffline = useAppSelector((state) => state.network.isOffline);
  const favouritesState = useAppSelector((state) => state.favourites);
  const userId = user ? String(user.id) : null;
  const favourites = userId
    ? (favouritesState.byUser[userId] ?? [])
    : [];
  const loaded = userId !== null && favouritesState.loadedByUser[userId] === true;
  const loading = userId !== null && favouritesState.loadingByUser[userId] === true;
  const saving = userId !== null && favouritesState.savingByUser[userId] === true;
  const error = userId !== null ? favouritesState.errorByUser[userId] : null;
  const numberOfColumns = width >= 720 ? 3 : width < 400 ? 1 : 2;

  useEffect(() => {
    if (userId !== null && !loaded && !loading) {
      void dispatch(loadUserFavourites(userId));
    }
  }, [dispatch, loaded, loading, userId]);

  const renderHeader = () => (
    <View>
      {isOffline ? <OfflineBanner /> : null}
      <Text style={styles.title}>Favourites</Text>
      <Text style={styles.count}>
        {favourites.length === 1
          ? '1 saved recipe'
          : `${favourites.length} saved recipes`}
      </Text>
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

    return (
      <EmptyState
        title="No favourites yet"
        message="Tap the heart on a recipe to save it here."
        icon="heart"
      />
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <FlatList
        key={numberOfColumns}
        data={favourites}
        extraData={saving}
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
              if (userId !== null) {
                void dispatch(toggleUserFavourite({ userId, meal: item }));
              }
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
    marginBottom: theme.spacing.lg,
    color: theme.colors.chocolateBrown,
    fontSize: theme.typography.body,
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
  });
}
