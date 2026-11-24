import type { ComponentProps } from 'react';
import { Feather } from '@expo/vector-icons';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

import { useCraveThemeStyles } from '../theme/useCraveTheme';

type FeatherIconName = ComponentProps<typeof Feather>['name'];

export interface CustomInputProps extends TextInputProps {
  label: string;
  error?: string;
  icon?: FeatherIconName;
  rightIcon?: FeatherIconName;
  rightIconAccessibilityLabel?: string;
  onRightIconPress?: () => void;
  containerStyle?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
}

export function CustomInput({
  label,
  error,
  icon,
  rightIcon,
  rightIconAccessibilityLabel,
  onRightIconPress,
  containerStyle,
  inputStyle,
  accessibilityLabel,
  accessibilityHint,
  editable = true,
  multiline = false,
  placeholderTextColor,
  ...textInputProps
}: CustomInputProps) {
  const { theme, styles } = useCraveThemeStyles(createStyles);

  return (
    <View style={[styles.field, containerStyle]}>
      <Text style={styles.label}>{label}</Text>
      <View
        style={[
          styles.inputContainer,
          multiline && styles.multilineContainer,
          error && styles.inputError,
          !editable && styles.inputDisabled,
        ]}
      >
        {icon ? (
          <Feather
            name={icon}
            size={18}
            color={theme.colors.secondaryText}
            accessible={false}
          />
        ) : null}
        <TextInput
          {...textInputProps}
          accessibilityLabel={accessibilityLabel ?? label}
          accessibilityHint={accessibilityHint ?? error}
          editable={editable}
          multiline={multiline}
          placeholderTextColor={
            placeholderTextColor ?? theme.colors.secondaryText
          }
          style={[
            styles.input,
            multiline && styles.multilineInput,
            inputStyle,
          ]}
        />
        {rightIcon ? (
          <Pressable
            onPress={onRightIconPress}
            disabled={!onRightIconPress}
            accessibilityRole={onRightIconPress ? 'button' : undefined}
            accessibilityLabel={rightIconAccessibilityLabel}
            hitSlop={4}
            style={styles.rightIconButton}
          >
            <Feather
              name={rightIcon}
              size={18}
              color={theme.colors.secondaryText}
              accessible={false}
            />
          </Pressable>
        ) : null}
      </View>
      {error ? (
        <View style={styles.errorRow}>
          <Feather
            name="alert-circle"
            size={14}
            color={theme.colors.deepOrange}
            accessible={false}
          />
          <Text style={styles.errorText} accessibilityRole="text">
            {error}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

function createStyles(theme: import('../theme/theme').CraveTheme) {
  return StyleSheet.create({
  field: {
    width: '100%',
    gap: theme.spacing.xs,
  },
  label: {
    color: theme.colors.heading,
    fontSize: theme.typography.label,
    fontWeight: theme.typography.weight.semibold,
    lineHeight: theme.typography.lineHeight.body,
  },
  inputContainer: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.card,
  },
  multilineContainer: {
    alignItems: 'flex-start',
    paddingVertical: theme.spacing.sm,
  },
  inputError: {
    borderColor: theme.colors.deepOrange,
    borderWidth: 2,
  },
  inputDisabled: {
    backgroundColor: theme.colors.warmCream,
  },
  rightIconButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    minHeight: 48,
    flex: 1,
    paddingVertical: 0,
    color: theme.colors.darkBrown,
    fontSize: theme.typography.body,
    lineHeight: theme.typography.lineHeight.body,
  },
  multilineInput: {
    minHeight: 96,
    paddingVertical: theme.spacing.xs,
    textAlignVertical: 'top',
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.xs,
  },
  errorText: {
    flex: 1,
    color: theme.colors.darkBrown,
    fontSize: theme.typography.caption,
    lineHeight: theme.typography.lineHeight.caption,
  },
  });
}
