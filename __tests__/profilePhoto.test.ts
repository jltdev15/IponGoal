jest.mock('react-native-image-picker', () => ({
  launchImageLibrary: jest.fn(),
}));
import { launchImageLibrary } from 'react-native-image-picker';
import { chooseProfilePhoto } from '../src/services/profilePhoto';
import { validateProfilePhoto } from '../src/utils/profilePhoto';
import { migrations } from '../src/database/migrations';
const picker = launchImageLibrary as jest.Mock;

beforeEach(() => picker.mockReset());
test('copies the image bytes instead of persisting the temporary picker URI', async () => {
  picker.mockResolvedValue({
    assets: [
      {
        type: 'image/jpeg',
        base64: 'aGVsbG8=',
        uri: 'file:///cache/photo.jpg',
      },
    ],
  });
  expect(await chooseProfilePhoto()).toBe('data:image/jpeg;base64,aGVsbG8=');
  expect(picker).toHaveBeenCalledWith(
    expect.objectContaining({
      includeBase64: true,
      maxWidth: 512,
      maxHeight: 512,
      selectionLimit: 1,
      mediaType: 'photo',
    }),
  );
});
test('cancelling leaves the current photo unchanged', async () => {
  picker.mockResolvedValue({ didCancel: true });
  expect(await chooseProfilePhoto()).toBeUndefined();
});
test('picker errors and unavailable images give useful messages', async () => {
  picker.mockResolvedValue({ errorCode: 'permission' });
  await expect(chooseProfilePhoto()).rejects.toThrow(
    'Please allow photo access',
  );
  picker.mockResolvedValue({ assets: [{ uri: 'file:///cache/photo.jpg' }] });
  await expect(chooseProfilePhoto()).rejects.toThrow(
    'available on this device',
  );
});
test('rejects remote URLs, unsupported formats and excessively large photos', () => {
  expect(() => validateProfilePhoto(null)).not.toThrow();
  for (const photo of [
    'https://example.com/photo.png',
    'data:image/svg+xml;base64,aGVsbG8=',
    'data:image/png;base64,' + 'a'.repeat(2 * 1024 * 1024),
  ]) {
    expect(() => validateProfilePhoto(photo)).toThrow('Please choose');
  }
});
test('upgrading the existing database preserves accounts and adds an empty photo', () => {
  const { DatabaseSync } = require('node:sqlite');
  const db = new DatabaseSync(':memory:');
  try {
    db.exec(migrations[0]);
    db.prepare(
      'INSERT INTO users (id,fullName,username,passwordHash,createdAt,updatedAt) VALUES (?,?,?,?,?,?)',
    ).run(
      'existing',
      'Existing User',
      'existing',
      'unchanged-hash',
      'before',
      'before',
    );
    db.exec(migrations[1]);
    expect(
      db.prepare('SELECT username,passwordHash,profilePhoto FROM users').get(),
    ).toMatchObject({
      username: 'existing',
      passwordHash: 'unchanged-hash',
      profilePhoto: null,
    });
  } finally {
    db.close();
  }
});
