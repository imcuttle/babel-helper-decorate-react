import * as types from '@babel/types'
import createDecorateVisitor, { CreateDecorateVisitorOpts, StrictVisitorConfig } from './createDecorateVisitor'

function createDecorateReactTopJSXVisitor({
  detectClassComponent = true,
  detectFunctionComponent = true,
  condition,
  ...options
}: CreateDecorateVisitorOpts & {
  detectClassComponent?: boolean
  detectFunctionComponent?: boolean

  condition?: StrictVisitorConfig['condition']
}) {
  const vTypes = ['JSXElement'].map((name) => ({
    type: name,
    condition: (path, a, b) => {
      if (condition) {
        if (false === condition(path, a, b)) {
          return false
        }
      }

      if (!path.parent) {
        return false
      }

      if (detectFunctionComponent && types.isArrowFunctionExpression(path.parent)) {
        return true
      }

      if (
        detectFunctionComponent &&
        types.isReturnStatement(path.parent) &&
        path.findParent((nodePath) =>
          ['FunctionExpression', 'FunctionDeclaration', 'ArrowFunctionExpression'].includes(nodePath.node.type)
        )
      ) {
        return true
      }

      if (
        detectClassComponent &&
        types.isReturnStatement(path.parent) &&
        path.findParent((nodePath) => {
          if (['ClassMethod'].includes(nodePath.node.type) && types.isIdentifier(nodePath.get('key'))) {
            const key = nodePath.get('key') as any
            return types.isIdentifier(key.node) && String(key) === 'render'
          }
          return false
        })
      ) {
        return true
      }

      return false
    }
  }))

  return createDecorateVisitor({
    deepVisitorTypes: vTypes,
    visitorTypes: vTypes,
    ...options
  })
}

export default createDecorateReactTopJSXVisitor
