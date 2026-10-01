import { launchImageLibrary } from 'react-native-image-picker';

import { validateProfilePhoto } from '../utils/profilePhoto';

export async function chooseProfilePhoto(): Promise<string | undefined> {
  const result = await launchImageLibrary({
    mediaType: 'photo',
    selectionLimit: 1,
    maxWidth: 512,
    maxHeight: 512,
    quality: 0.8,
    includeBase64: true,
    includeExtra: false,
    assetRepresentationMode: 'compatible',
  });
  if (result.didCancel) {
    return undefined;
  }
  if (result.errorCode === 'permission') {
    throw new Error('Please allow photo access in your device settings.');
  }
  if (result.errorCode) {
    throw new Error('Please try choosing your photo again.');
  }
  const asset = result.assets?.[0];
  if (!asset?.base64 || !asset.type) {
    throw new Error('Please choose a photo available on this device.');
  }
  const mime = asset.type === 'image/jpg' ? 'image/jpeg' : asset.type;
  const photo = `data:${mime};base64,${asset.base64}`;
  validateProfilePhoto(photo);
  return photo;
}
