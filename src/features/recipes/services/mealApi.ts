import NetInfo from '@react-native-community/netinfo';
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { z } from 'zod';

import {
  readRecipeCache,
  writeRecipeCache,
} from './recipeCache';

const MEAL_API_BASE_URL = 'https://www.themealdb.com/api/json/v1/1/';
const networkBaseQuery = fetchBaseQuery({ baseUrl: MEAL_API_BASE_URL });

const mealSchema = z
  .object({
    idMeal: z.string(),
    strMeal: z.string(),
    strMealThumb: z.string(),
    strCategory: z.string().nullish(),
    strArea: z.string().nullish(),
    strInstructions: z.string().nullish(),
  })
  .passthrough();

const mealDetailsSchema = mealSchema.extend({
  strTags: z.string().nullish(),
  strYoutube: z.string().nullish(),
});

const categorySchema = z
  .object({
    idCategory: z.string(),
    strCategory: z.string(),
    strCategoryThumb: z.string(),
    strCategoryDescription: z.string(),
  })
  .passthrough();

const mealListResponseSchema = z.object({
  meals: z.array(mealSchema).nullable().optional(),
});

const mealDetailsResponseSchema = z.object({
  meals: z.array(mealDetailsSchema).nullable().optional(),
});

const categoriesResponseSchema = z.object({
  categories: z.array(categorySchema).nullable().optional(),
});

function getUrlParameter(args: unknown, name: string): string | null {
  const url =
    typeof args === 'string'
      ? args
      : typeof args === 'object' &&
          args !== null &&
          'url' in args &&
          typeof args.url === 'string'
        ? args.url
        : null;

  if (url === null) {
    return null;
  }

  const queryStart = url.indexOf('?');
  if (queryStart < 0) {
    return null;
  }

  const query = url.slice(queryStart + 1).split('#', 1)[0];
  const encodedValue = query
    .split('&')
    .map((parameter) => parameter.split('=', 2))
    .find(([key]) => key === name)?.[1];

  if (encodedValue === undefined) {
    return null;
  }

  try {
    return decodeURIComponent(encodedValue.replace(/\+/g, ' '));
  } catch {
    return null;
  }
}

function getCacheKey(endpoint: string, args: unknown): string | null {
  switch (endpoint) {
    case 'getMealCategories':
      return 'categories';
    case 'getFeaturedMeal':
      return 'featured';
    case 'searchMeals': {
      const searchTerm = getUrlParameter(args, 's');
      return searchTerm === null
        ? null
        : `search.${encodeURIComponent(searchTerm.trim().toLowerCase())}`;
    }
    case 'filterMealsByCategory': {
      const category = getUrlParameter(args, 'c');
      return category === null
        ? null
        : `category.${encodeURIComponent(category.trim().toLowerCase())}`;
    }
    case 'getRecipeDetails': {
      const recipeId = getUrlParameter(args, 'i');
      return recipeId === null
        ? null
        : `details.${encodeURIComponent(recipeId)}`;
    }
    default:
      return null;
  }
}

function getCacheSchema(endpoint: string): z.ZodType<unknown> | null {
  switch (endpoint) {
    case 'getMealCategories':
      return categoriesResponseSchema;
    case 'getRecipeDetails':
      return mealDetailsResponseSchema;
    case 'searchMeals':
    case 'filterMealsByCategory':
    case 'getFeaturedMeal':
      return mealListResponseSchema;
    default:
      return null;
  }
}

function hasNonEmptyArray(value: unknown): boolean {
  return Array.isArray(value) && value.length > 0;
}

function hasCacheableData(endpoint: string, response: unknown): boolean {
  if (typeof response !== 'object' || response === null) {
    return false;
  }

  if (endpoint === 'getMealCategories' && 'categories' in response) {
    return hasNonEmptyArray(response.categories);
  }

  if ('meals' in response) {
    return hasNonEmptyArray(response.meals);
  }

  return false;
}

function isOfflineState(state: unknown): boolean {
  if (
    typeof state === 'object' &&
    state !== null &&
    'network' in state &&
    typeof state.network === 'object' &&
    state.network !== null &&
    'isOffline' in state.network
  ) {
    return state.network.isOffline === true;
  }

  return false;
}

async function isDeviceOffline(state: unknown): Promise<boolean> {
  if (isOfflineState(state)) {
    return true;
  }

  try {
    const network = await NetInfo.fetch();
    return (
      network.isConnected === false ||
      network.isInternetReachable === false
    );
  } catch {
    return false;
  }
}

