// Store the small image itself, rather than a temporary gallery/cache URI.
const maximumPhotoLength = 2 * 1024 * 1024;
export function validateProfilePhoto(photo: string | null) {
  if (
    photo !== null &&
    (photo.length > maximumPhotoLength ||
      !/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(photo))
  ) {
    throw new Error('Please choose a smaller JPEG, PNG, or WebP photo.');
  }
}
