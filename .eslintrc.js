module.exports = {
  root: true,
  ignorePatterns: ['android/**/build/**', 'ios/build/**'],
  extends: '@react-native',
  rules: {
    'react-native/no-inline-styles': 'off',
    'no-void': ['error', { allowAsStatement: true }],
    'react/no-unstable-nested-components': ['error', { allowAsProps: true }],
  },
};
