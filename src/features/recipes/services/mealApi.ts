import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { z } from 'zod';

const MEAL_API_BASE_URL = 'https://www.themealdb.com/api/json/v1/1/';

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

export type Meal = z.infer<typeof mealSchema>;
export type MealDetails = z.infer<typeof mealDetailsSchema>;
export type MealCategory = z.infer<typeof categorySchema>;

export const mealApi = createApi({
  reducerPath: 'mealApi',
  baseQuery: fetchBaseQuery({ baseUrl: MEAL_API_BASE_URL }),
  endpoints: (builder) => ({
    getMealCategories: builder.query<MealCategory[], void>({
      query: () => 'categories.php',
      transformResponse: (response: unknown) =>
        categoriesResponseSchema.parse(response).categories ?? [],
    }),
    searchMeals: builder.query<Meal[], string>({
      query: (searchTerm) =>
        `search.php?s=${encodeURIComponent(searchTerm)}`,
      transformResponse: (response: unknown) =>
        mealListResponseSchema.parse(response).meals ?? [],
    }),
    filterMealsByCategory: builder.query<Meal[], string>({
      query: (category) =>
        `filter.php?c=${encodeURIComponent(category)}`,
      transformResponse: (response: unknown) =>
        mealListResponseSchema.parse(response).meals ?? [],
    }),
    getFeaturedMeal: builder.query<Meal | null, void>({
      query: () => 'random.php',
      transformResponse: (response: unknown) =>
        mealListResponseSchema.parse(response).meals?.[0] ?? null,
    }),
    getRecipeDetails: builder.query<MealDetails | null, string>({
      query: (recipeId) => `lookup.php?i=${encodeURIComponent(recipeId)}`,
      transformResponse: (response: unknown) =>
        mealDetailsResponseSchema.parse(response).meals?.[0] ?? null,
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
