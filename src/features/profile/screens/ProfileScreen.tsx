import { Feather } from '@expo/vector-icons';
import {
  ImageManipulator,
  SaveFormat,
} from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import {
  useCallback,
  useEffect,
  useState,
  type ComponentProps,
  type ReactNode,
} from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Platform,
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
import { CustomButton } from '../../../shared/components/CustomButton';
import { ErrorState } from '../../../shared/components/ErrorState';
import { LoadingState } from '../../../shared/components/LoadingState';
import { OfflineBanner } from '../../../shared/components/OfflineBanner';
import { theme } from '../../../shared/theme/theme';
import {
  updateUserProfile,
  loadUserProfile,
} from '../state/profileSlice';
import {
  createDefaultUserProfile,
  MAX_PROFILE_IMAGE_DATA_URI_LENGTH,
} from '../types/profileTypes';

type Props = MainTabScreenProps<'Profile'>;
type ModalKind = 'photo' | 'about' | 'logout' | null;
type PhotoSource = 'library' | 'camera';

function getErrorMessage(error: unknown): string {
  if (typeof error === 'string') {
    return error;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return 'The profile picture could not be saved. Please try again.';
}

interface DetailRowProps {
  icon: ComponentProps<typeof Feather>['name'];
  label: string;
  value: string;
}

function DetailRow({ icon, label, value }: DetailRowProps) {
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

export function ProfileScreen({ navigation }: Props) {
  const dispatch = useAppDispatch();
  const { width } = useWindowDimensions();
  const { user, isSigningOut, signOutError } = useAppSelector(
    (state) => state.auth,
  );
  const profileState = useAppSelector((state) => state.profile);
  const favouritesState = useAppSelector((state) => state.favourites);
  const isOffline = useAppSelector((state) => state.network.isOffline);
  const userId = user ? String(user.id) : null;
  const profile =
    userId !== null ? profileState.byUser[userId] : undefined;
  const loaded =
    userId !== null && profileState.loadedByUser[userId] === true;
  const loading =
    userId !== null && profileState.loadingByUser[userId] === true;
  const saving =
    userId !== null && profileState.savingByUser[userId] === true;
  const profileError =
    userId !== null ? profileState.errorByUser[userId] : null;
  const favouriteCount =
    userId !== null
      ? (favouritesState.byUser[userId]?.length ?? 0)
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
  const avatarUri = profile?.avatarDataUri ?? user?.image ?? null;
  const [failedAvatarUri, setFailedAvatarUri] = useState<string | null>(null);
  const [activeModal, setActiveModal] = useState<ModalKind>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [photoNotice, setPhotoNotice] = useState<string | null>(null);
  const [isPickingPhoto, setIsPickingPhoto] = useState(false);

  useEffect(() => {
    if (userId !== null && !loaded && !loading) {
      void dispatch(loadUserProfile(userId));
    }
  }, [dispatch, loaded, loading, userId]);

  const saveAvatar = useCallback(
    async (avatarDataUri: string | null, successMessage: string) => {
      if (userId === null || !loaded) {
        throw new Error('Your profile is still loading. Please try again.');
      }

      const currentProfile =
        profile ?? createDefaultUserProfile(authenticatedName);

      await dispatch(
        updateUserProfile({
          userId,
          profile: { ...currentProfile, avatarDataUri },
        }),
      ).unwrap();

      setPhotoNotice(successMessage);
      setPhotoError(null);
      setActiveModal(null);
    },
    [authenticatedName, dispatch, loaded, profile, userId],
  );

  const savePickedAsset = useCallback(
    async (asset: ImagePicker.ImagePickerAsset) => {
      if (asset.type !== 'image' && asset.mimeType?.startsWith('image/') !== true) {
        throw new Error('Choose an image file for your profile picture.');
      }

      if (asset.width <= 0 || asset.height <= 0) {
        throw new Error('The selected image has invalid dimensions.');
      }

      const scale = Math.min(
        1,
        512 / Math.max(asset.width, asset.height),
      );
      const width = Math.max(1, Math.round(asset.width * scale));
      const height = Math.max(1, Math.round(asset.height * scale));
      const context = ImageManipulator.manipulate(asset.uri);
      context.resize({ width, height });
      const renderedImage = await context.renderAsync();
      const savedImage = await renderedImage.saveAsync({
        format: SaveFormat.JPEG,
        compress: 0.72,
        base64: true,
      });

      if (!savedImage.base64) {
        throw new Error('The selected image could not be prepared for saving.');
      }

      const avatarDataUri = `data:image/jpeg;base64,${savedImage.base64}`;
      if (avatarDataUri.length > MAX_PROFILE_IMAGE_DATA_URI_LENGTH) {
        throw new Error(
          'This picture is too large to store on this device. Choose a smaller image.',
        );
      }

      await saveAvatar(avatarDataUri, 'Profile picture updated.');
    },
    [saveAvatar],
  );

  useEffect(() => {
    if (Platform.OS !== 'android' || userId === null || !loaded) {
      return;
    }

    let active = true;

    void ImagePicker.getPendingResultAsync()
      .then(async (result) => {
        if (!active || result === null || 'code' in result || result.canceled) {
          if (active && result !== null && 'code' in result) {
            setPhotoError(result.message);
          }
          return;
        }

        const asset = result.assets[0];
        if (!asset) {
          return;
        }

        try {
          await savePickedAsset(asset);
        } catch (error) {
          if (active) {
            setPhotoError(getErrorMessage(error));
          }
        }
      })
      .catch((error: unknown) => {
        if (active) {
          setPhotoError(getErrorMessage(error));
        }
      });

    return () => {
      active = false;
    };
  }, [loaded, savePickedAsset, userId]);

  const pickPhoto = async (source: PhotoSource) => {
    setPhotoError(null);
    setPhotoNotice(null);
    setIsPickingPhoto(true);

    try {
      if (Platform.OS !== 'web') {
        const permission =
          source === 'camera'
            ? await ImagePicker.requestCameraPermissionsAsync()
            : await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (!permission.granted) {
          throw new Error(
            source === 'camera'
              ? 'Allow camera access to take a profile picture.'
              : 'Allow photo access to choose a profile picture.',
          );
        }
      }

      const result =
        source === 'camera'
          ? await ImagePicker.launchCameraAsync({
              mediaTypes: ['images'],
              allowsEditing: true,
              aspect: [1, 1],
            })
          : await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ['images'],
              allowsEditing: true,
              aspect: [1, 1],
            });

      if (result.canceled) {
        return;
      }

      const asset = result.assets[0];
      if (!asset) {
        throw new Error('The image picker did not return a picture.');
      }

      await savePickedAsset(asset);
    } catch (error) {
      setPhotoError(getErrorMessage(error));
    } finally {
      setIsPickingPhoto(false);
    }
  };

  const removePhoto = async () => {
    setPhotoError(null);
    setPhotoNotice(null);
    setIsPickingPhoto(true);

    try {
      await saveAvatar(null, 'Profile picture removed.');
    } catch (error) {
      setPhotoError(getErrorMessage(error));
    } finally {
      setIsPickingPhoto(false);
    }
  };

  const onSignOut = async () => {
    setActiveModal(null);
    dispatch(clearSignOutError());
    await dispatch(signOut());
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
            title="Profile could not load"
            message={profileError}
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

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.content, { maxWidth: imageWidth }]}>
          {isOffline ? <OfflineBanner /> : null}
          <Text style={styles.pageTitle}>Your profile</Text>

          {profileError && photoError === null ? (
            <AuthNotice message={profileError} />
          ) : null}
          {photoError && activeModal !== 'photo' ? (
            <AuthNotice message={photoError} />
          ) : null}
          {photoNotice ? (
            <AuthNotice message={photoNotice} tone="success" />
          ) : null}
          {signOutError ? (
            <AuthNotice message={signOutError} />
          ) : null}

          <View style={styles.profileCard}>
            <Pressable
              onPress={() => {
                setPhotoError(null);
                setActiveModal('photo');
              }}
              accessibilityRole="button"
              accessibilityLabel="Change profile picture"
              style={styles.avatarButton}
            >
              <View style={styles.avatar}>
                {avatarUri && failedAvatarUri !== avatarUri ? (
                  <Image
                    source={{ uri: avatarUri }}
                    onError={() => setFailedAvatarUri(avatarUri)}
                    style={styles.avatarImage}
                    accessibilityLabel={`${displayName}'s profile picture`}
                  />
                ) : (
                  <Feather
                    name="user"
                    size={42}
                    color={theme.colors.darkBrown}
                    accessible={false}
                  />
                )}
              </View>
              <View style={styles.cameraBadge}>
                {saving || isPickingPhoto ? (
                  <ActivityIndicator
                    size="small"
                    color={theme.colors.white}
                    accessible={false}
                  />
                ) : (
                  <Feather
                    name="camera"
                    size={15}
                    color={theme.colors.white}
                    accessible={false}
                  />
                )}
              </View>
            </Pressable>
            <Text style={styles.photoHint}>Tap to edit your picture</Text>
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

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About you</Text>
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
            <Text style={styles.sectionTitle}>Your CraveApp</Text>
            <SettingsRow
              icon="heart"
              label="Favourite recipes"
              description={
                favouritesLoaded
                  ? `${favouriteCount} saved ${favouriteCount === 1 ? 'recipe' : 'recipes'}`
                  : 'Loading saved recipes'
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
            {favouriteError ? (
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
              label="Log out"
              description="Sign out of this account"
              onPress={() => setActiveModal('logout')}
            />
          </View>
        </View>
      </ScrollView>

      <Modal
        visible={activeModal !== null}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => {
          if (!isPickingPhoto && !isSigningOut) {
            setActiveModal(null);
          }
        }}
      >
        <View style={styles.modalBackdrop}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => {
              if (!isPickingPhoto && !isSigningOut) {
                setActiveModal(null);
              }
            }}
            accessibilityLabel="Close dialog"
            accessibilityRole="button"
          />
          <View style={styles.modalCard}>
            {activeModal === 'photo' ? (
              <>
                <Text style={styles.modalTitle}>Profile picture</Text>
                <Text style={styles.modalDescription}>
                  Choose a photo or take a new picture. It will be saved on
                  this device.
                </Text>
                {photoError ? <AuthNotice message={photoError} /> : null}
                <CustomButton
                  title="Choose from gallery"
                  icon="image"
                  variant="outline"
                  loading={isPickingPhoto}
                  disabled={saving || isPickingPhoto}
                  onPress={() => {
                    void pickPhoto('library');
                  }}
                />
                <CustomButton
                  title="Take a photo"
                  icon="camera"
                  variant="outline"
                  disabled={saving || isPickingPhoto}
                  onPress={() => {
                    void pickPhoto('camera');
                  }}
                />
                {profile?.avatarDataUri ? (
                  <CustomButton
                    title="Remove current picture"
                    icon="trash-2"
                    variant="outline"
                    loading={saving}
                    disabled={saving || isPickingPhoto}
                    onPress={() => {
                      void removePhoto();
                    }}
                  />
                ) : null}
                <CustomButton
                  title="Cancel"
                  variant="secondary"
                  disabled={isPickingPhoto}
                  onPress={() => setActiveModal(null)}
                />
              </>
            ) : activeModal === 'about' ? (
              <>
                <Text style={styles.modalTitle}>About CraveApp</Text>
                <Text style={styles.modalDescription}>
                  CraveApp helps you discover recipes, save your favourites,
                  and keep your cooking preferences close at hand.
                </Text>
                <Text style={styles.modalDescription}>
                  Your profile details and picture are stored on this device
                  and kept separate for each signed-in account.
                </Text>
                <CustomButton
                  title="Done"
                  onPress={() => setActiveModal(null)}
                />
              </>
            ) : (
              <>
                <Text style={styles.modalTitle}>Log out?</Text>
                <Text style={styles.modalDescription}>
                  You can sign back in to access your profile and saved
                  recipes.
                </Text>
                <CustomButton
                  title="Log out"
                  icon="log-out"
                  loading={isSigningOut}
                  disabled={isSigningOut}
                  onPress={() => {
                    void onSignOut();
                  }}
                />
                <CustomButton
                  title="Stay signed in"
                  variant="outline"
                  disabled={isSigningOut}
                  onPress={() => setActiveModal(null)}
                />
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.warmCream,
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
    color: theme.colors.darkBrown,
    fontSize: theme.typography.title,
    fontWeight: theme.typography.weight.bold,
  },
  profileCard: {
    width: '100%',
    alignItems: 'center',
    padding: theme.spacing.lg,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.white,
    ...theme.shadows.card,
  },
  avatarButton: {
    position: 'relative',
    width: 112,
    height: 112,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: 104,
    height: 104,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: theme.colors.primary,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.softYellow,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  cameraBadge: {
    position: 'absolute',
    right: 2,
    bottom: 1,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: theme.colors.white,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.deepOrange,
  },
  photoHint: {
    marginTop: theme.spacing.xs,
    color: theme.colors.chocolateBrown,
    fontSize: theme.typography.caption,
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
    color: theme.colors.darkBrown,
    fontSize: theme.typography.heading,
    fontWeight: theme.typography.weight.bold,
  },
  infoCard: {
    gap: theme.spacing.md,
    padding: theme.spacing.md,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.white,
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
    backgroundColor: theme.colors.softYellow,
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
    backgroundColor: theme.colors.white,
  },
  settingsIcon: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.softYellow,
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
    backgroundColor: theme.colors.softYellow,
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
    backgroundColor: 'rgba(41, 37, 36, 0.52)',
  },
  modalCard: {
    width: '100%',
    maxWidth: 440,
    gap: theme.spacing.md,
    padding: theme.spacing.lg,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.warmCream,
    ...theme.shadows.floating,
  },
  modalTitle: {
    color: theme.colors.darkBrown,
    fontSize: theme.typography.heading,
    fontWeight: theme.typography.weight.bold,
  },
  modalDescription: {
    color: theme.colors.chocolateBrown,
    fontSize: theme.typography.body,
    lineHeight: theme.typography.lineHeight.body,
  },
});
