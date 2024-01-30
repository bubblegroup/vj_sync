module.exports = {
  env: {
    es2024: true,
    node: true,
    jest: true
  },
  globals: {
    expect: 'readonly'
  },
  plugins: ['@typescript-eslint'],
  rules: {
    'max-len': [1, { comments: 80, code: 120 }]
  },
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module'
  },
  overrides: [
    {
      files: ['*.ts'],
      parser: '@typescript-eslint/parser',
      parserOptions: {
        project: './tsconfig.json',
        sourceType: 'module'
      }
    }
  ]
}
