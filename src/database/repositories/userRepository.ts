import { execute, rows } from '../database';
import { User, StoredUser } from '../../types/models';
import { newId } from '../../utils/id';
import { hashPassword, verifyPassword } from '../../services/password';
import { validateProfilePhoto } from '../../utils/profilePhoto';
import { validateRegistration } from '../../utils/validation';
const publicColumns =
  'id, fullName, username, gradeLevel, profilePhoto, createdAt, updatedAt';
export const getUserById = (id: string) =>
  rows<User>(`SELECT ${publicColumns} FROM users WHERE id=?`, [id])[0];
export const hasAccounts = () =>
  rows<{ count: number }>('SELECT COUNT(*) AS count FROM users')[0].count > 0;
export const getUserByUsername = (username: string) =>
  rows<StoredUser>('SELECT * FROM users WHERE username=? COLLATE NOCASE', [
    username.trim().toLowerCase(),
  ])[0];
export async function createUser(
  fullName: string,
  username: string,
  password: string,
  confirm: string,
  gradeLevel: string,
) {
  validateRegistration(fullName, username, password, confirm);
  if (getUserByUsername(username)) {
    throw new Error('This username is already used on this device.');
  }
  const id = newId('user'),
    now = new Date().toISOString();
  const passwordHash = await hashPassword(password);
  execute(
    'INSERT INTO users (id,fullName,username,passwordHash,gradeLevel,createdAt,updatedAt) VALUES (?,?,?,?,?,?,?)',
    [
      id,
      fullName.trim(),
      username.trim().toLowerCase(),
      passwordHash,
      gradeLevel.trim(),
      now,
      now,
    ],
  );
  return getUserById(id);
}
export async function authenticateUser(username: string, password: string) {
  const record = getUserByUsername(username);
  // Use an equally expensive dummy derivation for unknown usernames.
  const dummy =
    'pbkdf2-sha256$210000$00000000000000000000000000000000$' + '0'.repeat(64);
  const valid = await verifyPassword(password, record?.passwordHash || dummy);
  if (!record || !valid) {
    throw new Error('Incorrect username or password.');
  }
  return getUserById(record.id);
}
export function updateProfile(
  userId: string,
  fullName: string,
  gradeLevel: string,
  profilePhoto?: string | null,
) {
  if (!fullName.trim()) {
    throw new Error('Please enter your full name.');
  }
  if (profilePhoto !== undefined) {
    validateProfilePhoto(profilePhoto);
  }
  const photo =
    profilePhoto === undefined
      ? getUserById(userId)?.profilePhoto ?? null
      : profilePhoto;
  execute(
    'UPDATE users SET fullName=?,gradeLevel=?,profilePhoto=?,updatedAt=? WHERE id=?',
    [
      fullName.trim(),
      gradeLevel.trim(),
      photo,
      new Date().toISOString(),
      userId,
    ],
  );
  return getUserById(userId);
}
