import { defineConfig } from 'tsup';

export default defineConfig({
    entry: {
        'core/index': 'src/core/index.ts',
        'cli/bin': 'src/cli/bin.ts',
        'cli/index': 'src/cli/index.ts',
        'mcp/bin': 'src/mcp/bin.ts',
        'mcp/index': 'src/mcp/index.ts',
    },
    format: ['esm'],
    dts: true,
    splitting: false,
    clean: true,
    target: 'node18',
    shims: true,
});
