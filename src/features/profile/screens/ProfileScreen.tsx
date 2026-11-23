import { Feather } from '@expo/vector-icons';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AuthNotice } from '../../auth/components/AuthNotice';
import { signOut, clearSignOutError } from '../../auth/state/authActions';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { CustomButton } from '../../../shared/components/CustomButton';
import { theme } from '../../../shared/theme/theme';

export function ProfileScreen() {
  const dispatch = useAppDispatch();
  const { user, isSigningOut, signOutError } = useAppSelector(
    (state) => state.auth,
  );

  const onSignOut = async () => {
    await dispatch(signOut());
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Your profile</Text>
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Feather
              name="user"
              size={28}
              color={theme.colors.darkBrown}
              accessible={false}
            />
          </View>
          <Text style={styles.name}>
            {[user?.firstName, user?.lastName].filter(Boolean).join(' ') ||
              user?.username}
          </Text>
          <Text style={styles.username}>@{user?.username}</Text>
          <Text style={styles.email}>{user?.email}</Text>
        </View>
        {signOutError ? (
          <AuthNotice
            message={signOutError}
            tone="error"
          />
        ) : null}
        <CustomButton
          title="Log out"
          variant="outline"
          icon="log-out"
          loading={isSigningOut}
          disabled={isSigningOut}
          onPress={() => {
            dispatch(clearSignOutError());
            void onSignOut();
          }}
          style={styles.signOutButton}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.warmCream,
  },
  content: {
    flexGrow: 1,
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  title: {
    alignSelf: 'flex-start',
    color: theme.colors.darkBrown,
    fontSize: theme.typography.title,
    fontWeight: theme.typography.weight.bold,
  },
  profileCard: {
    width: '100%',
    maxWidth: 440,
    alignItems: 'center',
    marginTop: theme.spacing.xl,
    padding: theme.spacing.xl,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.white,
    ...theme.shadows.card,
  },
  avatar: {
    width: 72,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.softYellow,
  },
  name: {
    marginTop: theme.spacing.md,
    color: theme.colors.darkBrown,
    fontSize: theme.typography.heading,
    fontWeight: theme.typography.weight.bold,
    textAlign: 'center',
  },
  username: {
    marginTop: theme.spacing.xs,
    color: theme.colors.deepOrange,
    fontSize: theme.typography.body,
    fontWeight: theme.typography.weight.semibold,
  },
  email: {
    marginTop: theme.spacing.xs,
    color: theme.colors.chocolateBrown,
    fontSize: theme.typography.body,
    textAlign: 'center',
  },
  signOutButton: {
    width: '100%',
    maxWidth: 440,
    marginTop: theme.spacing.lg,
  },
});
