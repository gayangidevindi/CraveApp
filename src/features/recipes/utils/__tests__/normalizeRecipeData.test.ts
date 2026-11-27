import { cuisineOptions } from '../../../profile/types/profileTypes';
import {
  normalizeUniqueAreas,
  normalizeUniqueCategories,
  normalizeUniqueStrings,
  uniqueRecipesById,
} from '../normalizeRecipeData';

describe('recipe data normalization', () => {
  it('trims cuisine names and removes case-insensitive duplicates and invalid values', () => {
    expect(
      normalizeUniqueStrings([
        ' Dominican ',
        'dominican',
        '  Italian',
        'ITALIAN ',
        '',
        '   ',
        null,
        42,
      ]),
    ).toEqual(['Dominican', 'Italian']);
  });

  it('deduplicates values merged from API cuisines and default options', () => {
    const apiCuisines = ['Dominican', 'Japanese', 'Indian'];
    const merged = normalizeUniqueStrings([
      ...apiCuisines,
      ...cuisineOptions,
    ]);

    expect(merged.filter((cuisine) => cuisine.toLowerCase() === 'indian'))
      .toHaveLength(1);
    expect(merged).toContain('Dominican');
    expect(merged).toContain('Mediterranean');
  });

  it('normalizes and deduplicates area records while preserving API fields', () => {
    const areas = normalizeUniqueAreas([
      { strArea: ' Dominican ', strCountry: 'Dominica' },
      { strArea: 'dominican', strCountry: 'Dominican Republic' },
      { strArea: '   ', strCountry: 'Invalid' },
    ]);

    expect(areas).toEqual([
      { strArea: 'Dominican', strCountry: 'Dominica' },
    ]);
  });

  it('normalizes categories and removes duplicate IDs or names', () => {
    const category = (
      idCategory: string,
      strCategory: string,
    ) => ({
      idCategory,
      strCategory,
      strCategoryThumb: '',
      strCategoryDescription: '',
    });

    expect(
      normalizeUniqueCategories([
        category('1', ' Chicken '),
        category('2', 'chicken'),
        category('1', 'Seafood'),
        category('3', '   '),
        category(' ', 'Dessert'),
      ]),
    ).toEqual([category('1', 'Chicken')]);
  });

  it('keeps the first recipe for each trimmed recipe ID', () => {
    const recipes = uniqueRecipesById([
      { idMeal: '52772', strMeal: 'First' },
      { idMeal: ' 52772 ', strMeal: 'Duplicate' },
      { idMeal: '52773', strMeal: 'Second' },
      { idMeal: ' ', strMeal: 'Invalid ID' },
    ]);

    expect(recipes).toEqual([
      { idMeal: '52772', strMeal: 'First' },
      { idMeal: '52773', strMeal: 'Second' },
    ]);
  });
});
