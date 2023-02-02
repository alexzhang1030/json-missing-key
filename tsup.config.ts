import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  clean: true,
  target: ['node16'],
  format: ['esm'],
})
