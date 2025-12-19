import config, { node } from 'eslint-config-coinspace';

/** @type {import('eslint').Linter.Config[]} */
export default [
  {
    ignores: ['./dist', './out'],
  },
  ...config,
  ...node,
];
