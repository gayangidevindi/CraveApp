import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { configureStore } from '@reduxjs/toolkit';

import { mealApi } from '../mealApi';
import networkReducer, { networkStatusChanged } from '../../../../store/networkSlice';
import { createNetworkStatusHandler } from '../../../../store/networkStatusHandler';

jest.mock('@react-native-async-storage/async-storage', () => {
  const values = new Map<string, string>();

  return {
    __esModule: true,
    default: {
      clear: jest.fn(async () => values.clear()),
      getItem: jest.fn(async (key: string) => values.get(key) ?? null),
      getAllKeys: jest.fn(async () => Array.from(values.keys())),
      multiRemove: jest.fn(async (keys: string[]) =>
        keys.forEach((key) => values.delete(key)),
      ),
      removeItem: jest.fn(async (key: string) => values.delete(key)),
      setItem: jest.fn(async (key: string, value: string) =>
        values.set(key, value),
      ),
    },
  };
});

jest.mock('@react-native-community/netinfo', () => ({
  __esModule: true,
  default: {
    fetch: jest.fn().mockResolvedValue({
      isConnected: true,
      isInternetReachable: true,
    }),
  },
}));

jest.mock('react-redux', () => ({
  useDispatch: jest.fn(),
  useSelector: jest.fn(),
  useStore: jest.fn(),
  batch: (callback: () => void) => callback(),
}));

const meal = {
  idMeal: '52772',
  strMeal: 'Teriyaki Chicken Casserole',
  strMealThumb: 'https://www.themealdb.com/images/media/meals/wvpsxx1468256321.jpg',
  strCategory: 'Chicken',
  strArea: 'Japanese',
  strInstructions: 'Cook the chicken and serve.',
};

