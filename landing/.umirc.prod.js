
// ref: https://umijs.org/config/
export default {
  ssr: {
    // only prod
    disableExternal: true
  },
  hash: false,
  publicPath: '/',
  treeShaking: true,
  theme: 'src/theme.js',
  targets: {
    ie: 11,
  },
  plugins: [
    // ref: https://umijs.org/plugin/umi-plugin-react.html
    ['umi-plugin-react', {
      antd: true,
      dva: true,
      dynamicImport: { webpackChunkName: true },
      dll: false,
      routes: {
        exclude: [
          /models\//,
          /services\//,
          /model\.(t|j)sx?$/,
          /service\.(t|j)sx?$/,
          /components\//,
        ],
      },
    }],
  ],
}
