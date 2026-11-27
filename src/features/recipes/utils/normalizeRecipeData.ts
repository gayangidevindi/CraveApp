interface AreaValue {
  strArea: string;
}

interface CategoryValue {
  idCategory: string;
  strCategory: string;
}

interface RecipeIdValue {
  idMeal: string;
}

function normalizeText(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

export function normalizeUniqueStrings(values: readonly unknown[]): string[] {
  const seen = new Set<string>();
  const normalizedValues: string[] = [];

  for (const value of values) {
    const normalized = normalizeText(value);
    if (normalized === null) {
      continue;
    }

    const key = normalized.toLowerCase();
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    normalizedValues.push(normalized);
  }

  return normalizedValues;
}

export function normalizeUniqueAreas<T extends AreaValue>(
  areas: readonly T[],
): T[] {
  const seen = new Set<string>();
  const normalizedAreas: T[] = [];

  for (const area of areas) {
    const strArea = normalizeText(area.strArea);
    if (strArea === null) {
      continue;
    }

    const key = strArea.toLowerCase();
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    normalizedAreas.push(Object.assign({}, area, { strArea }));
  }

  return normalizedAreas;
}

export function normalizeUniqueCategories<T extends CategoryValue>(
  categories: readonly T[],
): T[] {
  const seenIds = new Set<string>();
  const seenNames = new Set<string>();
  const normalizedCategories: T[] = [];

  for (const category of categories) {
    const idCategory = normalizeText(category.idCategory);
    const strCategory = normalizeText(category.strCategory);
    if (idCategory === null || strCategory === null) {
      continue;
    }

    const idKey = idCategory.toLowerCase();
    const nameKey = strCategory.toLowerCase();
    if (seenIds.has(idKey) || seenNames.has(nameKey)) {
      continue;
    }

    seenIds.add(idKey);
    seenNames.add(nameKey);
    normalizedCategories.push(
      Object.assign({}, category, { idCategory, strCategory }),
    );
  }

  return normalizedCategories;
}

export function uniqueRecipesById<T extends RecipeIdValue>(
  recipes: readonly T[],
): T[] {
  const seen = new Set<string>();
  const uniqueRecipes: T[] = [];

  for (const recipe of recipes) {
    const idMeal = normalizeText(recipe.idMeal);
    if (idMeal === null || seen.has(idMeal)) {
      continue;
    }

    seen.add(idMeal);
    uniqueRecipes.push(Object.assign({}, recipe, { idMeal }));
  }

  return uniqueRecipes;
}
