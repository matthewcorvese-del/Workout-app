import { build } from 'esbuild';
import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';

const OUTPUT_DIR = '.vercel/output';
const FUNC_DIR = join(OUTPUT_DIR, 'functions/api.func');

// Create output directories
mkdirSync(FUNC_DIR, { recursive: true });
mkdirSync(join(OUTPUT_DIR, 'static'), { recursive: true });

// Bundle the server entry point
await build({
  entryPoints: ['server-entry.ts'],
  bundle: true,
  platform: 'node',
  target: 'node18',
  format: 'esm',
  outfile: join(FUNC_DIR, 'index.js'),
  external: [],
  banner: {
    js: `
      import { createRequire } from 'module';
      const require = createRequire(import.meta.url);
    `,
  },
});

// Write function config
writeFileSync(
  join(FUNC_DIR, '.vc-config.json'),
  JSON.stringify({
    runtime: 'nodejs18.x',
    handler: 'index.js',
    launcherType: 'Nodejs',
  })
);

// Write routing config
writeFileSync(
  join(OUTPUT_DIR, 'config.json'),
  JSON.stringify({
    version: 3,
    routes: [
      {
        src: '/api/(.*)',
        dest: '/api',
      },
    ],
  })
);

console.log('✅ Vercel build complete');
