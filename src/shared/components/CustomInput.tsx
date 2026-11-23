import type { ComponentProps } from 'react';
import { Feather } from '@expo/vector-icons';
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

import { theme } from '../theme/theme';

type FeatherIconName = ComponentProps<typeof Feather>['name'];

export interface CustomInputProps extends TextInputProps {
  label: string;
  error?: string;
  icon?: FeatherIconName;
  containerStyle?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
}

export function CustomInput({
  label,
  error,
  icon,
  containerStyle,
  inputStyle,
  accessibilityLabel,
  accessibilityHint,
  editable = true,
  multiline = false,
  placeholderTextColor = theme.colors.chocolateBrown,
  ...textInputProps
}: CustomInputProps) {
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
            color={theme.colors.chocolateBrown}
            accessible={false}
          />
        ) : null}
        <TextInput
          {...textInputProps}
          accessibilityLabel={accessibilityLabel ?? label}
          accessibilityHint={accessibilityHint ?? error}
          editable={editable}
          multiline={multiline}
          placeholderTextColor={placeholderTextColor}
          style={[
            styles.input,
            multiline && styles.multilineInput,
            inputStyle,
          ]}
        />
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

const styles = StyleSheet.create({
  field: {
    width: '100%',
    gap: theme.spacing.xs,
  },
  label: {
    color: theme.colors.darkBrown,
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
    borderColor: theme.colors.chocolateBrown,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.white,
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
