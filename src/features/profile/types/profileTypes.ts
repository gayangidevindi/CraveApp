import { z } from 'zod';

export const MAX_PROFILE_IMAGE_DATA_URI_LENGTH = 1_500_000;

export const cuisineOptions = [
  'American',
  'Chinese',
  'Indian',
  'Italian',
  'Japanese',
  'Mediterranean',
  'Mexican',
  'Middle Eastern',
  'Thai',
] as const;

export const dietaryOptions = [
  'Dairy-free',
  'Gluten-free',
  'Halal',
  'Pescatarian',
  'Vegan',
  'Vegetarian',
] as const;

export const cookingSkillOptions = [
  'Not specified',
  'Beginner',
  'Intermediate',
  'Advanced',
] as const;

function isValidDateOfBirth(value: string): boolean {
  if (value.length === 0) {
    return true;
  }

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) {
    return false;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  const today = new Date();
  const latestDate = Date.UTC(
    today.getUTCFullYear(),
    today.getUTCMonth(),
    today.getUTCDate(),
  );

  return (
    year >= 1900 &&
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day &&
    date.getTime() <= latestDate
  );
}

export const profileFormSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, 'Enter a name with at least 2 characters.')
    .max(80, 'Name must be 80 characters or fewer.'),
  phoneNumber: z
    .string()
    .trim()
    .max(30, 'Phone number must be 30 characters or fewer.')
    .refine(
      (value) => value.length === 0 || /^\+?[0-9][0-9()\s-]{5,23}$/.test(value),
      'Enter a valid phone number.',
    ),
  city: z.string().trim().max(80, 'City must be 80 characters or fewer.'),
  dateOfBirth: z
    .string()
    .trim()
    .refine(
      isValidDateOfBirth,
      'Enter a real date in YYYY-MM-DD format that is not in the future.',
    ),
  bio: z.string().trim().max(240, 'Bio must be 240 characters or fewer.'),
  preferredCuisines: z.array(z.enum(cuisineOptions)),
  dietaryPreferences: z.array(z.enum(dietaryOptions)),
  cookingSkill: z.enum(cookingSkillOptions),
});

export const userProfileSchema = profileFormSchema.extend({
  avatarDataUri: z
    .string()
    .max(
      MAX_PROFILE_IMAGE_DATA_URI_LENGTH,
      'Profile picture is too large to save on this device.',
    )
    .startsWith('data:image/jpeg;base64,')
    .nullable(),
});

export type ProfileFormValues = z.infer<typeof profileFormSchema>;
export type UserProfile = z.infer<typeof userProfileSchema>;
export type CookingSkill = (typeof cookingSkillOptions)[number];
export type CuisinePreference = (typeof cuisineOptions)[number];
export type DietaryPreference = (typeof dietaryOptions)[number];

export function createDefaultUserProfile(fullName = ''): UserProfile {
  return {
    fullName,
    phoneNumber: '',
    city: '',
    dateOfBirth: '',
    bio: '',
    preferredCuisines: [],
    dietaryPreferences: [],
    cookingSkill: 'Not specified',
    avatarDataUri: null,
  };
}
