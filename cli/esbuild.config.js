const esbuild = require('esbuild');
const { copyFileSync, mkdirSync, readdirSync, statSync, existsSync } = require('fs');
const { join, relative } = require('path');

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

// Copy template directory to cli/template/ for production use
const srcTemplate = join(__dirname, 'src', 'template');
const destTemplate = join(__dirname, 'template');

function copyDir(src, dest) {
  if (!existsSync(src)) return;
  mkdirSync(dest, { recursive: true });
  for (const entry of readdirSync(src)) {
    const srcPath = join(src, entry);
    const destPath = join(dest, entry);
    if (statSync(srcPath).isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      copyFileSync(srcPath, destPath);
    }
  }
}

copyDir(srcTemplate, destTemplate);
console.log(`Template copied: ${srcTemplate} → ${destTemplate}`);
