const path = require('path')
module.exports = {
  preset: '@vue/cli-plugin-unit-jest',
  "transform": {
    ".*\\.(glsl)$": "<rootDir>/node_modules/glsl-shader-loader"
  },
  setupFiles: ["<rootDir>/jestsetEnvVars.js"]

}
