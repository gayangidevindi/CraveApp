import { configureStore } from '@reduxjs/toolkit';

import { mealApi } from '../mealApi';

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

function createTestStore() {
  return configureStore({
    reducer: {
      [mealApi.reducerPath]: mealApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(mealApi.middleware),
  });
}

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('mealApi', () => {
  let fetchMock: jest.SpyInstance;

  beforeEach(() => {
    jest.useFakeTimers();
    fetchMock = jest.spyOn(globalThis, 'fetch');
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    jest.restoreAllMocks();
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
});