async function getCachedResponse(
  cacheKey: string,
  schema: z.ZodType<unknown>,
): Promise<
  | { data: unknown }
  | {
      error: {
        status: 'CUSTOM_ERROR';
        error: string;
      };
    }
> {
  try {
    const data = await readRecipeCache(cacheKey, schema);

    if (data !== null) {
      return { data };
    }

    return {
      error: {
        status: 'CUSTOM_ERROR',
        error: 'No cached recipe data is available while offline.',
      },
    };
  } catch {
    return {
      error: {
        status: 'CUSTOM_ERROR',
        error: 'Saved recipe data could not be read.',
      },
    };
  }
}

const baseQueryWithOfflineCache: typeof networkBaseQuery = async (
  args,
  api,
  extraOptions,
) => {
  const cacheKey = getCacheKey(api.endpoint, args);
  const cacheSchema = getCacheSchema(api.endpoint);

  if (cacheKey === null || cacheSchema === null) {
    return networkBaseQuery(args, api, extraOptions);
  }

  if (await isDeviceOffline(api.getState())) {
    return getCachedResponse(cacheKey, cacheSchema);
  }

  const response = await networkBaseQuery(args, api, extraOptions);

  if ('error' in response && response.error !== undefined) {
    if (response.error.status === 'FETCH_ERROR') {
      const cachedResponse = await getCachedResponse(cacheKey, cacheSchema);
      if ('data' in cachedResponse) {
        return cachedResponse;
      }

      if (await isDeviceOffline(api.getState())) {
        return cachedResponse;
      }
    }

    return response;
  }

  if (!('data' in response)) {
    return {
      error: {
        status: 'CUSTOM_ERROR',
        error: 'The recipe service returned no response.',
      },
    };
  }

  const validatedResponse = cacheSchema.safeParse(response.data);
  if (!validatedResponse.success) {
    return {
      error: {
        status: 'CUSTOM_ERROR',
        error: 'The recipe service returned invalid data.',
      },
    };
  }

  if (hasCacheableData(api.endpoint, validatedResponse.data)) {
    try {
      await writeRecipeCache(
        cacheKey,
        validatedResponse.data,
        cacheSchema,
      );
    } catch (error) {
      console.warn('Could not save this response for offline use.', error);
    }
  }

  return { data: validatedResponse.data, meta: response.meta };
};

export type Meal = z.infer<typeof mealSchema>;
export type MealDetails = z.infer<typeof mealDetailsSchema>;
export type MealCategory = z.infer<typeof categorySchema>;

export const mealApi = createApi({
  reducerPath: 'mealApi',
  baseQuery: baseQueryWithOfflineCache,
  tagTypes: ['Meal', 'Category'],
  endpoints: (builder) => ({
    getMealCategories: builder.query<MealCategory[], void>({
      query: () => 'categories.php',
      transformResponse: (response: unknown) =>
        categoriesResponseSchema.parse(response).categories ?? [],
      providesTags: ['Category'],
    }),
    searchMeals: builder.query<Meal[], string>({
      query: (searchTerm) =>
        `search.php?s=${encodeURIComponent(searchTerm)}`,
      transformResponse: (response: unknown) =>
        mealListResponseSchema.parse(response).meals ?? [],
      providesTags: ['Meal'],
    }),
    filterMealsByCategory: builder.query<Meal[], string>({
      query: (category) =>
        `filter.php?c=${encodeURIComponent(category)}`,
      transformResponse: (response: unknown) =>
        mealListResponseSchema.parse(response).meals ?? [],
      providesTags: ['Meal'],
    }),
    getFeaturedMeal: builder.query<Meal | null, void>({
      query: () => 'random.php',
      transformResponse: (response: unknown) =>
        mealListResponseSchema.parse(response).meals?.[0] ?? null,
      providesTags: ['Meal'],
    }),
    getRecipeDetails: builder.query<MealDetails | null, string>({
      query: (recipeId) =>
        `lookup.php?i=${encodeURIComponent(recipeId)}`,
      transformResponse: (response: unknown) =>
        mealDetailsResponseSchema.parse(response).meals?.[0] ?? null,
      providesTags: (_result, _error, recipeId) => [
        { type: 'Meal', id: recipeId },
      ],
    }),
  }),
});

export const {
  useGetMealCategoriesQuery,
  useSearchMealsQuery,
  useFilterMealsByCategoryQuery,
  useGetFeaturedMealQuery,
  useGetRecipeDetailsQuery,
} = mealApi;
