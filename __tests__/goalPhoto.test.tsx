import React from 'react';
import { Image } from 'react-native';
import { act, create } from 'react-test-renderer';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { chooseGoalPhoto } from '../src/services/goalPhoto';
import { GoalPhoto } from '../src/components/GoalPhoto';
import { Icon } from '../src/components/Icon';
import { migrations } from '../src/database/migrations';
jest.mock('react-native-image-picker', () => ({
  launchCamera: jest.fn(),
  launchImageLibrary: jest.fn(),
}));
jest.mock('../src/components/Icon', () => ({ Icon: () => null }));
beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  jest.clearAllMocks();
});
test.each(['camera', 'gallery'] as const)(
  '%s stores resized image bytes instead of temporary URI',
  async source => {
    const method =
      source === 'camera'
        ? jest.mocked(launchCamera)
        : jest.mocked(launchImageLibrary);
    method.mockResolvedValue({
      assets: [
        {
          type: 'image/jpg',
          base64: 'aGVsbG8=',
          uri: 'file:///temporary/photo.jpg',
        },
      ],
    });
    expect(await chooseGoalPhoto(source)).toBe(
      'data:image/jpeg;base64,aGVsbG8=',
    );
    expect(method).toHaveBeenCalledWith(
      expect.objectContaining({
        maxWidth: 512,
        maxHeight: 512,
        quality: 0.8,
        selectionLimit: 1,
        includeBase64: true,
        includeExtra: false,
        mediaType: 'photo',
      }),
    );
    if (source === 'camera') {
      expect(method).toHaveBeenCalledWith(
        expect.objectContaining({ saveToPhotos: false, cameraType: 'back' }),
      );
    }
  },
);
test('cancel, camera-unavailable, permission, invalid image, and oversized image are handled', async () => {
  const camera = jest.mocked(launchCamera);
  camera.mockResolvedValue({ didCancel: true });
  expect(await chooseGoalPhoto('camera')).toBeUndefined();
  camera.mockResolvedValue({ errorCode: 'camera_unavailable' });
  await expect(chooseGoalPhoto('camera')).rejects.toThrow(
    'camera is not available',
  );
  camera.mockResolvedValue({ errorCode: 'permission' });
  await expect(chooseGoalPhoto('camera')).rejects.toThrow('Please allow');
  camera.mockResolvedValue({ assets: [{ uri: 'file:///missing.jpg' }] });
  await expect(chooseGoalPhoto('camera')).rejects.toThrow(
    'available on this device',
  );
  camera.mockResolvedValue({
    assets: [{ type: 'image/svg+xml', base64: 'aGVsbG8=' }],
  });
  await expect(chooseGoalPhoto('camera')).rejects.toThrow('smaller JPEG');
  camera.mockResolvedValue({
    assets: [{ type: 'image/png', base64: 'a'.repeat(2 * 1024 * 1024) }],
  });
  await expect(chooseGoalPhoto('camera')).rejects.toThrow('smaller JPEG');
});
test('photo display falls back to the category icon after decode failure and retries a replacement', async () => {
  let renderer!: ReturnType<typeof create>;
  await act(async () => {
    renderer = create(
      <GoalPhoto
        photo="data:image/png;base64,aGVsbG8="
        icon="book"
        name="Books"
        large
      />,
    );
  });
  expect(renderer.root.findByType(Image).props.accessibilityLabel).toBe(
    'Photo for Books',
  );
  await act(async () => renderer.root.findByType(Image).props.onError());
  expect(renderer.root.findAllByType(Image)).toHaveLength(0);
  expect(renderer.root.findByType(Icon).props.name).toBe('book');
  await act(async () =>
    renderer.update(
      <GoalPhoto
        photo="data:image/jpeg;base64,YWJjZA=="
        icon="book"
        name="Books"
      />,
    ),
  );
  expect(renderer.root.findByType(Image).props.source.uri).toContain(
    'image/jpeg',
  );
  await act(async () => renderer.unmount());
});
test('upgrade adds an empty goal photo while preserving existing account, balance, and deadline', () => {
  const { DatabaseSync } = require('node:sqlite');
  const db = new DatabaseSync(':memory:');
  try {
    db.exec(migrations[0]);
    db.exec(migrations[1]);
    db.prepare(
      'INSERT INTO users(id,fullName,username,passwordHash,createdAt,updatedAt) VALUES(?,?,?,?,?,?)',
    ).run('u', 'Existing', 'existing', 'hash', 'before', 'before');
    db.prepare(
      'INSERT INTO goals(id,userId,name,targetAmount,targetDate,category,icon,note,status,createdAt,updatedAt) VALUES(?,?,?,?,?,?,?,?,?,?,?)',
    ).run(
      'g',
      'u',
      'Books',
      10000,
      '2026-12-31',
      'Education',
      'book',
      '',
      'active',
      'before',
      'before',
    );
    db.prepare(
      'INSERT INTO savings(id,userId,goalId,amount,note,transactionDate,createdAt,updatedAt) VALUES(?,?,?,?,?,?,?,?)',
    ).run('s', 'u', 'g', 2500, '', '2026-10-06', 'before', 'before');
    db.exec(migrations[2]);
    expect(
      db.prepare('SELECT name,targetDate,coverPhoto FROM goals').get(),
    ).toMatchObject({
      name: 'Books',
      targetDate: '2026-12-31',
      coverPhoto: null,
    });
    expect(db.prepare('SELECT amount FROM savings').get().amount).toBe(2500);
    expect(
      db.prepare('SELECT username,passwordHash FROM users').get(),
    ).toMatchObject({ username: 'existing', passwordHash: 'hash' });
  } finally {
    db.close();
  }
});
