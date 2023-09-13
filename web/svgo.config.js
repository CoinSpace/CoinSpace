export default {
  multipass: true,
  js2svg: {
    indent: 2,
    pretty: true,
  },
  plugins: [{
    name: 'preset-default',
    params: {
      overrides: {
        removeViewBox: false,
      },
    },
  }, {
    name: 'prefixIds',
  }, {
    name: 'removeDimensions',
  }, {
    name: 'cleanupListOfValues',
  }, {
    name: 'convertStyleToAttrs',
  }],
};
