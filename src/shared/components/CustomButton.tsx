import type { ComponentProps } from 'react';
import { Feather } from '@expo/vector-icons';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  type PressableProps,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

import { theme } from '../theme/theme';

export type CustomButtonVariant = 'primary' | 'secondary' | 'outline';
type FeatherIconName = ComponentProps<typeof Feather>['name'];

export interface CustomButtonProps
  extends Omit<PressableProps, 'children' | 'style'> {
  title: string;
  variant?: CustomButtonVariant;
  loading?: boolean;
  icon?: FeatherIconName;
  iconPosition?: 'left' | 'right';
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export function CustomButton({
  title,
  variant = 'primary',
  loading = false,
  icon,
  iconPosition = 'left',
  disabled = false,
  accessibilityState,
  style,
  textStyle,
  ...pressableProps
}: CustomButtonProps) {
  const isDisabled = disabled || loading;
  const textColor = theme.colors.darkBrown;

  const buttonIcon = icon ? (
    <Feather
      name={icon}
      size={18}
      color={textColor}
      accessible={false}
    />
  ) : null;

  return (
    <Pressable
      {...pressableProps}
      accessibilityRole="button"
      accessibilityState={{
        ...accessibilityState,
        disabled: isDisabled,
        busy: loading,
      }}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.button,
        styles[variant],
        isDisabled && styles.disabled,
        pressed && !isDisabled && styles.pressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          color={theme.colors.darkBrown}
          accessible={false}
        />
      ) : (
        <>
          {iconPosition === 'left' ? buttonIcon : null}
          <Text
            style={[
              styles.text,
              isDisabled && styles.disabledText,
              textStyle,
            ]}
          >
            {title}
          </Text>
          {iconPosition === 'right' ? buttonIcon : null}
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderWidth: 1,
    borderRadius: theme.radius.md,
  },
  primary: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
    ...theme.shadows.button,
  },
  secondary: {
    backgroundColor: theme.colors.softYellow,
    borderColor: theme.colors.softYellow,
  },
  outline: {
    backgroundColor: theme.colors.white,
    borderColor: theme.colors.deepOrange,
  },
  disabled: {
    backgroundColor: theme.colors.softYellow,
    borderColor: theme.colors.softYellow,
    shadowOpacity: 0,
    elevation: 0,
  },
  pressed: {
    transform: [{ scale: 0.98 }],
  },
  text: {
    color: theme.colors.darkBrown,
    fontSize: theme.typography.body,
    fontWeight: theme.typography.weight.semibold,
    lineHeight: theme.typography.lineHeight.body,
    textAlign: 'center',
  },
  disabledText: {
    color: theme.colors.chocolateBrown,
  },
});
