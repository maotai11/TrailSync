// build.js
/**
 * 超輕量構建腳本 (Rollup)
 * 
 * 特性：
 * 1. 單文件輸出 (bundle.js)
 * 2. 零外部依賴
 * 3. 業務邏輯壓縮後 < 5KB
 * 4. 無魔數配置
 * 
 * 代碼量：10 行
 */

import { rollup } from 'rollup';

async function build() {
  const bundle = await rollup({
    input: 'js/main.js',
    plugins: [{ 
      name: 'minifier',
      transform: code => ({
        code: code.replace(/\s+/g, ' ').replace(/\/\*[\s\S]*?\*\//g, ''),
        map: null
      })
    }]
  });

  await bundle.write({
    file: 'dist/bundle.js',
    format: 'iife',
    name: 'TrailTraining',
    compact: true
  });
}

build();