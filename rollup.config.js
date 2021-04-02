import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import babel from "rollup-plugin-babel";
import { uglify } from 'rollup-plugin-uglify'
import { terser } from 'rollup-plugin-terser';
import { eslint } from 'rollup-plugin-eslint';

export default {
    input: './index.js',
    output: [{
        file: 'dist/betools.min.js',
        format: 'umd',
        name: 'Betools'
    }],
    watch: {
        exclude: 'node_modules/**'
    },
    plugins: [
        resolve(),
        commonjs(),
        babel({
            exclude: 'node_modules/**', // 防止打包node_modules下的文件
            runtimeHelpers: true, // 使plugin-transform-runtime生效
        }),
        uglify()
    ]
}