function createTestStore(isOffline = false) {
  const store = configureStore({
    reducer: {
      [mealApi.reducerPath]: mealApi.reducer,
      network: networkReducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(mealApi.middleware),
  });

  if (isOffline) {
    store.dispatch(networkStatusChanged(true));
  }

  return store;
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('mealApi', () => {
  let fetchMock: jest.SpyInstance;

  beforeEach(() => {
    jest.useFakeTimers();
    fetchMock = jest.spyOn(globalThis, 'fetch');
    jest.mocked(NetInfo.fetch).mockResolvedValue({
      isConnected: true,
      isInternetReachable: true,
    } as Awaited<ReturnType<typeof NetInfo.fetch>>);
  });

  afterEach(async () => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    jest.restoreAllMocks();
    await AsyncStorage.clear();
  });

  it('searches meals by name through search.php?s=', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ meals: [meal] }));
    const store = createTestStore();
    const query = store.dispatch(
      mealApi.endpoints.searchMeals.initiate('Teriyaki'),
    );

    try {
      await expect(query.unwrap()).resolves.toEqual([meal]);
      expect(fetchMock.mock.calls[0]?.[0]).toMatchObject({
        url: 'https://www.themealdb.com/api/json/v1/1/search.php?s=Teriyaki',
      });
    } finally {
      query.unsubscribe();
      store.dispatch(mealApi.util.resetApiState());
    }
  });

  it('filters meals through filter.php?c=', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({
        meals: [
          {
            idMeal: '52772',
            strMeal: 'Teriyaki Chicken Casserole',
            strMealThumb:
              'https://www.themealdb.com/images/media/meals/wvpsxx1468256321.jpg',
          },
        ],
      }),
    );
    const store = createTestStore();
    const query = store.dispatch(
      mealApi.endpoints.filterMealsByCategory.initiate('Seafood'),
    );

    try {
      await expect(query.unwrap()).resolves.toHaveLength(1);
      expect(fetchMock.mock.calls[0]?.[0]).toMatchObject({
        url: 'https://www.themealdb.com/api/json/v1/1/filter.php?c=Seafood',
      });
    } finally {
      query.unsubscribe();
      store.dispatch(mealApi.util.resetApiState());
    }
  });

  it('filters meals by cuisine through filter.php?a=', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ meals: [meal] }));
    const store = createTestStore();
    const query = store.dispatch(
      mealApi.endpoints.filterMealsByArea.initiate('Japanese'),
    );

    try {
      await expect(query.unwrap()).resolves.toEqual([meal]);
      expect(fetchMock.mock.calls[0]?.[0]).toMatchObject({
        url: 'https://www.themealdb.com/api/json/v1/1/filter.php?a=Japanese',
      });
    } finally {
      query.unsubscribe();
      store.dispatch(mealApi.util.resetApiState());
    }
  });

  it('loads cuisine names from TheMealDB', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ meals: [{ strArea: 'Japanese' }, { strArea: 'Indian' }] }),
    );
    const store = createTestStore();
    const query = store.dispatch(mealApi.endpoints.getMealAreas.initiate());

    try {
      await expect(query.unwrap()).resolves.toEqual(['Japanese', 'Indian']);
      expect(fetchMock.mock.calls[0]?.[0]).toMatchObject({
        url: 'https://www.themealdb.com/api/json/v1/1/list.php?a=list',
      });
    } finally {
      query.unsubscribe();
      store.dispatch(mealApi.util.resetApiState());
    }
  });

  it('returns a random recipe from TheMealDB', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ meals: [meal] }));
    const store = createTestStore();
    const query = store.dispatch(mealApi.endpoints.getRandomMeal.initiate());

    try {
      await expect(query.unwrap()).resolves.toEqual(meal);
      expect(fetchMock.mock.calls[0]?.[0]).toMatchObject({
        url: 'https://www.themealdb.com/api/json/v1/1/random.php',
      });
    } finally {
      query.unsubscribe();
      store.dispatch(mealApi.util.resetApiState());
    }
  });

  it('turns the API no-results response into an empty list', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ meals: null }));
    const store = createTestStore();
    const query = store.dispatch(
      mealApi.endpoints.searchMeals.initiate('no matching recipe'),
    );

    try {
      await expect(query.unwrap()).resolves.toEqual([]);
    } finally {
      query.unsubscribe();
      store.dispatch(mealApi.util.resetApiState());
    }
  });

  it('looks up full recipe details by recipe ID', async () => {
    const details = {
      ...meal,
      strYoutube: 'https://www.youtube.com/watch?v=example',
      strIngredient1: 'soy sauce',
      strMeasure1: '3/4 cup',
    };
    fetchMock.mockResolvedValue(jsonResponse({ meals: [details] }));
    const store = createTestStore();
    const query = store.dispatch(
      mealApi.endpoints.getRecipeDetails.initiate('52772'),
    );

    try {
      await expect(query.unwrap()).resolves.toEqual(details);
      expect(fetchMock.mock.calls[0]?.[0]).toMatchObject({
        url: 'https://www.themealdb.com/api/json/v1/1/lookup.php?i=52772',
      });
    } finally {
      query.unsubscribe();
      store.dispatch(mealApi.util.resetApiState());
    }
  });

  it('returns null when the recipe lookup finds no meal', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ meals: null }));
    const store = createTestStore();
    const query = store.dispatch(
      mealApi.endpoints.getRecipeDetails.initiate('missing'),
    );

    try {
      await expect(query.unwrap()).resolves.toBeNull();
    } finally {
      query.unsubscribe();
      store.dispatch(mealApi.util.resetApiState());
    }
  });

  it('serves previously fetched recipes when the device is offline', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ meals: [meal] }));
    const store = createTestStore();
    const onlineQuery = store.dispatch(
      mealApi.endpoints.searchMeals.initiate('Teriyaki'),
    );

    await expect(onlineQuery.unwrap()).resolves.toEqual([meal]);
    onlineQuery.unsubscribe();
    store.dispatch(mealApi.util.resetApiState());
    store.dispatch(networkStatusChanged(true));

    const offlineQuery = store.dispatch(
      mealApi.endpoints.searchMeals.initiate('Teriyaki'),
    );

    try {
      await expect(offlineQuery.unwrap()).resolves.toEqual([meal]);
      expect(fetchMock).toHaveBeenCalledTimes(1);
    } finally {
      offlineQuery.unsubscribe();
      store.dispatch(mealApi.util.resetApiState());
    }
  });

  it('serves the last cached list when TheMealDB returns a server error', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ meals: [meal] }))
      .mockResolvedValueOnce(jsonResponse({ message: 'Unavailable' }, 503));
    const store = createTestStore();
    const firstQuery = store.dispatch(
      mealApi.endpoints.searchMeals.initiate('Teriyaki'),
    );
    await expect(firstQuery.unwrap()).resolves.toEqual([meal]);
    firstQuery.unsubscribe();
    store.dispatch(mealApi.util.resetApiState());

    const refreshQuery = store.dispatch(
      mealApi.endpoints.searchMeals.initiate('Teriyaki'),
    );
    try {
      await expect(refreshQuery.unwrap()).resolves.toEqual([meal]);
      expect(fetchMock).toHaveBeenCalledTimes(2);
    } finally {
      refreshQuery.unsubscribe();
      store.dispatch(mealApi.util.resetApiState());
    }
  });

  it('serves cached recipe details when offline', async () => {
    const details = {
      ...meal,
      strYoutube: 'https://www.youtube.com/watch?v=example',
      strIngredient1: 'soy sauce',
      strMeasure1: '3/4 cup',
    };
    fetchMock.mockResolvedValueOnce(jsonResponse({ meals: [details] }));
    const store = createTestStore();
    const onlineQuery = store.dispatch(
      mealApi.endpoints.getRecipeDetails.initiate('52772'),
    );

    await expect(onlineQuery.unwrap()).resolves.toEqual(details);
    onlineQuery.unsubscribe();
    store.dispatch(mealApi.util.resetApiState());
    store.dispatch(networkStatusChanged(true));

    const offlineQuery = store.dispatch(
      mealApi.endpoints.getRecipeDetails.initiate('52772'),
    );

    try {
      await expect(offlineQuery.unwrap()).resolves.toEqual(details);
      expect(fetchMock).toHaveBeenCalledTimes(1);
    } finally {
      offlineQuery.unsubscribe();
      store.dispatch(mealApi.util.resetApiState());
    }
  });

  it('invalidates recipe and category queries after reconnecting', () => {
    const store = createTestStore();
    const dispatchSpy = jest.spyOn(store, 'dispatch');
    const updateNetworkStatus = createNetworkStatusHandler(store.dispatch);

    updateNetworkStatus({
      isConnected: true,
      isInternetReachable: true,
    });
    updateNetworkStatus({
      isConnected: false,
      isInternetReachable: false,
    });
    updateNetworkStatus({
      isConnected: true,
      isInternetReachable: true,
    });

    expect(store.getState().network.isOffline).toBe(false);
    expect(dispatchSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: mealApi.util.invalidateTags.type,
        payload: ['Meal', 'Category'],
      }),
    );

    store.dispatch(mealApi.util.resetApiState());
  });

  it('returns a clear error when offline data has not been cached', async () => {
    const store = createTestStore(true);
    const query = store.dispatch(
      mealApi.endpoints.searchMeals.initiate('Teriyaki'),
    );

    try {
      await expect(query.unwrap()).rejects.toMatchObject({
        status: 'CUSTOM_ERROR',
        error: 'No cached recipe data is available while offline.',
      });
      expect(fetchMock).not.toHaveBeenCalled();
    } finally {
      query.unsubscribe();
      store.dispatch(mealApi.util.resetApiState());
    }
  });

  it('keeps the previous saved result when the API returns no recipes', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ meals: [meal] }))
      .mockResolvedValueOnce(jsonResponse({ meals: null }));
    const store = createTestStore();
    const initialQuery = store.dispatch(
      mealApi.endpoints.searchMeals.initiate('Teriyaki'),
    );

    await expect(initialQuery.unwrap()).resolves.toEqual([meal]);
    initialQuery.unsubscribe();
    store.dispatch(mealApi.util.resetApiState());

    const emptyQuery = store.dispatch(
      mealApi.endpoints.searchMeals.initiate('Teriyaki'),
    );
    await expect(emptyQuery.unwrap()).resolves.toEqual([]);
    emptyQuery.unsubscribe();
    store.dispatch(mealApi.util.resetApiState());
    store.dispatch(networkStatusChanged(true));

    const offlineQuery = store.dispatch(
      mealApi.endpoints.searchMeals.initiate('Teriyaki'),
    );

    try {
      await expect(offlineQuery.unwrap()).resolves.toEqual([meal]);
    } finally {
      offlineQuery.unsubscribe();
      store.dispatch(mealApi.util.resetApiState());
    }
  });
});
