import js from '@eslint/js';
import ts from 'typescript-eslint';

export default ts.config(
  { ignores: ['dist/**', 'node_modules/**', '.atlasforge/**', '.publish/**', 'vendor/**', 'coverage/**', 'image/**'] },
  js.configs.recommended,
  ...ts.configs.recommended,
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-console': 'off',
    },
  }
);
