const { default: createDecorateReactVisitor } = require('../../../src')
const nps = require('path')

module.exports = (babel) => {
  return {
    visitor: {
      Program(path) {
        const run1 = createDecorateReactVisitor({
          prefix: 'mobx-decorate',
          decorateLibPath: require.resolve('./react'),
          moduleInteropPath: null,
          importType: 'default',
          transformData: (data, path1, babelPluginPass, helper) => {
            return nps.relative(__dirname, babelPluginPass.filename)
          },
          visitorTypes: []
        })

        run1.Program.call(this, path)
      }
    }
  }
}
