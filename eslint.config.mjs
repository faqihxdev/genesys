import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTypescript from 'eslint-config-next/typescript';

const eslintConfig = [
  ...nextVitals,
  ...nextTypescript,
  {
    ignores: [
      '.next/**',
      '.open-next/**',
      '.wrangler/**',
      '.dev/**',
      'build/**',
      'coverage/**',
      'node_modules/**',
      'out/**',
      'prompt/**',
      'next-env.d.ts',
    ],
  },
  {
    rules: {
      // React Compiler is not enabled. Preserve the existing UI's hook lint profile.
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/immutability': 'off',
      'react-hooks/static-components': 'off',
      'react-hooks/purity': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
    },
  },
];

export default eslintConfig;
