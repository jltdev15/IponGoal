import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { validateProfilePhoto as validateGoalPhoto } from '../utils/profilePhoto';

export async function chooseGoalPhoto(
  source: 'camera' | 'gallery',
): Promise<string | undefined> {
  const options = {
    mediaType: 'photo' as const,
    selectionLimit: 1,
    maxWidth: 512,
    maxHeight: 512,
    quality: 0.8 as const,
    includeBase64: true,
    includeExtra: false,
    assetRepresentationMode: 'compatible' as const,
  };
  const result =
    source === 'camera'
      ? await launchCamera({
          ...options,
          cameraType: 'back',
          saveToPhotos: false,
        })
      : await launchImageLibrary(options);
  if (result.didCancel) {
    return undefined;
  }
  if (result.errorCode === 'camera_unavailable') {
    throw new Error(
      'Please use the gallery. A camera is not available on this device.',
    );
  }
  if (result.errorCode === 'permission') {
    throw new Error(
      'Please allow camera or photo access in your device settings.',
    );
  }
  if (result.errorCode) {
    throw new Error('Please try selecting your goal photo again.');
  }
  const asset = result.assets?.[0];
  if (!asset?.base64 || !asset.type) {
    throw new Error('Please choose a photo available on this device.');
  }
  const mime = asset.type === 'image/jpg' ? 'image/jpeg' : asset.type;
  const photo = `data:${mime};base64,${asset.base64}`;
  validateGoalPhoto(photo);
  return photo;
}
