
// https://docs.expo.dev/guides/using-eslint/
module.exports = {
  extends: [
    'expo',
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react/jsx-runtime'
  ],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'react', 'import'],
  root: true,
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true
    },
    project: null // Disable type-aware linting to avoid project config issues
  },
  ignorePatterns: [
    // Build outputs
    '/dist/*',
    '/public/*',
    '/_expo/*',
    '/.expo/*',
    '/web-build/*',
    '/build/*',
    '/android/*',
    '/ios/*',
    
    // Babel plugins
    '/babel-plugins/*',
    
    // Config files
    '*.config.js',
    '**/*.config.js',
    'workbox-config.js',
    
    // Scripts
    'scripts/*',
    '**/scripts/*',
    
    // Documentation
    '*.md',
    '**/*.md',
    
    // Cache
    '.eslintcache',
    '*.cache',
    '.cache/*',
    
    // Dependencies
    'node_modules/',
    '**/node_modules/',
    
    // Assets
    'assets/*',
    '**/assets/*',
    
    // Generated files
    '*.bundle.js',
    '*.bundle.js.map',
    '*.generated.ts',
    '*.generated.tsx',
    
    // Other
    'chat_history.json',
    '.natively/*'
  ],
  env: {
    browser: true,
    node: true,
    es6: true,
    'react-native/react-native': true
  },
  settings: {
    react: {
      version: 'detect'
    }
  },
  rules: {
    // TypeScript rules
    "@typescript-eslint/no-unused-vars": "off",
    "@typescript-eslint/no-explicit-any": "off",
    "@typescript-eslint/prefer-as-const": "off",
    "@typescript-eslint/no-var-requires": "off",
    "@typescript-eslint/no-empty-object-type": "off",
    "@typescript-eslint/no-wrapper-object-types": "off",
    "@typescript-eslint/ban-tslint-comment": "off",
    "@typescript-eslint/no-empty-function": "off",
    "@typescript-eslint/ban-ts-comment": "off",
    "@typescript-eslint/no-namespace": "off",
    
    // React rules
    "react/react-in-jsx-scope": "off",
    "react/no-unescaped-entities": "off",
    "react/prop-types": "off",
    "react/display-name": "off",
    
    // Import rules
    "import/no-unresolved": "off",
    
    // General rules
    "prefer-const": "off",
    "no-case-declarations": "off",
    "no-empty": "off",
    "no-var": "off",
    "no-undef": "off",
    "no-unused-vars": "off",
    "no-prototype-builtins": "off",
    "no-useless-escape": "off"
  },
  overrides: [
    {
      files: ['metro.config.js', 'babel.config.js', 'workbox-config.js', '*.config.js'],
      env: {
        node: true
      },
      rules: {
        '@typescript-eslint/no-var-requires': 'off',
        '@typescript-eslint/no-require-imports': 'off'
      }
    },
    {
      files: ['babel-plugins/**/*'],
      rules: {
        '@typescript-eslint/no-var-requires': 'off',
        'no-undef': 'off'
      }
    }
  ]
};
