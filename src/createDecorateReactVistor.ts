import createDecorateVisitor, { CreateDecorateVisitorOpts } from './createDecorateVisitor'

const isMemberExpression = (path, name: string) => {
  return String(path) === name
}

export const reactClassMethodsTokens = [
  'componentDidUpdate',
  'componentDidCatch',
  'componentDidMount',
  'componentWillMount',
  'componentWillReceiveProps',
  'componentWillUnmount',
  'componentWillUpdate',
  'UNSAFE_componentWillMount',
  'UNSAFE_componentWillReceiveProps',
  'UNSAFE_componentWillUpdate',
  'getSnapshotBeforeUpdate',
  'shouldComponentUpdate',
  'render'
]

export const reactClassMemberTokens = []
export const reactClassCallTokens = []
export const reactClassSuperTokens = []
;['React.Profiler', 'React.Suspense', 'React.StrictMode', 'React.Fragment'].forEach((name) => {
  reactClassMemberTokens.push(name)
  reactClassMemberTokens.push(name.split('.')[1])
})
;['React.Component', 'React.PureComponent'].forEach((name) => {
  reactClassSuperTokens.push(name)
  reactClassSuperTokens.push(name.split('.')[1])
})
;['React.createRef', 'React.createFactory', 'React.createElement', 'React.cloneElement'].forEach((name) => {
  reactClassCallTokens.push(name)
  reactClassCallTokens.push(name.split('.')[1])
})

export const reactHookCallTokens = []
;[
  'React.useCallback',
  'React.useEffect',
  'React.useMemo',
  'React.useImperativeHandle',
  'React.useLayoutEffect',
  'React.useReducer',
  'React.useContext',
  'React.useState',
  'React.useDebugValue',
  'React.useRef'
].forEach((name) => {
  reactHookCallTokens.push(name)
  reactHookCallTokens.push(name.split('.')[1])
})

function createDecorateReactVisitor(options: Omit<CreateDecorateVisitorOpts, 'visitorTypes'>) {
  return createDecorateVisitor({
    ...options,
    visitorTypes: ['FunctionExpression', 'ArrowFunctionExpression', 'ClassExpression|ClassDeclaration'].map((name) => ({
      type: name,
      condition: (path, helper) => {
        let isMatched = false
        if (name === 'ClassExpression|ClassDeclaration') {
          if (reactClassSuperTokens.some((token) => isMemberExpression(path.get('superClass'), token))) {
            path.stop()
            return true
          }

          path.traverse({
            ClassMethod(path) {
              if (reactClassMethodsTokens.some((token) => isMemberExpression(path.get('key'), token))) {
                isMatched = true
                path.stop()
              }
            },
            CallExpression(path) {
              if (
                reactClassCallTokens
                  .concat(reactHookCallTokens)
                  .some((token) => isMemberExpression(path.get('callee'), token))
              ) {
                isMatched = true
                path.stop()
              }
            },
            // @ts-ignore
            ['MemberExpression|Identifier'](path) {
              if (reactClassMemberTokens.some((token) => isMemberExpression(path, token))) {
                isMatched = true
                path.stop()
              }
              path.skip()
            },
            JSXElement(path) {
              isMatched = true
              path.stop()
            },
            JSXFragment(path) {
              isMatched = true
              path.stop()
            }
          })
        } else {
          path.traverse({
            CallExpression(path) {
              if (reactClassCallTokens.some((token) => isMemberExpression(path.get('callee'), token))) {
                isMatched = true
                path.stop()
              }
            },
            // @ts-ignore
            ['MemberExpression|Identifier'](path) {
              if (reactClassMemberTokens.some((token) => isMemberExpression(path, token))) {
                isMatched = true
                path.stop()
              }
              path.skip()
            },
            JSXElement(path) {
              isMatched = true
              path.stop()
            },
            JSXFragment(path) {
              isMatched = true
              path.stop()
            }
          })
        }

        return isMatched
      }
    }))
  })
}

export default createDecorateReactVisitor
