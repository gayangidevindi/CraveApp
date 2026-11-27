import { Feather } from '@expo/vector-icons';
import {
  useEffect,
  useState,
  type ComponentProps,
  type ReactNode,
} from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { MainTabScreenProps } from '../../../navigation/types';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { AuthNotice } from '../../auth/components/AuthNotice';
import { signOut, clearSignOutError } from '../../auth/state/authActions';
import { ProfilePhotoEditor } from '../components/ProfilePhotoEditor';
import { CustomButton } from '../../../shared/components/CustomButton';
import { ErrorState } from '../../../shared/components/ErrorState';
import { ConfirmationDialog } from '../../../shared/components/ConfirmationDialog';
import { LoadingState } from '../../../shared/components/LoadingState';
import { OfflineBanner } from '../../../shared/components/OfflineBanner';
import { useCraveThemeStyles } from '../../../shared/theme/useCraveTheme';
import {
  loadUserProfile,
} from '../state/profileSlice';
import { uniqueRecipesById } from '../../recipes/utils/normalizeRecipeData';
import { setThemeMode } from '../../../shared/theme/themeSlice';
import {
  createDefaultUserProfile,
} from '../types/profileTypes';
import appConfiguration from '../../../../app.json';

type Props = MainTabScreenProps<'Profile'>;
type ModalKind = 'about' | 'signOut' | null;

interface DetailRowProps {
  icon: ComponentProps<typeof Feather>['name'];
  label: string;
  value: string;
}

function DetailRow({ icon, label, value }: DetailRowProps) {
  const { theme, styles } = useCraveThemeStyles(createStyles);

  return (
    <View style={styles.detailRow}>
      <View style={styles.detailIcon}>
        <Feather
          name={icon}
          size={17}
          color={theme.colors.deepOrange}
          accessible={false}
        />
      </View>
      <View style={styles.detailCopy}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue}>{value}</Text>
      </View>
    </View>
  );
}

interface SettingsRowProps {
  icon: ComponentProps<typeof Feather>['name'];
  label: string;
  description: string;
  onPress: () => void;
  trailing?: ReactNode;
}

