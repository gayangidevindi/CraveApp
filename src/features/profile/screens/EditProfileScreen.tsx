import { zodResolver } from '@hookform/resolvers/zod';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useMemo, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { MainStackParamList } from '../../../navigation/types';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { CustomButton } from '../../../shared/components/CustomButton';
import { CustomInput } from '../../../shared/components/CustomInput';
import { ErrorState } from '../../../shared/components/ErrorState';
import { LoadingState } from '../../../shared/components/LoadingState';
import { OfflineBanner } from '../../../shared/components/OfflineBanner';
import { useCraveThemeStyles } from '../../../shared/theme/useCraveTheme';
import { AuthNotice } from '../../auth/components/AuthNotice';
import {
  loadUserProfile,
  updateUserProfile,
} from '../state/profileSlice';
import {
  cookingSkillOptions,
  createDefaultUserProfile,
  cuisineOptions,
  dietaryOptions,
  profileFormSchema,
  type CuisinePreference,
  type DietaryPreference,
  type ProfileFormValues,
} from '../types/profileTypes';

type Props = NativeStackScreenProps<MainStackParamList, 'EditProfile'>;

function getErrorMessage(error: unknown): string {
  if (typeof error === 'string') {
    return error;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return 'Your profile could not be saved. Please try again.';
}

function toggleChoice<T extends string>(
  selected: T[],
  choice: T,
): T[] {
  return selected.includes(choice)
    ? selected.filter((item) => item !== choice)
    : [...selected, choice];
}

interface ChoiceChipsProps<T extends string> {
  label: string;
  options: readonly T[];
  selected: readonly T[];
  onToggle: (value: T) => void;
}

function ChoiceChips<T extends string>({
  label,
  options,
  selected,
  onToggle,
}: ChoiceChipsProps<T>) {
  const { styles } = useCraveThemeStyles(createStyles);

  return (
    <View style={styles.preferenceField}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.chipList}>
        {options.map((option) => {
          const isSelected = selected.includes(option);

          return (
            <Pressable
              key={option}
              onPress={() => onToggle(option)}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              style={[
                styles.chip,
                isSelected && styles.selectedChip,
              ]}
            >
              <Text
                style={[
                  styles.chipText,
                  isSelected && styles.selectedChipText,
                ]}
              >
                {option}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function EditProfileScreen({ navigation }: Props) {
  const { styles } = useCraveThemeStyles(createStyles);
  const dispatch = useAppDispatch();
  const { width } = useWindowDimensions();
  const user = useAppSelector((state) => state.auth.user);
  const isOffline = useAppSelector((state) => state.network.isOffline);
  const profileState = useAppSelector((state) => state.profile);
  const userId = user ? String(user.id) : null;
  const storedProfile =
    userId !== null ? profileState.byUser[userId] : undefined;
  const loaded =
    userId !== null && profileState.loadedByUser[userId] === true;
  const loading =
    userId !== null && profileState.loadingByUser[userId] === true;
  const saving =
    userId !== null && profileState.savingByUser[userId] === true;
  const profileError =
    userId !== null ? profileState.errorByUser[userId] : null;
  const authenticatedName =
    [user?.firstName, user?.lastName].filter(Boolean).join(' ') ||
    user?.username ||
    '';
  const defaultProfile = useMemo(
    () => ({
      ...createDefaultUserProfile(authenticatedName),
      ...(storedProfile ?? {}),
    }),
    [authenticatedName, storedProfile],
  );
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    control,
    handleSubmit,
    reset,
    setValue,
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: defaultProfile,
  });
  const preferredCuisines =
    useWatch({ control, name: 'preferredCuisines' }) ?? [];
  const dietaryPreferences =
    useWatch({ control, name: 'dietaryPreferences' }) ?? [];
  const cookingSkill =
    useWatch({ control, name: 'cookingSkill' }) ?? 'Not specified';

  useEffect(() => {
    if (userId !== null && !loaded && !loading) {
      void dispatch(loadUserProfile(userId));
    }
  }, [dispatch, loaded, loading, userId]);

  useEffect(() => {
    if (loaded) {
      reset(defaultProfile);
    }
  }, [defaultProfile, loaded, reset]);

  const onSubmit = async (values: ProfileFormValues) => {
    if (userId === null) {
      setSubmitError('A signed-in account is required to edit this profile.');
      return;
    }

    setSubmitError(null);
    setSavedMessage(null);

    try {
      await dispatch(
        updateUserProfile({
          userId,
          profile: {
            ...values,
            avatarDataUri: storedProfile?.avatarDataUri ?? null,
          },
        }),
      ).unwrap();
      setSavedMessage('Your profile has been saved on this device.');
    } catch (error) {
      setSubmitError(getErrorMessage(error));
    }
  };

  if (userId === null) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <ErrorState
          title="Profile unavailable"
          message="Sign in again to edit your profile."
          retryLabel="Go back"
          onRetry={() => navigation.goBack()}
        />
      </SafeAreaView>
    );
  }

  if (!loaded) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        {isOffline ? <OfflineBanner /> : null}
        {profileError ? (
          <ErrorState
            title="Profile could not load"
            message={profileError}
            retryLabel="Try again"
            onRetry={() => {
              void dispatch(loadUserProfile(userId));
            }}
          />
        ) : (
          <LoadingState label="Loading your profile..." />
        )}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View
            style={[
              styles.form,
              { maxWidth: width >= 720 ? 600 : 520 },
            ]}
          >
            {isOffline ? <OfflineBanner /> : null}
            <Text style={styles.subtitle}>
              Update your details and tell CraveApp what you like to cook.
            </Text>

            {submitError ? <AuthNotice message={submitError} /> : null}
            {savedMessage ? (
              <AuthNotice message={savedMessage} tone="success" />
            ) : null}
            {profileError && submitError === null ? (
              <AuthNotice message={profileError} />
            ) : null}

            <Controller
              control={control}
              name="fullName"
              render={({ field, fieldState }) => (
                <CustomInput
                  label="Full name"
                  placeholder="Your full name"
                  icon="user"
                  value={field.value}
                  onBlur={field.onBlur}
                  onChangeText={(value) => {
                    field.onChange(value);
                    setSavedMessage(null);
                  }}
                  error={fieldState.error?.message}
                  editable={!saving}
                  autoCapitalize="words"
                  autoComplete="name"
                  textContentType="name"
                  maxLength={80}
                />
              )}
            />

            <Controller
              control={control}
              name="phoneNumber"
              render={({ field, fieldState }) => (
                <CustomInput
                  label="Phone number"
                  placeholder="Add a phone number"
                  icon="phone"
                  value={field.value}
                  onBlur={field.onBlur}
                  onChangeText={field.onChange}
                  error={fieldState.error?.message}
                  editable={!saving}
                  keyboardType="phone-pad"
                  autoComplete="tel"
                  textContentType="telephoneNumber"
                  maxLength={30}
                />
              )}
            />

            <Controller
              control={control}
              name="city"
              render={({ field, fieldState }) => (
                <CustomInput
                  label="City"
                  placeholder="Where are you based?"
                  icon="map-pin"
                  value={field.value}
                  onBlur={field.onBlur}
                  onChangeText={field.onChange}
                  error={fieldState.error?.message}
                  editable={!saving}
                  autoCapitalize="words"
                  maxLength={80}
                />
              )}
            />

            <Controller
              control={control}
              name="dateOfBirth"
              render={({ field, fieldState }) => (
                <CustomInput
                  label="Date of birth"
                  placeholder="YYYY-MM-DD"
                  icon="calendar"
                  value={field.value}
                  onBlur={field.onBlur}
                  onChangeText={field.onChange}
                  error={fieldState.error?.message}
                  editable={!saving}
                  maxLength={10}
                />
              )}
            />

            <Controller
              control={control}
              name="bio"
              render={({ field, fieldState }) => (
                <CustomInput
                  label="Bio"
                  placeholder="A little about you and your food"
                  icon="edit-3"
                  value={field.value}
                  onBlur={field.onBlur}
                  onChangeText={field.onChange}
                  error={fieldState.error?.message}
                  editable={!saving}
                  multiline
                  maxLength={240}
                />
              )}
            />

            <ChoiceChips<CuisinePreference>
              label="Favorite cuisines"
              options={cuisineOptions}
              selected={preferredCuisines}
              onToggle={(value) => {
                setValue(
                  'preferredCuisines',
                  toggleChoice(preferredCuisines, value),
                  { shouldDirty: true, shouldValidate: true },
                );
                setSavedMessage(null);
              }}
            />

            <ChoiceChips<DietaryPreference>
              label="Dietary preferences"
              options={dietaryOptions}
              selected={dietaryPreferences}
              onToggle={(value) => {
                setValue(
                  'dietaryPreferences',
                  toggleChoice(dietaryPreferences, value),
                  { shouldDirty: true, shouldValidate: true },
                );
                setSavedMessage(null);
              }}
            />

            <View style={styles.preferenceField}>
              <Text style={styles.fieldLabel}>Cooking skill level</Text>
              <View style={styles.chipList}>
                {cookingSkillOptions.map((option) => {
                  const isSelected = cookingSkill === option;

                  return (
                    <Pressable
                      key={option}
                      onPress={() => {
                        setValue('cookingSkill', option, {
                          shouldDirty: true,
                          shouldValidate: true,
                        });
                        setSavedMessage(null);
                      }}
                      accessibilityRole="button"
                      accessibilityState={{ selected: isSelected }}
                      style={[
                        styles.chip,
                        isSelected && styles.selectedChip,
                      ]}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          isSelected && styles.selectedChipText,
                        ]}
                      >
                        {option}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <CustomButton
              title="Save profile"
              icon="check"
              loading={saving}
              disabled={saving}
              onPress={() => {
                void handleSubmit(onSubmit)();
              }}
              style={styles.saveButton}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function createStyles(theme: import('../../../shared/theme/theme').CraveTheme) {
  return StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
  },
  form: {
    width: '100%',
    gap: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
  },
  subtitle: {
    color: theme.colors.chocolateBrown,
    fontSize: theme.typography.body,
    lineHeight: theme.typography.lineHeight.body,
  },
  preferenceField: {
    gap: theme.spacing.sm,
  },
  fieldLabel: {
    color: theme.colors.heading,
    fontSize: theme.typography.label,
    fontWeight: theme.typography.weight.semibold,
    lineHeight: theme.typography.lineHeight.body,
  },
  chipList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  chip: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.card,
  },
  selectedChip: {
    borderColor: theme.colors.deepOrange,
    backgroundColor: theme.colors.elevatedSurface,
  },
  chipText: {
    color: theme.colors.darkBrown,
    fontSize: theme.typography.caption,
    fontWeight: theme.typography.weight.medium,
  },
  selectedChipText: {
    color: theme.colors.darkBrown,
    fontWeight: theme.typography.weight.bold,
  },
  saveButton: {
    width: '100%',
    marginTop: theme.spacing.sm,
  },
  });
}
