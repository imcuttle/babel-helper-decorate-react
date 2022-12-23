const createDecorateReactVisitor = require('../../../src').default

module.exports = function reactDecoratePlugin() {
  return {
    visitor: {
      Program(path, data) {
        const visitor = createDecorateReactVisitor({
          prefix: 'lazy-monitor',
          detectClassComponent: true,
          moduleInteropPath: null,
          detectFunctionComponent: true,
          decorateLibPath: '/lib/',
          detectScopeDepth: 1,
          transformData: (data, path1, babelPluginPass, helper) => {
            return {
              location: helper.getLocation(path1),
              filename: babelPluginPass?.filename
            }
          },
          ...data.opts
        })

        return visitor.Program.apply(this, [path, data])
      }
    }
  }
}
