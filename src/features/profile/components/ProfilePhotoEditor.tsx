import { Feather } from '@expo/vector-icons';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Linking,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { CustomButton } from '../../../shared/components/CustomButton';
import { AuthNotice } from '../../auth/components/AuthNotice';
import { useAppDispatch } from '../../../store/hooks';
import { useCraveThemeStyles } from '../../../shared/theme/useCraveTheme';
import { updateUserProfile } from '../state/profileSlice';
import {
  MAX_PROFILE_IMAGE_DATA_URI_LENGTH,
  type UserProfile,
} from '../types/profileTypes';

type PhotoSource = 'library' | 'camera';

interface ProfilePhotoEditorProps {
  userId: string;
  profile: UserProfile;
  displayName: string;
  fallbackImageUri?: string | null;
  recoverPendingResult?: boolean;
}

function getErrorMessage(error: unknown): string {
  const message =
    typeof error === 'string'
      ? error
      : error instanceof Error
        ? error.message
        : '';
  const knownMessages: Record<string, string> = {
    'Choose an image file for your profile picture.':
      'Choose an image file for your profile picture.',
    'The selected image has invalid dimensions.':
      'Choose a valid image for your profile picture.',
    'The selected image could not be prepared for saving.':
      'We could not prepare that picture. Please try another one.',
    'This picture is too large to store on this device. Choose a smaller image.':
      'This picture is too large. Please choose a smaller one.',
    'The image picker did not return a picture.':
      'We could not open that picture. Please try again.',
    'Camera access is needed to take a profile picture. Allow access in the permission prompt.':
      'Camera access is needed to take a profile picture. Allow access when prompted.',
    'Camera access is blocked. Open app settings and allow camera access to take a profile picture.':
      'Camera access is off. Open app settings to allow access.',
    'Photo access is needed to choose a profile picture. Allow access in the permission prompt.':
      'Photo access is needed to choose a profile picture. Allow access when prompted.',
    'Photo access is blocked. Open app settings and allow photo access to choose a profile picture.':
      'Photo access is off. Open app settings to allow access.',
  };

  return (
    knownMessages[message] ??
    'Unable to update your profile photo. Please try again.'
  );
}

