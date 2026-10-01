import { create } from 'zustand';
import { appConfig } from '../config/appConfig';
export const useSettingsStore = create(() => ({
  currency: appConfig.DEFAULT_CURRENCY,
}));
