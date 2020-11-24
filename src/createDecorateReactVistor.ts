import createDecorateVisitor, {
  CreateDecorateVisitorOpts,
  RangesHelper,
  StrictVisitorConfig,
  VisitorConfig
} from './createDecorateVisitor'

const isMemberExpression = (path, name: string) => {
  return String(path) === name
}

export const defaultReactClassMethodsTokens = [
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

export const defaultReactClassMemberTokens = []
export const defaultReactClassCallTokens = []
export const defaultReactClassSuperTokens = []
;['React.Profiler', 'React.Suspense', 'React.StrictMode', 'React.Fragment'].forEach((name) => {
  defaultReactClassMemberTokens.push(name)
  defaultReactClassMemberTokens.push(name.split('.')[1])
})
;['React.Component', 'React.PureComponent'].forEach((name) => {
  defaultReactClassSuperTokens.push(name)
  defaultReactClassSuperTokens.push(name.split('.')[1])
})
;['React.createRef', 'React.createFactory', 'React.createElement', 'React.cloneElement'].forEach((name) => {
  defaultReactClassCallTokens.push(name)
  defaultReactClassCallTokens.push(name.split('.')[1])
})

export const defaultReactFunctionCallTokens = defaultReactClassCallTokens.slice()
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
  defaultReactFunctionCallTokens.push(name)
  defaultReactFunctionCallTokens.push(name.split('.')[1])
})

function createDecorateReactVisitor({
  reactClassSuperTokens = defaultReactClassSuperTokens,
  reactClassMethodsTokens = defaultReactClassMethodsTokens,
  reactClassCallTokens = defaultReactClassCallTokens,
  reactFunctionCallTokens = defaultReactFunctionCallTokens,
  reactClassMemberTokens = defaultReactClassMemberTokens,
  detectClassComponent = true,
  detectFunctionComponent = true,

  condition,
  ...options
}: Omit<CreateDecorateVisitorOpts, 'visitorTypes'> & { condition?: StrictVisitorConfig['condition'] } & {
  reactClassSuperTokens?: string[]
  reactClassMethodsTokens?: string[]
  reactClassCallTokens?: string[]
  reactClassMemberTokens?: string[]

  reactFunctionCallTokens?: string[]
  detectClassComponent?: boolean
  detectFunctionComponent?: boolean
}) {
  const vTypes = [
    detectFunctionComponent && 'FunctionExpression',
    detectFunctionComponent && 'ArrowFunctionExpression',
    detectClassComponent && 'ClassExpression|ClassDeclaration'
  ]
    .filter(Boolean)
    .map((name) => ({
      type: name,
      condition: (path, a, b) => {
        if (condition) {
          if (false === condition(path, a, b)) {
            return false
          }
        }

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
        } else {
          path.traverse({
            CallExpression(path) {
              if (reactFunctionCallTokens.some((token) => isMemberExpression(path.get('callee'), token))) {
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

  return createDecorateVisitor({
    deepVisitorTypes: vTypes,
    visitorTypes: vTypes,
    detectScopeDepth: 1,
    ...options
  })
}

export default createDecorateReactVisitor
