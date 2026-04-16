// import resolve from '@rollup/plugin-node-resolve';
// import commonjs from '@rollup/plugin-commonjs';
// import typescript from '@rollup/plugin-typescript';

// export default {
//   input: './src/main.ts',
//   external: ['nakama-runtime'],
//   plugins: [
//     resolve(),
//     commonjs(),
//     typescript()
//   ],
//   output: {
//     file: 'build/main.js',
//     format: 'iife',
//     footer: `
//       this.InitModule = InitModule;
//     `
//   }
// };

import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';

export default {
  input: 'src/main.ts',
  output: {
    file: 'build/main.js',
    format: 'cjs' 
  },
  plugins: [
    resolve(),
    commonjs(),
    typescript()
  ]
};