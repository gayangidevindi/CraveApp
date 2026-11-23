import { Feather } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet, Text, View } from 'react-native';

import type { RootStackParamList } from './types';
import { CustomButton } from '../shared/components/CustomButton';
import { theme } from '../shared/theme/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'DevelopmentEntry'>;

export function DevelopmentEntryScreen({ navigation }: Props) {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.container}>
        <Feather
          name="coffee"
          size={56}
          color={theme.colors.primary}
          accessible={false}
        />
        <Text style={styles.title}>CraveApp</Text>
        <Text style={styles.subtitle}>Offline-first food and recipes</Text>
        <View style={styles.actions}>
          <CustomButton
            title="Explore the app"
            icon="arrow-right"
            iconPosition="right"
            onPress={() =>
              navigation.navigate('Main', {
                screen: 'MainTabs',
                params: { screen: 'Home' },
              })
            }
          />
          <CustomButton
            title="Preview login screens"
            variant="outline"
            onPress={() =>
              navigation.navigate('Authentication', { screen: 'Login' })
            }
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.warmCream,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  title: {
    marginTop: theme.spacing.md,
    color: theme.colors.darkBrown,
    fontSize: theme.typography.title,
    fontWeight: theme.typography.weight.bold,
  },
  subtitle: {
    marginTop: theme.spacing.sm,
    color: theme.colors.chocolateBrown,
    fontSize: theme.typography.body,
    textAlign: 'center',
  },
  actions: {
    width: '100%',
    maxWidth: 360,
    gap: theme.spacing.md,
    marginTop: theme.spacing.xl,
  },
});
