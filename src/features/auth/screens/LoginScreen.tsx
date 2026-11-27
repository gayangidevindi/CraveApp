import { Feather } from '@expo/vector-icons';
import { zodResolver } from '@hookform/resolvers/zod';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Controller, useForm } from 'react-hook-form';
import {
  KeyboardAvoidingView,
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
import { AuthNotice } from '../components/AuthNotice';
import { AuthPhotoHeader } from '../components/AuthPhotoHeader';
import { loginSchema, type LoginFormData } from '../schemas/authSchemas';
import { clearAuthError, submitLogin } from '../state/authActions';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { CustomButton } from '../../../shared/components/CustomButton';
import { CustomInput } from '../../../shared/components/CustomInput';
import { useCraveThemeStyles } from '../../../shared/theme/useCraveTheme';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export function LoginScreen({ navigation, route }: Props) {
  const { theme, styles } = useCraveThemeStyles(createStyles);
  const dispatch = useAppDispatch();
  const { status, error } = useAppSelector((state) => state.auth);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const isLoading = status === 'authenticating';
  const { control, handleSubmit, setValue } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  });
  const username = route.params?.username;

  useEffect(() => {
    if (!username) {
      return;
    }

    setValue('username', username);
    navigation.setParams({ username: undefined });
  }, [navigation, setValue, username]);

  const clearLoginError = () => {
    if (error) {
      dispatch(clearAuthError());
    }
  };

  const onSubmit = async (values: LoginFormData) => {
    await dispatch(submitLogin(values));
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
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
            source={require('../../../../assets/auth/login-food.jpg')}
            accessibilityLabel="Overhead photograph of a colourful fresh vegetable salad"
          />

          <View style={styles.form}>
            <View style={styles.brandRow}>
              <View style={styles.brandMark}>
                <Feather
                  name="coffee"
                  size={18}
                  color={theme.colors.onPrimary}
                  accessible={false}
                />
              </View>
              <View style={styles.brandCopy}>
                <Text style={styles.brandName}>CraveApp</Text>
                <Text style={styles.tagline}>Discover. Cook. Enjoy.</Text>
              </View>
            </View>

            <View style={styles.heading}>
              <Text style={styles.title}>Welcome back!</Text>
              <Text style={styles.subtitle}>Something delicious awaits.</Text>
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
              loadingText="Signing in..."
              disabled={isLoading}
              style={styles.submitButton}
            />

            <View style={styles.registrationLink}>
              <Text style={styles.linkPrompt}>New here?</Text>
              <Pressable
                onPress={() => navigation.navigate('Register')}
                accessibilityRole="button"
                accessibilityLabel="Sign up for CraveApp"
                style={styles.linkButton}
              >
                <Text style={styles.linkText}>Sign up</Text>
              </Pressable>
            </View>
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
    content: {
      flexGrow: 1,
      alignItems: 'center',
      paddingBottom: theme.spacing.sm,
    },
    form: {
      width: '100%',
      maxWidth: 480,
      alignSelf: 'center',
      gap: theme.spacing.md,
      paddingHorizontal: theme.spacing.lg,
      paddingTop: theme.spacing.md,
    },
    brandRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
    },
    brandMark: {
      width: 36,
      height: 36,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: theme.radius.md,
      backgroundColor: theme.colors.primary,
    },
    brandCopy: {
      gap: theme.spacing.xxs,
    },
    brandName: {
      color: theme.colors.darkBrown,
      fontSize: theme.typography.subtitle,
      fontWeight: theme.typography.weight.bold,
      lineHeight: theme.typography.lineHeight.body,
    },
    tagline: {
      color: theme.colors.chocolateBrown,
      fontSize: theme.typography.caption,
      lineHeight: theme.typography.lineHeight.caption,
    },
    heading: {
      gap: theme.spacing.xxs,
      paddingTop: theme.spacing.xs,
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
    submitButton: {
      width: '100%',
      minHeight: 52,
      borderRadius: theme.radius.md,
      shadowOpacity: 0,
      shadowRadius: 0,
      elevation: 0,
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
