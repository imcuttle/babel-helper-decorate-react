import * as types from '@babel/types'
import createDecorateVisitor, { CreateDecorateVisitorOpts } from './createDecorateVisitor'

function createDecorateReactTopJSXVisitor({
  detectClassComponent = true,
  detectFunctionComponent = true,
  ...options
}: Omit<CreateDecorateVisitorOpts, 'visitorTypes'> & {
  detectClassComponent?: boolean
  detectFunctionComponent?: boolean
}) {
  return createDecorateVisitor({
    ...options,
    visitorTypes: ['JSXElement'].map((name) => ({
      type: name,
      condition: (path, helper) => {
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
  })
}

export default createDecorateReactTopJSXVisitor
