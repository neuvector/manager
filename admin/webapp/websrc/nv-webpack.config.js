const CompressionPlugin = require("compression-webpack-plugin");
const BrotliPlugin = require("brotli-webpack-plugin");
const webpack = require('webpack');

const customConfig = {
  plugins: []
};
console.log("IS_DEV:", process.env.IS_DEV);
if (!process.env.IS_DEV || process.env.IS_DEV !== 'true') {
  console.log("Compressing resources...")
  customConfig.plugins.push(
    new CompressionPlugin({
      algorithm: "gzip",
    })
  );
  customConfig.plugins.push(
    new BrotliPlugin()
  );
}

module.exports = customConfig;
