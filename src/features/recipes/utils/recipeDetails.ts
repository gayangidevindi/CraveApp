import type { MealDetails } from '../services/mealApi';

export interface RecipeIngredient {
  ingredient: string;
  measure: string;
}

export interface RecipeInstruction {
  text: string;
  number: number;
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
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>\s*<p(?:\s[^>]*)?>/gi, '\n\n')
    .replace(/<\/?p(?:\s[^>]*)?>/gi, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((line) => line.trim())
    .map((line) => line.replace(/[ \t]+/g, ' '));

  const parsedInstructions: string[] = [];
  let currentInstruction = '';
  let waitingForInstruction = false;
  let foundStepMarkers = false;

  const addCurrentInstruction = () => {
    const text = cleanInstructionText(currentInstruction);
    if (text.length > 0) {
      parsedInstructions.push(text);
    }
    currentInstruction = '';
  };

  for (const line of lines) {
    if (line.length === 0) {
      addCurrentInstruction();
      continue;
    }

    const marker = parseInstructionMarker(line);
    if (marker !== null) {
      foundStepMarkers = true;
      addCurrentInstruction();
      currentInstruction = marker.text;
      waitingForInstruction = marker.text.length === 0;
      continue;
    }

    if (waitingForInstruction) {
      currentInstruction = line;
      waitingForInstruction = false;
      continue;
    }

    if (foundStepMarkers && currentInstruction.length > 0) {
      currentInstruction = `${currentInstruction} ${line}`;
    } else {
      addCurrentInstruction();
      currentInstruction = line;
    }
  }

  addCurrentInstruction();

  return parsedInstructions.map((text, index) => ({
    number: index + 1,
    text,
  }));
}

interface InstructionMarker {
  text: string;
}

function parseInstructionMarker(line: string): InstructionMarker | null {
  const stepLabel = /^step\s+(\d+)(.*)$/i.exec(line);
  if (stepLabel !== null) {
    const remainder = stepLabel[2] ?? '';
    if (
      remainder.length > 0 &&
      !/^(?:\s+|\s*[:.)\-–—])/.test(remainder)
    ) {
      return null;
    }

    return {
      text: remainder
        .trim()
        .replace(/^[:.)\-–—]+\s*/, '')
        .trim(),
    };
  }

  if (/^\d{1,3}\s*[.):]?\s*$/.test(line)) {
    return { text: '' };
  }

  const numberedStep =
    /^\d{1,3}\s*[.)]\s+(.+)$/.exec(line) ??
    /^\d{1,3}\s*:\s+(.+)$/.exec(line) ??
    /^\d{1,3}\s*[-–—]\s+(.+)$/.exec(line);
  if (numberedStep !== null) {
    return { text: numberedStep[1]?.trim() ?? '' };
  }

  const bullet = /^(?:[-*•▪◦‣–—])(?:\s+|$)(.*)$/.exec(line);
  if (bullet !== null) {
    return { text: bullet[1]?.trim() ?? '' };
  }

  return null;
}

function cleanInstructionText(text: string): string {
  let cleaned = text.trim();

  for (let count = 0; count < 3; count += 1) {
    const marker = parseInstructionMarker(cleaned);
    if (marker === null || marker.text.length === 0) {
      break;
    }
    cleaned = marker.text.trim();
  }

  return cleaned.replace(/\s+/g, ' ').trim();
}
