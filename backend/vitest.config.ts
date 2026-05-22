import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    globals: false,
    include: ['src/**/*.test.ts', 'tests/**/*.test.ts'],
    setupFiles: ['./tests/setup.ts'],
    testTimeout: 15_000,
    hookTimeout: 30_000,
    // Vitest 4: poolOptions are flat. Single-fork run keeps Prisma + SQLite happy.
    pool: 'forks',
    fileParallelism: false,
    isolate: false,
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: [
        'src/**/*.d.ts',
        'src/index.ts',
        'src/openapi.ts',
        'src/jobs/**',
      ],
      reporter: ['text', 'lcov'],
    },
  },
})