function SettingsRow({
  icon,
  label,
  description,
  onPress,
  trailing,
}: SettingsRowProps) {
  const { theme, styles } = useCraveThemeStyles(createStyles);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${label}. ${description}`}
      style={({ pressed }) => [
        styles.settingsRow,
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.settingsIcon}>
        <Feather
          name={icon}
          size={19}
          color={theme.colors.deepOrange}
          accessible={false}
        />
      </View>
      <View style={styles.settingsCopy}>
        <Text style={styles.settingsLabel}>{label}</Text>
        <Text style={styles.settingsDescription}>{description}</Text>
      </View>
      {trailing ?? (
        <Feather
          name="chevron-right"
          size={18}
          color={theme.colors.chocolateBrown}
          accessible={false}
        />
      )}
    </Pressable>
  );
}

interface StatCardProps {
  icon: ComponentProps<typeof Feather>['name'];
  label: string;
  value: string;
}

function StatCard({ icon, label, value }: StatCardProps) {
  const { theme, styles } = useCraveThemeStyles(createStyles);

  return (
    <View style={styles.statCard}>
      <View style={styles.statIcon}>
        <Feather
          name={icon}
          size={17}
          color={theme.colors.deepOrange}
          accessible={false}
        />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export function ProfileScreen({ navigation }: Props) {
  const { theme, styles } = useCraveThemeStyles(createStyles);
  const dispatch = useAppDispatch();
  const { width } = useWindowDimensions();
  const { user, isSigningOut, signOutError } = useAppSelector(
    (state) => state.auth,
  );
  const profileState = useAppSelector((state) => state.profile);
  const favouritesState = useAppSelector((state) => state.favourites);
  const isOffline = useAppSelector((state) => state.network.isOffline);
  const themePreference = useAppSelector((state) => state.theme);
  const isDarkMode = themePreference.mode === 'dark';
  const userId = user ? String(user.id) : null;
  const profile =
    userId !== null ? profileState.byUser[userId] : undefined;
  const loaded =
    userId !== null && profileState.loadedByUser[userId] === true;
  const loading =
    userId !== null && profileState.loadingByUser[userId] === true;
  const profileError =
    userId !== null ? profileState.errorByUser[userId] : null;
  const favouriteCount =
    userId !== null
      ? uniqueRecipesById(favouritesState.byUser[userId] ?? []).length
      : 0;
  const favouritesLoaded =
    userId !== null && favouritesState.loadedByUser[userId] === true;
  const favouriteError =
    userId !== null ? favouritesState.errorByUser[userId] : null;
  const authenticatedName =
    [user?.firstName, user?.lastName].filter(Boolean).join(' ') ||
    user?.username ||
    '';
  const displayName = profile?.fullName.trim() || authenticatedName;
  const [activeModal, setActiveModal] = useState<ModalKind>(null);

  useEffect(() => {
    if (userId !== null && !loaded && !loading) {
      void dispatch(loadUserProfile(userId));
    }
  }, [dispatch, loaded, loading, userId]);

  const onSignOut = async () => {
    dispatch(clearSignOutError());
    await dispatch(signOut());
    setActiveModal(null);
  };

  if (userId === null) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <ErrorState
          title="Profile unavailable"
          message="Sign in again to view your profile."
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
            title="Unable to load your profile"
            message="Please try again."
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

  const preferences = [
    ...(profile?.preferredCuisines ?? []),
    ...(profile?.dietaryPreferences ?? []),
  ];
  const skill = profile?.cookingSkill;
  const skillDescription =
    skill && skill !== 'Not specified' ? skill : 'Add your cooking level';
  const imageWidth = Math.min(width - theme.spacing.lg * 2, 560);
  const appVersion = appConfiguration.expo.version;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.content, { maxWidth: imageWidth }]}>
          {isOffline ? <OfflineBanner /> : null}
          <View style={styles.pageHeader}>
            <Text style={styles.eyebrow}>YOUR KITCHEN, YOUR WAY</Text>
            <Text style={styles.pageTitle}>Your profile</Text>
            <Text style={styles.pageSubtitle}>
              Keep your cooking preferences and account details up to date.
            </Text>
          </View>

          {profileError ? <AuthNotice message={profileError} /> : null}
          {signOutError ? (
            <AuthNotice message={signOutError} />
          ) : null}

          <View style={styles.profileCard}>
            <ProfilePhotoEditor
              userId={userId}
              profile={profile ?? createDefaultUserProfile(authenticatedName)}
              displayName={displayName}
              fallbackImageUri={user?.image}
              recoverPendingResult
            />
            <Text style={styles.name}>{displayName}</Text>
            <Text style={styles.username}>@{user?.username}</Text>
            <Text style={styles.email}>{user?.email}</Text>
            {profile?.bio ? (
              <Text style={styles.bio}>{profile.bio}</Text>
            ) : null}
            <CustomButton
              title="Edit profile"
              icon="edit-2"
              variant="secondary"
              onPress={() => navigation.navigate('EditProfile')}
              style={styles.editButton}
            />
          </View>

          <View style={styles.statsGrid}>
            <StatCard
              icon="heart"
              label="Saved recipes"
              value={favouritesLoaded ? String(favouriteCount) : '—'}
            />
            <StatCard
              icon="globe"
              label="Favourite cuisines"
              value={String(profile?.preferredCuisines.length ?? 0)}
            />
            <StatCard
              icon="check-circle"
              label="Dietary choices"
              value={String(profile?.dietaryPreferences.length ?? 0)}
            />
          </View>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Appearance</Text>
            <View style={styles.appearanceRow}>
              <View style={styles.settingsIcon}>
                <Feather
                  name="moon"
                  size={19}
                  color={theme.colors.deepOrange}
                  accessible={false}
                />
              </View>
              <View style={styles.settingsCopy}>
                <Text style={styles.settingsLabel}>Dark mode</Text>
                <Text style={styles.settingsDescription}>
                  Switch to a darker appearance.
                </Text>
              </View>
              <Pressable
                accessibilityLabel="Dark mode"
                accessibilityHint="Switch to a darker appearance."
                accessibilityRole="switch"
                aria-checked={isDarkMode}
                aria-disabled={themePreference.isSaving}
                accessibilityState={{
                  checked: isDarkMode,
                  disabled: themePreference.isSaving,
                }}
                disabled={themePreference.isSaving}
                onPress={() => {
                  void dispatch(
                    setThemeMode(isDarkMode ? 'light' : 'dark'),
                  );
                }}
                style={({ pressed }) => [
                  styles.themeSwitch,
                  pressed && styles.switchPressed,
                ]}
              >
                <View
                  style={[
                    styles.switchTrack,
                    isDarkMode && styles.switchTrackEnabled,
                  ]}
                >
                  <View
                    style={[
                      styles.switchThumb,
                      isDarkMode && styles.switchThumbEnabled,
                    ]}
                  />
                </View>
              </Pressable>
            </View>
            {themePreference.error ? (
              <AuthNotice message={themePreference.error} />
            ) : null}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Personal information</Text>
            <View style={styles.infoCard}>
              <DetailRow
                icon="phone"
                label="Phone"
                value={profile?.phoneNumber || 'Not added'}
              />
              <DetailRow
                icon="map-pin"
                label="City"
                value={profile?.city || 'Not added'}
              />
              <DetailRow
                icon="calendar"
                label="Date of birth"
                value={profile?.dateOfBirth || 'Not added'}
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Cooking preferences</Text>
            <SettingsRow
              icon="award"
              label="Cooking skill"
              description={skillDescription}
              onPress={() => navigation.navigate('EditProfile')}
            />
            <View style={styles.preferenceSummary}>
              <Text style={styles.preferenceTitle}>Your food preferences</Text>
              <Text style={styles.preferenceText}>
                {preferences.length > 0
                  ? preferences.join(' · ')
                  : 'Add cuisines and dietary preferences'}
              </Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your account</Text>
            <SettingsRow
              icon="heart"
              label="Favourite recipes"
              description={
                favouritesLoaded
                  ? `${favouriteCount} saved ${favouriteCount === 1 ? 'recipe' : 'recipes'}`
                  : 'Loading your favourites...'
              }
              onPress={() => navigation.navigate('Favourites')}
              trailing={
                favouritesLoaded ? (
                  <Text style={styles.favouriteCount}>{favouriteCount}</Text>
                ) : (
                  <ActivityIndicator
                    size="small"
                    color={theme.colors.deepOrange}
                  />
                )
              }
            />
            {favouriteError && !favouritesLoaded ? (
              <AuthNotice message={favouriteError} />
            ) : null}
            <SettingsRow
              icon="info"
              label="About CraveApp"
              description="A little more about your recipe companion"
              onPress={() => setActiveModal('about')}
            />
            <SettingsRow
              icon="log-out"
              label="Sign out"
              description="Sign out of this account"
              onPress={() => setActiveModal('signOut')}
            />
          </View>
        </View>
      </ScrollView>

      <Modal
        visible={activeModal === 'about'}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => {
          if (!isSigningOut) {
            setActiveModal(null);
          }
        }}
      >
        <View style={styles.modalBackdrop}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => {
              if (!isSigningOut) {
                setActiveModal(null);
              }
            }}
            accessibilityLabel="Close dialog"
            accessibilityRole="button"
          />
          <View style={styles.modalCard}>
            {activeModal === 'about' ? (
              <>
                <Text style={styles.modalTitle}>About CraveApp</Text>
                <Text style={styles.modalDescription}>
                  Discover recipes, save your favourites and make cooking feel
                  more inspiring.
                </Text>
                <Text style={styles.versionText}>Version {appVersion}</Text>
                <CustomButton
                  title="Done"
                  onPress={() => setActiveModal(null)}
                />
              </>
            ) : null}
          </View>
        </View>
      </Modal>
      <ConfirmationDialog
        visible={activeModal === 'signOut'}
        title="Sign out?"
        message="Are you sure you want to sign out of your account?"
        cancelLabel="Cancel"
        confirmLabel="Sign out"
        confirming={isSigningOut}
        confirmingLabel="Signing out..."
        onCancel={() => setActiveModal(null)}
        onConfirm={() => {
          void onSignOut();
        }}
      />
    </SafeAreaView>
  );
}

function createStyles(theme: import('../../../shared/theme/theme').CraveTheme) {
  return StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  content: {
    width: '100%',
    gap: theme.spacing.md,
  },
  pageTitle: {
    color: theme.colors.heading,
    fontSize: theme.typography.title,
    fontWeight: theme.typography.weight.bold,
  },
  pageHeader: {
    gap: theme.spacing.xs,
  },
  eyebrow: {
    color: theme.colors.deepOrange,
    fontSize: theme.typography.overline,
    fontWeight: theme.typography.weight.bold,
    letterSpacing: 0.9,
  },
  pageSubtitle: {
    color: theme.colors.secondaryText,
    fontSize: theme.typography.body,
    lineHeight: theme.typography.lineHeight.body,
  },
  profileCard: {
    width: '100%',
    alignItems: 'center',
    padding: theme.spacing.lg,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.card,
    ...theme.shadows.card,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  statCard: {
    minWidth: 96,
    flex: 1,
    alignItems: 'flex-start',
    gap: theme.spacing.xs,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.card,
  },
  statIcon: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.elevatedSurface,
  },
  statValue: {
    color: theme.colors.heading,
    fontSize: theme.typography.heading,
    fontWeight: theme.typography.weight.bold,
  },
  statLabel: {
    color: theme.colors.secondaryText,
    fontSize: theme.typography.overline,
    fontWeight: theme.typography.weight.medium,
  },
  name: {
    marginTop: theme.spacing.md,
    color: theme.colors.heading,
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
  bio: {
    marginTop: theme.spacing.md,
    color: theme.colors.darkBrown,
    fontSize: theme.typography.body,
    lineHeight: theme.typography.lineHeight.body,
    textAlign: 'center',
  },
  editButton: {
    width: '100%',
    marginTop: theme.spacing.lg,
  },
  section: {
    gap: theme.spacing.sm,
  },
  sectionTitle: {
    color: theme.colors.heading,
    fontSize: theme.typography.heading,
    fontWeight: theme.typography.weight.bold,
  },
  infoCard: {
    gap: theme.spacing.md,
    padding: theme.spacing.md,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.card,
    ...theme.shadows.card,
  },
  detailRow: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  detailIcon: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.elevatedSurface,
  },
  detailCopy: {
    flex: 1,
    gap: 2,
  },
  detailLabel: {
    color: theme.colors.chocolateBrown,
    fontSize: theme.typography.caption,
  },
  detailValue: {
    color: theme.colors.darkBrown,
    fontSize: theme.typography.body,
    fontWeight: theme.typography.weight.medium,
  },
  settingsRow: {
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    padding: theme.spacing.md,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.card,
  },
  appearanceRow: {
    minHeight: 76,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    padding: theme.spacing.md,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.card,
  },
  themeSwitch: {
    width: 56,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: theme.spacing.xs,
  },
  switchTrack: {
    width: 48,
    height: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    padding: 4,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.border,
  },
  switchTrackEnabled: {
    justifyContent: 'flex-end',
    backgroundColor: theme.colors.deepOrange,
  },
  switchThumb: {
    width: 20,
    height: 20,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.card,
    ...theme.shadows.card,
  },
  switchThumbEnabled: {
    backgroundColor: theme.colors.goldenYellow,
  },
  switchPressed: {
    opacity: 0.8,
  },
  settingsIcon: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.elevatedSurface,
  },
  settingsCopy: {
    flex: 1,
    gap: 2,
  },
  settingsLabel: {
    color: theme.colors.darkBrown,
    fontSize: theme.typography.body,
    fontWeight: theme.typography.weight.semibold,
  },
  settingsDescription: {
    color: theme.colors.chocolateBrown,
    fontSize: theme.typography.caption,
    lineHeight: theme.typography.lineHeight.caption,
  },
  favouriteCount: {
    minWidth: 32,
    color: theme.colors.deepOrange,
    fontSize: theme.typography.body,
    fontWeight: theme.typography.weight.bold,
    textAlign: 'center',
  },
  preferenceSummary: {
    gap: theme.spacing.xs,
    padding: theme.spacing.md,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.elevatedSurface,
  },
  preferenceTitle: {
    color: theme.colors.darkBrown,
    fontSize: theme.typography.label,
    fontWeight: theme.typography.weight.bold,
  },
  preferenceText: {
    color: theme.colors.chocolateBrown,
    fontSize: theme.typography.caption,
    lineHeight: theme.typography.lineHeight.caption,
  },
  pressed: {
    opacity: 0.75,
  },
  modalBackdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.overlay,
  },
  modalCard: {
    width: '100%',
    maxWidth: 440,
    gap: theme.spacing.md,
    padding: theme.spacing.lg,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.elevatedSurface,
    ...theme.shadows.floating,
  },
  modalTitle: {
    color: theme.colors.heading,
    fontSize: theme.typography.heading,
    fontWeight: theme.typography.weight.bold,
  },
  modalDescription: {
    color: theme.colors.chocolateBrown,
    fontSize: theme.typography.body,
    lineHeight: theme.typography.lineHeight.body,
  },
  versionText: {
    color: theme.colors.secondaryText,
    fontSize: theme.typography.caption,
  },
  });
}