export function ProfilePhotoEditor({
  userId,
  profile,
  displayName,
  fallbackImageUri = null,
  recoverPendingResult = false,
}: ProfilePhotoEditorProps) {
  const { theme, styles } = useCraveThemeStyles(createStyles);
  const dispatch = useAppDispatch();
  const avatarUri = profile.avatarDataUri ?? fallbackImageUri;
  const [failedAvatarUri, setFailedAvatarUri] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [photoNotice, setPhotoNotice] = useState<string | null>(null);
  const [isPickingPhoto, setIsPickingPhoto] = useState(false);
  const [activePhotoSource, setActivePhotoSource] =
    useState<PhotoSource | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [permissionSettingsRequired, setPermissionSettingsRequired] =
    useState(false);

  const saveAvatar = useCallback(
    async (avatarDataUri: string | null, successMessage: string) => {
      setIsSaving(true);
      try {
        await dispatch(
          updateUserProfile({
            userId,
            profile: { ...profile, avatarDataUri },
          }),
        ).unwrap();
        setPhotoNotice(successMessage);
        setPhotoError(null);
        setIsOpen(false);
      } finally {
        setIsSaving(false);
      }
    },
    [dispatch, profile, userId],
  );

  const savePickedAsset = useCallback(
    async (asset: ImagePicker.ImagePickerAsset) => {
      if (
        asset.type !== 'image' &&
        asset.mimeType?.startsWith('image/') !== true
      ) {
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

      await saveAvatar(avatarDataUri, 'Profile photo updated!');
    },
    [saveAvatar],
  );

  useEffect(() => {
    if (!recoverPendingResult || Platform.OS !== 'android') {
      return;
    }

    let active = true;
    void ImagePicker.getPendingResultAsync()
      .then(async (result) => {
        if (!active || result === null || 'code' in result || result.canceled) {
          if (active && result !== null && 'code' in result) {
            setPhotoError(getErrorMessage(result.message));
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
  }, [recoverPendingResult, savePickedAsset]);

  const pickPhoto = async (source: PhotoSource) => {
    setPhotoError(null);
    setPhotoNotice(null);
    setPermissionSettingsRequired(false);
    setActivePhotoSource(source);
    setIsPickingPhoto(true);

    try {
      if (Platform.OS !== 'web') {
        const permission =
          source === 'camera'
            ? await ImagePicker.requestCameraPermissionsAsync()
            : await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (!permission.granted) {
          setPermissionSettingsRequired(!permission.canAskAgain);
          throw new Error(
            source === 'camera'
              ? permission.canAskAgain
                ? 'Camera access is needed to take a profile picture. Allow access in the permission prompt.'
                : 'Camera access is blocked. Open app settings and allow camera access to take a profile picture.'
              : permission.canAskAgain
                ? 'Photo access is needed to choose a profile picture. Allow access in the permission prompt.'
                : 'Photo access is blocked. Open app settings and allow photo access to choose a profile picture.',
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
      setActivePhotoSource(null);
    }
  };

  const removePhoto = async () => {
    setPhotoError(null);
    setPhotoNotice(null);
    setIsPickingPhoto(true);

    try {
      await saveAvatar(null, 'Profile photo removed.');
    } catch (error) {
      setPhotoError(getErrorMessage(error));
    } finally {
      setIsPickingPhoto(false);
    }
  };

  return (
    <>
      <View style={styles.photoSection}>
        <Pressable
          onPress={() => {
            setPhotoError(null);
            setIsOpen(true);
          }}
          accessibilityRole="button"
          accessibilityLabel="Change profile picture"
          style={({ pressed }) => [
            styles.avatarButton,
            pressed && styles.pressed,
          ]}
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
                color={theme.colors.secondaryText}
                accessible={false}
              />
            )}
          </View>
          <View style={styles.cameraBadge}>
            {isPickingPhoto || isSaving ? (
              <ActivityIndicator
                size="small"
                color={theme.colors.onPrimary}
                accessible={false}
              />
            ) : (
              <Feather
                name="camera"
                size={15}
                color={theme.colors.onPrimary}
                accessible={false}
              />
            )}
          </View>
        </Pressable>
        <Text style={styles.photoHint}>Tap to update your picture</Text>
        {photoError ? <AuthNotice message={photoError} /> : null}
        {photoNotice ? (
          <AuthNotice message={photoNotice} tone="success" />
        ) : null}
      </View>

      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => {
          if (!isPickingPhoto && !isSaving) {
            setIsOpen(false);
          }
        }}
      >
        <View style={styles.modalBackdrop}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => {
              if (!isPickingPhoto && !isSaving) {
                setIsOpen(false);
              }
            }}
            accessibilityLabel="Close profile picture options"
            accessibilityRole="button"
          />
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Profile picture</Text>
            <Text style={styles.modalDescription}>
              Choose a photo or take a new picture. It will be saved on this
              device.
            </Text>
            {avatarUri && failedAvatarUri !== avatarUri ? (
              <Image
                source={{ uri: avatarUri }}
                accessibilityLabel="Profile picture preview"
                style={styles.photoPreview}
              />
            ) : null}
            {photoError ? <AuthNotice message={photoError} /> : null}
            {permissionSettingsRequired ? (
              <CustomButton
                title="Open app settings"
                icon="settings"
                variant="outline"
                onPress={() => {
                  void Linking.openSettings().catch((error: unknown) => {
                    setPhotoError(getErrorMessage(error));
                  });
                }}
              />
            ) : null}
            <CustomButton
              title="Choose from gallery"
              icon="image"
              variant="outline"
              loading={isPickingPhoto && activePhotoSource === 'library'}
              loadingText="Opening photos..."
              disabled={isSaving || isPickingPhoto}
              onPress={() => {
                void pickPhoto('library');
              }}
            />
            <CustomButton
              title="Take a photo"
              icon="camera"
              variant="outline"
              loading={isPickingPhoto && activePhotoSource === 'camera'}
              loadingText="Opening camera..."
              disabled={isSaving || isPickingPhoto}
              onPress={() => {
                void pickPhoto('camera');
              }}
            />
            {profile.avatarDataUri ? (
              <CustomButton
                title="Remove current picture"
                icon="trash-2"
                variant="outline"
                loading={isSaving}
                loadingText="Removing photo..."
                disabled={isSaving || isPickingPhoto}
                onPress={() => {
                  void removePhoto();
                }}
              />
            ) : null}
            <CustomButton
              title="Cancel"
              variant="secondary"
              disabled={isPickingPhoto || isSaving}
              onPress={() => setIsOpen(false)}
            />
          </View>
        </View>
      </Modal>
    </>
  );
}

function createStyles(theme: import('../../../shared/theme/theme').CraveTheme) {
  return StyleSheet.create({
    photoSection: {
      alignItems: 'center',
      gap: theme.spacing.xs,
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
      backgroundColor: theme.colors.elevatedSurface,
    },
    avatarImage: {
      width: '100%',
      height: '100%',
    },
    cameraBadge: {
      position: 'absolute',
      right: 2,
      bottom: 1,
      width: 38,
      height: 38,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: theme.colors.card,
      borderRadius: theme.radius.pill,
      backgroundColor: theme.colors.deepOrange,
    },
    photoHint: {
      color: theme.colors.secondaryText,
      fontSize: theme.typography.caption,
    },
    pressed: {
      opacity: 0.84,
      transform: [{ scale: 0.98 }],
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
      borderRadius: theme.radius.xl,
      backgroundColor: theme.colors.elevatedSurface,
      ...theme.shadows.floating,
    },
    modalTitle: {
      color: theme.colors.heading,
      fontSize: theme.typography.heading,
      fontWeight: theme.typography.weight.bold,
    },
    modalDescription: {
      color: theme.colors.secondaryText,
      fontSize: theme.typography.body,
      lineHeight: theme.typography.lineHeight.body,
    },
    photoPreview: {
      width: 112,
      height: 112,
      alignSelf: 'center',
      borderRadius: theme.radius.pill,
      backgroundColor: theme.colors.softYellow,
    },
  });
}
