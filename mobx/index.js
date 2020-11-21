const { default: createDecorateReactVisitor } = require('../')

module.exports = (babel) => {
  return {
    visitor: {
      Program(path) {
        const run1 = createDecorateReactVisitor({
          prefix: 'mobx-observer',
          decorateLibPath: require.resolve('./decorate'),
          moduleInteropPath: null,
          transformData: (data, path1, babelPluginPass, helper) => {
            return null
          }
        })

        run1.Program.call(this, path)
      }
    }
  }
}
