import AsyncStorage from '@react-native-async-storage/async-storage';
import { configureStore } from '@reduxjs/toolkit';

import recentlyViewedReducer, {
  loadRecentlyViewed,
  recordRecentlyViewed,
} from '../recentlyViewedSlice';

jest.mock('@react-native-async-storage/async-storage', () => {
  const values = new Map<string, string>();
  return {
    __esModule: true,
    default: {
      clear: jest.fn(async () => values.clear()),
      getItem: jest.fn(async (key: string) => values.get(key) ?? null),
      setItem: jest.fn(async (key: string, value: string) =>
        values.set(key, value),
      ),
    },
  };
});

const meal = {
  idMeal: '52772',
  strMeal: 'Teriyaki Chicken',
  strMealThumb: 'https://example.com/meal.jpg',
  strCategory: 'Chicken',
  strArea: 'Japanese',
  strInstructions: 'Cook and serve.',
};

function createStore() {
  return configureStore({
    reducer: { recentlyViewed: recentlyViewedReducer },
  });
}

describe('recently viewed recipes', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('persists history per user and moves a newly viewed recipe to the front', async () => {
    const store = createStore();
    await store.dispatch(loadRecentlyViewed('user-1')).unwrap();
    await store.dispatch(loadRecentlyViewed('user-2')).unwrap();
    await store
      .dispatch(recordRecentlyViewed({ userId: 'user-1', meal }))
      .unwrap();
    await store
      .dispatch(
        recordRecentlyViewed({
          userId: 'user-1',
          meal: { ...meal, idMeal: '52773', strMeal: 'Another meal' },
        }),
      )
      .unwrap();
    await store
      .dispatch(recordRecentlyViewed({ userId: 'user-1', meal }))
      .unwrap();

    const restoredStore = createStore();
    await restoredStore.dispatch(loadRecentlyViewed('user-1')).unwrap();
    await restoredStore.dispatch(loadRecentlyViewed('user-2')).unwrap();

    expect(
      restoredStore.getState().recentlyViewed.byUser['user-1']?.map(
        ({ idMeal }) => idMeal,
      ),
    ).toEqual(['52772', '52773']);
    expect(
      restoredStore.getState().recentlyViewed.byUser['user-2'],
    ).toEqual([]);
  });
});
