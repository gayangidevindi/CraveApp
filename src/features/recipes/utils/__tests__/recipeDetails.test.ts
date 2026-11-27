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
  it('parses numbered steps and renumbers them sequentially', () => {
    expect(
      parseRecipeInstructions('3. Prepare the sauce.\r\n7) Bake until ready.'),
    ).toEqual([
      { number: 1, text: 'Prepare the sauce.' },
      { number: 2, text: 'Bake until ready.' },
    ]);
  });

  it('joins standalone markers to their instruction instead of rendering them as steps', () => {
    expect(
      parseRecipeInstructions('1\r\nCaramelize the chicken.\r\n2\r\nAdd rice.'),
    ).toEqual([
      { number: 1, text: 'Caramelize the chicken.' },
      { number: 2, text: 'Add rice.' },
    ]);
  });

  it('parses the live Kabse response without losing quantities or durations', () => {
    const response = [
      '1',
      'Caramelize the chicken with olive oil then add a maggi cube and boil it for around 30 minutes.',
      '2',
      'In another pot, add all the veggies and caramelize them till they are soft.',
      '3',
      'Once everything is done, add the rice, raisins & spices to the veggies and add 2 and a half cups of water for the rice to cook.',
      '4',
      'Once the rice is done put everything in the oven.',
    ].join('\r\n');

    expect(parseRecipeInstructions(response)).toEqual([
      {
        number: 1,
        text: 'Caramelize the chicken with olive oil then add a maggi cube and boil it for around 30 minutes.',
      },
      {
        number: 2,
        text: 'In another pot, add all the veggies and caramelize them till they are soft.',
      },
      {
        number: 3,
        text: 'Once everything is done, add the rice, raisins & spices to the veggies and add 2 and a half cups of water for the rice to cook.',
      },
      {
        number: 4,
        text: 'Once the rice is done put everything in the oven.',
      },
    ]);
  });

  it('supports Step labels, bullet points, and mixed formats', () => {
    expect(
      parseRecipeInstructions(
        'Step 1: Mix 1.5 cups flour and 2 tsp. sugar.\n' +
          '• Heat to 180°C.\n' +
          '3\nBake for 10 minutes.',
      ),
    ).toEqual([
      { number: 1, text: 'Mix 1.5 cups flour and 2 tsp. sugar.' },
      { number: 2, text: 'Heat to 180°C.' },
      { number: 3, text: 'Bake for 10 minutes.' },
    ]);
  });

  it('removes duplicated numbering, empty steps, and extra whitespace', () => {
    expect(
      parseRecipeInstructions(
        'Step 1: 1. Chop the vegetables.\n2\n \nStep 3 - Add the vegetables.',
      ),
    ).toEqual([
      { number: 1, text: 'Chop the vegetables.' },
      { number: 2, text: 'Add the vegetables.' },
    ]);
  });

  it('keeps unnumbered line breaks as ordered instructions and a long paragraph as one step', () => {
    expect(
      parseRecipeInstructions('Preheat the oven.\nCombine the ingredients.'),
    ).toEqual([
      { number: 1, text: 'Preheat the oven.' },
      { number: 2, text: 'Combine the ingredients.' },
    ]);
    expect(
      parseRecipeInstructions(
        'Preheat the oven. Mix the ingredients, then bake for 30 minutes.',
      ),
    ).toEqual([
      {
        number: 1,
        text: 'Preheat the oven. Mix the ingredients, then bake for 30 minutes.',
      },
    ]);
  });

  it('returns no instructions for empty input', () => {
    expect(parseRecipeInstructions(' \r\n ')).toEqual([]);
  });
});
