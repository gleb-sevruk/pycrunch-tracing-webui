const MonacoEditorPlugin = require('monaco-editor-webpack-plugin')

module.exports = {
  chainWebpack: config => {
    config.module
      .rule('glsl')
      .test(/\.(frag|vert|glsl)$/)
      .use('glsl-shader-loader')
      .loader('glsl-shader-loader')
      .end()
      // Add another loader
    config.plugin('monaco-editor').use(MonacoEditorPlugin, [
      {
        // https://github.com/Microsoft/monaco-editor-webpack-plugin#options
        // Include a subset of languages support
        // Some language extensions like typescript are so huge that may impact build performance
        // e.g. Build full languages support with webpack 4.0 takes over 80 seconds
        // Languages are loaded on demand at runtime
        languages: ['javascript', 'python']
      }
    ])
  },
}