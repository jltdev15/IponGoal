export const appConfig = {
  APP_NAME: 'PiggyPath',
  // Enable only after all four introductory games and Savings Flight pass QA.
  ENABLE_SAVINGS_FLIGHT: false as boolean,
  APP_VERSION: '1.0.0',
  SUBTITLE: 'Goal-Based Savings Tracker',
  DEFAULT_CURRENCY: 'PHP',
  CURRENCY_SYMBOL: '₱',
  DEFAULT_LOCALE: 'en-PH',
  ALLOW_DECIMAL_SAVINGS: true,
  DEFAULT_THEME: 'light',
} as const;
