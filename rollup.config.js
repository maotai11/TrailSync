// rollup.config.js
import terser from '@rollup/plugin-terser';
import resolve from '@rollup/plugin-node-resolve';

export default {
  input: 'js/app.js',
  output: {
    file: 'bundle.js',
    format: 'iife',
    name: 'TrailSyncApp',
    sourcemap: true
  },
  plugins: [
    resolve(),
    terser()
  ]
};