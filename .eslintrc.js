module.exports = {
  root: true,
  extends: '@react-native',
  rules: {
    'react-native/no-inline-styles': 'off',
    'no-void': ['error', { allowAsStatement: true }],
    'react/no-unstable-nested-components': ['error', { allowAsProps: true }],
  },
};
