import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  readIngredientChecklist,
  saveIngredientChecklist,
} from '../ingredientChecklistStorage';

jest.mock('@react-native-async-storage/async-storage', () => {
  const values = new Map<string, string>();
  return {
    __esModule: true,
    default: {
      clear: jest.fn(async () => values.clear()),
      getItem: jest.fn(async (key: string) => values.get(key) ?? null),
      setItem: jest.fn(async (key: string, value: string) =>
        values.set(key, value),
      ),
    },
  };
});

describe('ingredient checklist storage', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('persists checked ingredients separately for each user and recipe', async () => {
    await saveIngredientChecklist('user 1', 'recipe/1', ['salt', 'oil']);
    await saveIngredientChecklist('user 2', 'recipe/1', ['pepper']);

    await expect(
      readIngredientChecklist('user 1', 'recipe/1'),
    ).resolves.toEqual(['salt', 'oil']);
    await expect(
      readIngredientChecklist('user 2', 'recipe/1'),
    ).resolves.toEqual(['pepper']);
    await expect(
      readIngredientChecklist('user 1', 'recipe/2'),
    ).resolves.toEqual([]);
  });

  it('deduplicates checks and supports reset by saving an empty list', async () => {
    await saveIngredientChecklist('user', 'recipe', ['salt', 'salt']);
    await saveIngredientChecklist('user', 'recipe', []);

    await expect(
      readIngredientChecklist('user', 'recipe'),
    ).resolves.toEqual([]);
  });
});
