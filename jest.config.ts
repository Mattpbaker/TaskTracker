import type { Config } from 'jest'
const config: Config = {
  testEnvironment: 'node',
  transform: { '^.+\\.tsx?$': ['ts-jest', { tsconfig: { jsx: 'react-jsx' } }] },
  testMatch: ['<rootDir>/src/__tests__/**/*.test.ts?(x)'],
  moduleNameMapper: { '^@/(.*)$': '<rootDir>/src/$1' },
  roots: ['<rootDir>/src'],
  watchPathIgnorePatterns: ['<rootDir>/.worktrees/'],
}
export default config
