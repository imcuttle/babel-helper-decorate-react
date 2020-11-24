const { default: createDecorateReactVisitor } = require('../')

module.exports = (babel) => {
  return {
    visitor: {
      Program(path, state) {
        const run1 = createDecorateReactVisitor({
          prefix: 'react-decorate',
          moduleInteropPath: null,
          detectScopeDepth: 1,
          ...state.opts
        })

        run1.Program.call(this, path)
      }
    }
  }
}
