const { createDecorateReactTopJSXVisitor } = require('../')

module.exports = (babel) => {
  return {
    visitor: {
      Program(path, state) {
        const run1 = createDecorateReactTopJSXVisitor({
          prefix: 'jsx-decorate',
          moduleInteropPath: null,
          detectScopeDepth: 1,
          ...state.opts
        })

        run1.Program.call(this, path)
      }
    }
  }
}
