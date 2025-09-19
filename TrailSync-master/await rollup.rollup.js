// build script (conceptual)
// This would be run in a real build environment
const rollup = require('rollup');
const terser = require('@rollup/plugin-terser');

async function build() {
    const bundle = await rollup.rollup({
        input: 'src/main.js',
        plugins: [
            terser()
        ]
    });

    await bundle.write({
        file: 'dist/bundle.js',
        format: 'iife',
        name: 'TrailTraining',
        sourcemap: false
    });
}

build();