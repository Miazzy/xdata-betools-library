// https://eslint.org/docs/user-guide/configuring

module.exports = {
  root: true,
  parserOptions: {
    ecmaVersion: 6,
    sourceType: "module",
    ecmaFeatures: {
        jsx: true
    }
  },
  env: {
    amd: true,
    browser: true,
    node: true
  },
  plugins: [
    'import'
  ],
  extends: [
    'plugin:import/errors',
    'standard'
  ],
  rules: {
    'no-debugger': ['error'],
    'no-console': 'off',
  }
}
