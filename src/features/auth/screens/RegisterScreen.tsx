import { Feather } from '@expo/vector-icons';
import { zodResolver } from '@hookform/resolvers/zod';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Controller, useForm } from 'react-hook-form';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect, useState } from 'react';

import type { AuthStackParamList } from '../../../navigation/types';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { submitRegistration, clearRegistrationFeedback } from '../state/authActions';
import {
  registrationSchema,
  type RegistrationFormData,
} from '../schemas/authSchemas';
import type { RegistrationRequest } from '../types/authTypes';
import { AuthNotice } from '../components/AuthNotice';
import { CustomButton } from '../../../shared/components/CustomButton';
import { CustomInput } from '../../../shared/components/CustomInput';
import { theme } from '../../../shared/theme/theme';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

export function RegisterScreen({ navigation }: Props) {
  const dispatch = useAppDispatch();
  const {
    registrationStatus,
    registrationMessage,
    registrationError,
  } = useAppSelector((state) => state.auth);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const isLoading = registrationStatus === 'loading';
  const { control, handleSubmit } = useForm<RegistrationFormData>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      fullName: '',
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  useEffect(
    () => () => {
      dispatch(clearRegistrationFeedback());
    },
    [dispatch],
  );

  const onSubmit = async (values: RegistrationFormData) => {
    const [firstName, ...lastNameParts] = values.fullName.trim().split(/\s+/);
    const registration: RegistrationRequest = {
      firstName,
      lastName: lastNameParts.join(' '),
      username: values.username,
      email: values.email,
      password: values.password,
    };

    await dispatch(submitRegistration(registration));
  };

  const clearRegistrationMessage = () => {
    if (registrationStatus !== 'idle') {
      dispatch(clearRegistrationFeedback());
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.form}>
            <View style={styles.brand}>
              <View style={styles.logo}>
                <Feather
                  name="coffee"
                  size={24}
                  color={theme.colors.darkBrown}
                  accessible={false}
                />
              </View>
              <Text style={styles.title}>Create your account</Text>
              <Text style={styles.subtitle}>
                Join CraveApp and make room for something delicious.
              </Text>
            </View>

            {registrationError ? (
              <AuthNotice message={registrationError} />
            ) : null}
            {registrationMessage ? (
              <AuthNotice message={registrationMessage} tone="success" />
            ) : null}

            <View style={styles.fields}>
              <Controller
                control={control}
                name="fullName"
                render={({ field, fieldState }) => (
                  <CustomInput
                    label="Full name"
                    placeholder="Enter your full name"
                    icon="user"
                    autoCapitalize="words"
                    autoComplete="name"
                    textContentType="name"
                    value={field.value}
                    onBlur={field.onBlur}
                    onChangeText={(value) => {
                      field.onChange(value);
                      clearRegistrationMessage();
                    }}
                    error={fieldState.error?.message}
                    editable={!isLoading}
                  />
                )}
              />

              <Controller
                control={control}
                name="username"
                render={({ field, fieldState }) => (
                  <CustomInput
                    label="Username"
                    placeholder="Choose a username"
                    icon="at-sign"
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="username-new"
                    textContentType="username"
                    value={field.value}
                    onBlur={field.onBlur}
                    onChangeText={(value) => {
                      field.onChange(value);
                      clearRegistrationMessage();
                    }}
                    error={fieldState.error?.message}
                    editable={!isLoading}
                  />
                )}
              />

              <Controller
                control={control}
                name="email"
                render={({ field, fieldState }) => (
                  <CustomInput
                    label="Email"
                    placeholder="you@example.com"
                    icon="mail"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="email"
                    textContentType="emailAddress"
                    value={field.value}
                    onBlur={field.onBlur}
                    onChangeText={(value) => {
                      field.onChange(value);
                      clearRegistrationMessage();
                    }}
                    error={fieldState.error?.message}
                    editable={!isLoading}
                  />
                )}
              />

              <Controller
                control={control}
                name="password"
                render={({ field, fieldState }) => (
                  <CustomInput
                    label="Password"
                    placeholder="At least 8 characters"
                    icon="lock"
                    rightIcon={passwordVisible ? 'eye-off' : 'eye'}
                    rightIconAccessibilityLabel={
                      passwordVisible ? 'Hide password' : 'Show password'
                    }
                    onRightIconPress={() =>
                      setPasswordVisible((visible) => !visible)
                    }
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="new-password"
                    textContentType="newPassword"
                    secureTextEntry={!passwordVisible}
                    value={field.value}
                    onBlur={field.onBlur}
                    onChangeText={(value) => {
                      field.onChange(value);
                      clearRegistrationMessage();
                    }}
                    error={fieldState.error?.message}
                    editable={!isLoading}
                  />
                )}
              />

              <Controller
                control={control}
                name="confirmPassword"
                render={({ field, fieldState }) => (
                  <CustomInput
                    label="Confirm password"
                    placeholder="Re-enter your password"
                    icon="lock"
                    rightIcon={confirmPasswordVisible ? 'eye-off' : 'eye'}
                    rightIconAccessibilityLabel={
                      confirmPasswordVisible ? 'Hide password' : 'Show password'
                    }
                    onRightIconPress={() =>
                      setConfirmPasswordVisible((visible) => !visible)
                    }
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="new-password"
                    textContentType="newPassword"
                    secureTextEntry={!confirmPasswordVisible}
                    value={field.value}
                    onBlur={field.onBlur}
                    onChangeText={(value) => {
                      field.onChange(value);
                      clearRegistrationMessage();
                    }}
                    error={fieldState.error?.message}
                    editable={!isLoading}
                  />
                )}
              />
            </View>

            <CustomButton
              title="Create account"
              onPress={() => {
                void handleSubmit(onSubmit)();
              }}
              loading={isLoading}
              disabled={isLoading}
              style={styles.submitButton}
            />

            <Text style={styles.disclaimer}>
              This demo saves your account on this device. It is separate from
              DummyJSON and will not sync to other devices.
            </Text>

            <View style={styles.loginLink}>
              <Text style={styles.linkPrompt}>Already have an account?</Text>
              <Pressable
                onPress={() => navigation.navigate('Login')}
                accessibilityRole="link"
                accessibilityLabel="Log in to CraveApp"
                style={styles.linkButton}
              >
                <Text style={styles.linkText}>Log in</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.warmCream,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.xl,
  },
  form: {
    width: '100%',
    maxWidth: 440,
    alignSelf: 'center',
    gap: theme.spacing.md,
  },
  brand: {
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  logo: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.primary,
  },
  title: {
    marginTop: theme.spacing.md,
    color: theme.colors.darkBrown,
    fontSize: theme.typography.title,
    fontWeight: theme.typography.weight.bold,
    textAlign: 'center',
  },
  subtitle: {
    marginTop: theme.spacing.xs,
    color: theme.colors.chocolateBrown,
    fontSize: theme.typography.body,
    lineHeight: theme.typography.lineHeight.body,
    textAlign: 'center',
  },
  fields: {
    gap: theme.spacing.md,
  },
  submitButton: {
    width: '100%',
  },
  disclaimer: {
    color: theme.colors.chocolateBrown,
    fontSize: theme.typography.caption,
    lineHeight: theme.typography.lineHeight.caption,
    textAlign: 'center',
  },
  loginLink: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
  },
  linkPrompt: {
    color: theme.colors.chocolateBrown,
    fontSize: theme.typography.body,
  },
  linkButton: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.xs,
  },
  linkText: {
    color: theme.colors.deepOrange,
    fontSize: theme.typography.body,
    fontWeight: theme.typography.weight.bold,
    textDecorationLine: 'underline',
  },
});
