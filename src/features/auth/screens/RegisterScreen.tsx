import { zodResolver } from '@hookform/resolvers/zod';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
import { Controller, useForm } from 'react-hook-form';
import {
  Animated,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect, useState } from 'react';

import type { AuthStackParamList } from '../../../navigation/types';
import { useReducedMotion } from '../../../shared/hooks/useReducedMotion';
import { AuthNotice } from '../components/AuthNotice';
import { AuthPhotoHeader } from '../components/AuthPhotoHeader';
import {
  registrationSchema,
  type RegistrationFormData,
} from '../schemas/authSchemas';
import { clearRegistrationFeedback, submitRegistration } from '../state/authActions';
import type { RegistrationRequest } from '../types/authTypes';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { CustomButton } from '../../../shared/components/CustomButton';
import { CustomInput } from '../../../shared/components/CustomInput';
import { useCraveThemeStyles } from '../../../shared/theme/useCraveTheme';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

export function RegisterScreen({ navigation }: Props) {
  const { theme, styles } = useCraveThemeStyles(createStyles);
  const dispatch = useAppDispatch();
  const reduceMotion = useReducedMotion();
  const {
    registrationStatus,
    registrationMessage,
    registrationError,
  } = useAppSelector((state) => state.auth);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const [successScale] = useState(() => new Animated.Value(0.82));
  const [successOpacity] = useState(() => new Animated.Value(0));
  const isLoading = registrationStatus === 'loading';
  const { control, handleSubmit, getValues } = useForm<RegistrationFormData>({
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

  useEffect(() => {
    if (registrationStatus === 'succeeded') {
      Keyboard.dismiss();

      if (reduceMotion) {
        successScale.setValue(1);
        successOpacity.setValue(1);
        return;
      }

      const animation = Animated.parallel([
        Animated.spring(successScale, {
          toValue: 1,
          useNativeDriver: true,
          damping: 16,
          stiffness: 180,
        }),
        Animated.timing(successOpacity, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
      ]);
      animation.start();

      return () => animation.stop();
    }
  }, [reduceMotion, registrationStatus, successOpacity, successScale]);

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

  const continueToLogin = () => {
    navigation.navigate('Login', { username: getValues('username').trim() });
  };

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={['top', 'bottom', 'left', 'right']}
    >
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
        >
          <AuthPhotoHeader
            source={require('../../../../assets/auth/register-food.jpg')}
            accessibilityLabel="Overhead photograph of pesto pasta with fresh tomatoes"
            compact
          />

          <View style={styles.form}>
            <Pressable
              onPress={() => navigation.goBack()}
              accessibilityRole="button"
              accessibilityLabel="Go back to login"
              hitSlop={4}
              style={({ pressed }) => [
                styles.backButton,
                pressed && styles.pressed,
              ]}
            >
              <Feather
                name="arrow-left"
                size={19}
                color={theme.colors.darkBrown}
                accessible={false}
              />
              <Text style={styles.backLabel}>Back</Text>
            </Pressable>

            <View style={styles.heading}>
              <Text style={styles.title}>Create account</Text>
              <Text style={styles.subtitle}>Start your cooking journey.</Text>
            </View>

            {registrationError ? (
              <AuthNotice message={registrationError} />
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
                    label="Email address"
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
                    placeholder="Create a password"
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
                    placeholder="Enter your password again"
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

            <Text style={styles.passwordHint}>
              Passwords must be 8-128 characters and match.
            </Text>

            <CustomButton
              title="Create account"
              onPress={() => {
                void handleSubmit(onSubmit)();
              }}
              loading={isLoading}
              loadingText="Creating your account..."
              disabled={isLoading}
              style={styles.submitButton}
            />

            <View style={styles.loginLink}>
              <Text style={styles.linkPrompt}>Already registered?</Text>
              <Pressable
                onPress={() => navigation.navigate('Login')}
                accessibilityRole="button"
                accessibilityLabel="Log in to CraveApp"
                style={styles.linkButton}
              >
                <Text style={styles.linkText}>Log in</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      <Modal
        visible={registrationStatus === 'succeeded'}
        transparent
        animationType={reduceMotion ? 'none' : 'fade'}
        statusBarTranslucent
        onRequestClose={() => undefined}
      >
        <View style={styles.successBackdrop} accessibilityViewIsModal>
          <Animated.View
            style={[
              styles.successCard,
              {
                opacity: successOpacity,
                transform: [{ scale: successScale }],
              },
            ]}
          >
            <View style={styles.successIcon}>
              <Feather
                name="check"
                size={36}
                color={
                  theme.mode === 'dark'
                    ? theme.colors.onPrimary
                    : theme.colors.white
                }
                accessible={false}
              />
            </View>
            <Text style={styles.successTitle} accessibilityRole="header">
              Account created!
            </Text>
            <Text style={styles.successDescription}>
              Welcome to CraveApp. Your cooking journey starts here.
            </Text>
            <Text
              style={styles.successNote}
              accessibilityLiveRegion={
                Platform.OS === 'android' ? 'polite' : undefined
              }
            >
              {registrationMessage ??
                'Your account is saved on this device. Use your username to sign in.'}
            </Text>
            <CustomButton
              title="Continue to login"
              onPress={continueToLogin}
              style={styles.successButton}
            />
          </Animated.View>
        </View>
      </Modal>
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
    content: {
      flexGrow: 1,
      alignItems: 'center',
      paddingBottom: theme.spacing.sm,
    },
    form: {
      width: '100%',
      maxWidth: 480,
      alignSelf: 'center',
      gap: theme.spacing.sm,
      paddingHorizontal: theme.spacing.lg,
      paddingTop: theme.spacing.sm,
      paddingBottom: theme.spacing.md,
    },
    backButton: {
      minHeight: 48,
      alignSelf: 'flex-start',
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
      paddingHorizontal: theme.spacing.sm,
      borderRadius: theme.radius.md,
    },
    backLabel: {
      color: theme.colors.darkBrown,
      fontSize: theme.typography.body,
      fontWeight: theme.typography.weight.medium,
    },
    pressed: {
      opacity: 0.72,
    },
    heading: {
      gap: theme.spacing.xxs,
      paddingBottom: theme.spacing.xs,
    },
    title: {
      color: theme.colors.darkBrown,
      fontSize: theme.typography.title,
      fontWeight: theme.typography.weight.bold,
      lineHeight: theme.typography.lineHeight.title,
    },
    subtitle: {
      color: theme.colors.chocolateBrown,
      fontSize: theme.typography.body,
      lineHeight: theme.typography.lineHeight.body,
    },
    fields: {
      gap: theme.spacing.sm,
    },
    passwordHint: {
      color: theme.colors.chocolateBrown,
      fontSize: theme.typography.caption,
      lineHeight: theme.typography.lineHeight.caption,
    },
    submitButton: {
      width: '100%',
      minHeight: 52,
      borderRadius: theme.radius.md,
      shadowOpacity: 0,
      shadowRadius: 0,
      elevation: 0,
    },
    successBackdrop: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: theme.spacing.lg,
      backgroundColor: theme.colors.overlay,
    },
    successCard: {
      width: '100%',
      maxWidth: 440,
      alignItems: 'center',
      gap: theme.spacing.md,
      padding: theme.spacing.xl,
      borderRadius: theme.radius.xl,
      backgroundColor: theme.colors.card,
    },
    successIcon: {
      width: 72,
      height: 72,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: theme.radius.pill,
      backgroundColor: theme.colors.success,
    },
    successTitle: {
      color: theme.colors.heading,
      fontSize: theme.typography.heading,
      fontWeight: theme.typography.weight.bold,
      lineHeight: theme.typography.lineHeight.heading,
      textAlign: 'center',
    },
    successDescription: {
      color: theme.colors.text,
      fontSize: theme.typography.body,
      lineHeight: theme.typography.lineHeight.body,
      textAlign: 'center',
    },
    successNote: {
      color: theme.colors.secondaryText,
      fontSize: theme.typography.caption,
      lineHeight: theme.typography.lineHeight.caption,
      textAlign: 'center',
    },
    successButton: {
      width: '100%',
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
      minHeight: 48,
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
}
