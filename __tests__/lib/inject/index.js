const { createDecorateReactTopJSXVisitor, default: createDecorateReactVisitor } = require('../../../src')
const nps = require('path')

module.exports = (babel) => {
  return {
    visitor: {
      Program(path) {
        const run1 = createDecorateReactVisitor({
          prefix: 'decorate',
          decorateLibPath: require.resolve('./react'),
          detectFunctionComponent: false,
          moduleInteropPath: null,
          importType: 'default',
          transformData: (data, path1, babelPluginPass, helper) => {
            return nps.relative(__dirname, babelPluginPass.filename)
          },
          visitorTypes: []
        })

        const run2 = createDecorateReactTopJSXVisitor({
          prefix: 'decorate',
          visitorTypes: [],
          decorateLibPath: require.resolve('./jsx'),
          moduleInteropPath: null,
          detectClassComponent: false,
          importType: 'default',
          transformData: (data, path1, babelPluginPass, helper) => {
            return nps.relative(__dirname, babelPluginPass.filename)
          }
        })

        run1.Program.call(this, path)
        run2.Program.call(this, path)
      }
    }
  }
}
