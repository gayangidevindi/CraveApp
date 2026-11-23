import type { MealDetails } from '../../services/mealApi';
import {
  parseRecipeIngredients,
  parseRecipeInstructions,
} from '../recipeDetails';

const meal = {
  idMeal: '52772',
  strMeal: 'Teriyaki Chicken Casserole',
  strMealThumb: 'https://example.com/meal.jpg',
} satisfies MealDetails;

describe('parseRecipeIngredients', () => {
  it('pairs trimmed measures and ingredients and skips empty slots', () => {
    const details = {
      ...meal,
      strIngredient1: ' soy sauce ',
      strMeasure1: ' 3/4 cup ',
      strIngredient2: ' ',
      strMeasure2: '1 cup',
      strIngredient3: ' garlic ',
      strMeasure3: null,
      strIngredient20: ' parsley ',
      strMeasure20: 'to garnish',
    } satisfies MealDetails;

    expect(parseRecipeIngredients(details)).toEqual([
      { ingredient: 'soy sauce', measure: '3/4 cup' },
      { ingredient: 'garlic', measure: '' },
      { ingredient: 'parsley', measure: 'to garnish' },
    ]);
  });
});

describe('parseRecipeInstructions', () => {
  it('recognizes explicit sequential numbered steps', () => {
    expect(
      parseRecipeInstructions('1. Prepare the sauce.\r\n2) Bake until ready.'),
    ).toEqual([
      { number: 1, text: 'Prepare the sauce.' },
      { number: 2, text: 'Bake until ready.' },
    ]);
  });

  it('keeps unnumbered instructions as readable paragraphs', () => {
    expect(
      parseRecipeInstructions(
        'Preheat the oven.\r\n\nCombine the ingredients and bake.',
      ),
    ).toEqual([
      { text: 'Preheat the oven.' },
      { text: 'Combine the ingredients and bake.' },
    ]);
  });

  it('returns no instructions for empty input', () => {
    expect(parseRecipeInstructions(' \r\n ')).toEqual([]);
  });
});
