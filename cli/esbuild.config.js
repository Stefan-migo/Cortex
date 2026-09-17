const esbuild = require('esbuild');

// Build the bundle
esbuild.build({
  entryPoints: ['src/index.ts'],
  bundle: true,
  platform: 'node',
  target: 'node18',
  outfile: 'dist/index.js',
  format: 'cjs',
  sourcemap: true,
}).catch(() => process.exit(1));
