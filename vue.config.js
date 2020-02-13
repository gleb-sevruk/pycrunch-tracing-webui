module.exports = {
  chainWebpack: config => {
    config.module
      .rule('glsl')
      .test(/\.(frag|vert|glsl)$/)
      .use('glsl-shader-loader')
      .loader('glsl-shader-loader')
      .end()
      // Add another loader
  },
}