import AsyncStorage from '@react-native-async-storage/async-storage';
import { configureStore } from '@reduxjs/toolkit';

import favouritesReducer, {
  loadUserFavourites,
  toggleUserFavourite,
} from '../favouritesSlice';

jest.mock('@react-native-async-storage/async-storage', () => {
  const values = new Map<string, string>();

  return {
    __esModule: true,
    default: {
      clear: jest.fn(async () => values.clear()),
      getItem: jest.fn(async (key: string) => values.get(key) ?? null),
      removeItem: jest.fn(async (key: string) => values.delete(key)),
      setItem: jest.fn(async (key: string, value: string) =>
        values.set(key, value),
      ),
    },
  };
});

const meal = {
  idMeal: '52772',
  strMeal: 'Teriyaki Chicken Casserole',
  strMealThumb: 'https://www.themealdb.com/images/media/meals/example.jpg',
  strCategory: 'Chicken',
  strArea: 'Japanese',
  strInstructions: 'Cook the chicken and serve.',
};

function createTestStore() {
  return configureStore({
    reducer: {
      favourites: favouritesReducer,
    },
  });
}

describe('favourites persistence', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('restores saved recipes after creating a fresh store', async () => {
    const firstStore = createTestStore();
    await firstStore.dispatch(loadUserFavourites('user-1')).unwrap();
    await firstStore
      .dispatch(toggleUserFavourite({ userId: 'user-1', meal }))
      .unwrap();

    const restoredStore = createTestStore();
    await restoredStore.dispatch(loadUserFavourites('user-1')).unwrap();

    expect(restoredStore.getState().favourites.byUser['user-1']).toEqual([
      meal,
    ]);
  });

  it('keeps favourite lists isolated between users', async () => {
    const store = createTestStore();
    await store.dispatch(loadUserFavourites('user-1')).unwrap();
    await store.dispatch(loadUserFavourites('user-2')).unwrap();
    await store
      .dispatch(toggleUserFavourite({ userId: 'user-1', meal }))
      .unwrap();

    expect(store.getState().favourites.byUser['user-1']).toEqual([meal]);
    expect(store.getState().favourites.byUser['user-2']).toEqual([]);
  });

  it('does not report a duplicate in-flight load as an error', async () => {
    const store = createTestStore();
    const firstLoad = store.dispatch(loadUserFavourites('user-1'));
    const duplicateLoad = store.dispatch(loadUserFavourites('user-1'));

    await Promise.all([firstLoad, duplicateLoad]);

    expect(store.getState().favourites.loadedByUser['user-1']).toBe(true);
    expect(store.getState().favourites.loadingByUser['user-1']).toBe(false);
    expect(store.getState().favourites.errorByUser['user-1']).toBeNull();
  });

  it('removes a favourite from persistent storage when toggled again', async () => {
    const store = createTestStore();
    await store.dispatch(loadUserFavourites('user-1')).unwrap();
    await store
      .dispatch(toggleUserFavourite({ userId: 'user-1', meal }))
      .unwrap();
    await store
      .dispatch(toggleUserFavourite({ userId: 'user-1', meal }))
      .unwrap();

    const restoredStore = createTestStore();
    await restoredStore.dispatch(loadUserFavourites('user-1')).unwrap();

    expect(restoredStore.getState().favourites.byUser['user-1']).toEqual([]);
  });
});
