import { execute, rows } from '../database';
export const getSetting = (key: string) =>
  rows<{ value: string }>('SELECT value FROM app_settings WHERE key=?', [
    key,
  ])[0]?.value;
export function setSetting(key: string, value: string) {
  execute(
    'INSERT INTO app_settings(key,value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value',
    [key, value],
  );
}
export const clearSession = () =>
  execute("DELETE FROM app_settings WHERE key='session'");
export function saveSession(userId: string, rememberMe: boolean) {
  if (rememberMe) {
    setSetting(
      'session',
      JSON.stringify({ currentUserId: userId, isLoggedIn: true, rememberMe }),
    );
  } else {
    clearSession();
  }
}
export function rememberedUserId(): string | undefined {
  try {
    const s = JSON.parse(getSetting('session') || '{}');
    return s.rememberMe === true &&
      s.isLoggedIn === true &&
      typeof s.currentUserId === 'string'
      ? s.currentUserId
      : undefined;
  } catch {
    clearSession();
    return undefined;
  }
}
