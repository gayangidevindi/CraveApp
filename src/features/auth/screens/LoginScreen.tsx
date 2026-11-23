import { Feather } from '@expo/vector-icons';
import { zodResolver } from '@hookform/resolvers/zod';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Controller, useForm } from 'react-hook-form';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';

import type { AuthStackParamList } from '../../../navigation/types';
import { submitLogin, clearAuthError } from '../state/authActions';
import { loginSchema, type LoginFormData } from '../schemas/authSchemas';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { AuthNotice } from '../components/AuthNotice';
import { CustomButton } from '../../../shared/components/CustomButton';
import { CustomInput } from '../../../shared/components/CustomInput';
import { theme } from '../../../shared/theme/theme';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export function LoginScreen({ navigation }: Props) {
  const dispatch = useAppDispatch();
  const { status, error } = useAppSelector((state) => state.auth);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const isLoading = status === 'authenticating';
  const { control, handleSubmit } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  });

  const clearLoginError = () => {
    if (error) {
      dispatch(clearAuthError());
    }
  };

  const onSubmit = async (values: LoginFormData) => {
    await dispatch(submitLogin(values));
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
                  size={28}
                  color={theme.colors.darkBrown}
                  accessible={false}
                />
              </View>
              <Text style={styles.brandName}>CraveApp</Text>
              <Text style={styles.tagline}>Good food, made easy.</Text>
            </View>

            <View style={styles.heading}>
              <Text style={styles.title}>Welcome Back</Text>
              <Text style={styles.subtitle}>
                Sign in to pick up where your cravings left off.
              </Text>
            </View>

            {error ? <AuthNotice message={error} /> : null}

            <View style={styles.fields}>
              <Controller
                control={control}
                name="username"
                render={({ field, fieldState }) => (
                  <CustomInput
                    label="Username"
                    placeholder="Enter your username"
                    icon="user"
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="username"
                    textContentType="username"
                    returnKeyType="next"
                    value={field.value}
                    onBlur={field.onBlur}
                    onChangeText={(value) => {
                      field.onChange(value);
                      clearLoginError();
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
                    placeholder="Enter your password"
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
                    autoComplete="current-password"
                    textContentType="password"
                    secureTextEntry={!passwordVisible}
                    returnKeyType="done"
                    value={field.value}
                    onBlur={field.onBlur}
                    onChangeText={(value) => {
                      field.onChange(value);
                      clearLoginError();
                    }}
                    onSubmitEditing={() => {
                      void handleSubmit(onSubmit)();
                    }}
                    error={fieldState.error?.message}
                    editable={!isLoading}
                  />
                )}
              />
            </View>

            <CustomButton
              title="Log in"
              onPress={() => {
                void handleSubmit(onSubmit)();
              }}
              loading={isLoading}
              disabled={isLoading}
              style={styles.submitButton}
            />

            <Text style={styles.demoHint}>
              Demo: emilys / emilyspass. DummyJSON registrations are simulated
              and cannot be used to log in.
            </Text>

            <View style={styles.registrationLink}>
              <Text style={styles.linkPrompt}>New to CraveApp?</Text>
              <Pressable
                onPress={() => navigation.navigate('Register')}
                accessibilityRole="link"
                accessibilityLabel="Register for CraveApp"
                style={styles.linkButton}
              >
                <Text style={styles.linkText}>Create account</Text>
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
    gap: theme.spacing.lg,
  },
  brand: {
    alignItems: 'center',
  },
  logo: {
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.primary,
  },
  brandName: {
    marginTop: theme.spacing.sm,
    color: theme.colors.darkBrown,
    fontSize: theme.typography.heading,
    fontWeight: theme.typography.weight.bold,
  },
  tagline: {
    marginTop: theme.spacing.xs,
    color: theme.colors.chocolateBrown,
    fontSize: theme.typography.caption,
  },
  heading: {
    gap: theme.spacing.xs,
  },
  title: {
    color: theme.colors.darkBrown,
    fontSize: theme.typography.title,
    fontWeight: theme.typography.weight.bold,
  },
  subtitle: {
    color: theme.colors.chocolateBrown,
    fontSize: theme.typography.body,
    lineHeight: theme.typography.lineHeight.body,
  },
  fields: {
    gap: theme.spacing.md,
  },
  submitButton: {
    width: '100%',
  },
  demoHint: {
    color: theme.colors.chocolateBrown,
    fontSize: theme.typography.caption,
    lineHeight: theme.typography.lineHeight.caption,
    textAlign: 'center',
  },
  registrationLink: {
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
