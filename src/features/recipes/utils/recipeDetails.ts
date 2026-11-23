import type { MealDetails } from '../services/mealApi';

export interface RecipeIngredient {
  ingredient: string;
  measure: string;
}

export interface RecipeInstruction {
  text: string;
  number?: number;
}

export function parseRecipeIngredients(meal: MealDetails): RecipeIngredient[] {
  const ingredients: RecipeIngredient[] = [];

  for (let index = 1; index <= 20; index += 1) {
    const ingredient = meal[`strIngredient${index}`];

    if (typeof ingredient !== 'string' || ingredient.trim().length === 0) {
      continue;
    }

    const measure = meal[`strMeasure${index}`];
    ingredients.push({
      ingredient: ingredient.trim(),
      measure: typeof measure === 'string' ? measure.trim() : '',
    });
  }

  return ingredients;
}

export function parseRecipeInstructions(
  instructions: string | null | undefined,
): RecipeInstruction[] {
  const lines = (instructions ?? '')
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length === 0) {
    return [];
  }

  const numberedLines = lines.map((line) =>
    line.match(/^(?:step\s+)?(\d+)[.):]\s*(.+)$/i),
  );
  const hasSequentialNumbers = numberedLines.every(
    (match, index) => match !== null && Number(match[1]) === index + 1,
  );

  if (hasSequentialNumbers) {
    return numberedLines.map((match, index) => ({
      number: index + 1,
      text: match?.[2] ?? '',
    }));
  }

  return lines.map((text) => ({ text }));
}
