export const appConfig = {
  APP_NAME: 'PiggyPath',
  // Enabled after the user confirmed prerequisite and flight acceptance QA.
  ENABLE_SAVINGS_FLIGHT: true as boolean,
  APP_VERSION: '1.0.0',
  SUBTITLE: 'Goal-Based Savings Tracker',
  DEFAULT_CURRENCY: 'PHP',
  CURRENCY_SYMBOL: '₱',
  DEFAULT_LOCALE: 'en-PH',
  ALLOW_DECIMAL_SAVINGS: true,
  DEFAULT_THEME: 'light',
} as const;
