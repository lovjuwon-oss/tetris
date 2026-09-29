import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: [
        'src/core/**/*.ts',
        'src/platform/gestures.ts',
        'src/platform/input-hub.ts',
        'src/render/layout.ts',
      ],
      exclude: ['src/**/*.test.ts', 'src/core/test-helpers.ts'],
      thresholds: { lines: 90, statements: 90, functions: 90 },
    },
  },
});
