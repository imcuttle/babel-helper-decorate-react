import createDecorateVisitor, { CreateDecorateVisitorOpts, StrictVisitorConfig } from './createDecorateVisitor'
import { isScopeDepthPassed, replaceAdvancedWith } from './utils'
import * as t from '@babel/types'

export type TokenRuleType = string | RegExp | ((path: import('@babel/core').NodePath) => boolean)

const isMemberExpression = (path: import('@babel/core').NodePath, name: TokenRuleType) => {
  if (typeof name === 'string') {
    return String(path) === name
  }
  if (typeof name === 'function') {
    return name(path)
  }
  return name.test(String(path))
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

const detectIsValidName = (path: import('@babel/traverse').NodePath) => {
  if (t.isFunctionExpression(path.node) || t.isArrowFunctionExpression(path.node)) {
    const variableDeclartorPath = path.findParent((path) => t.isVariableDeclarator(path.node))
    if (
      variableDeclartorPath &&
      // @ts-ignore
      variableDeclartorPath.node?.id?.name &&
      // @ts-ignore
      /^[^a-zA-Z]*?[A-Z]/.test(variableDeclartorPath.node?.id?.name)
    ) {
      return true
    }
  }

  if (
    t.isFunctionDeclaration(path.node) &&
    (!path.node?.id || // @ts-ignore
      (path.node?.id?.name &&
        // @ts-ignore
        /^[^a-zA-Z]*?[A-Z]/.test(path.node?.id?.name)))
  ) {
    return true
  }
  return false
}

function createDecorateReactVisitor({
  reactClassSuperTokens = defaultReactClassSuperTokens,
  reactClassMethodsTokens = defaultReactClassMethodsTokens,
  reactClassCallTokens = defaultReactClassCallTokens,
  reactFunctionCallTokens = defaultReactFunctionCallTokens,
  reactClassMemberTokens = defaultReactClassMemberTokens,
  wrapFunctionComponentDecorateTokens = ['React.forwardRef', 'forwardRef'],
  detectClassComponent = true,
  detectFunctionComponent = true,
  detectComponentName = true,

  condition,
  ...options
}: Omit<CreateDecorateVisitorOpts, 'visitorTypes'> & { condition?: StrictVisitorConfig['condition'] } & {
  reactClassSuperTokens?: TokenRuleType[]
  reactClassMethodsTokens?: TokenRuleType[]
  reactClassCallTokens?: TokenRuleType[]
  wrapFunctionComponentDecorateTokens?: TokenRuleType[]
  reactClassMemberTokens?: TokenRuleType[]
  reactFunctionCallTokens?: TokenRuleType[]
  detectClassComponent?: boolean
  detectComponentName?: boolean
  detectFunctionComponent?: boolean
}) {
  const mergedOptions = {
    detectScopeDepth: 1,
    ...options
  }

  const isReactInner = (path) => {
    let isMatched = false
    path.traverse({
      CallExpression(path) {
        if (
          isScopeDepthPassed(path, mergedOptions.detectScopeDepth) &&
          reactFunctionCallTokens.some((token) => isMemberExpression(path.get('callee'), token))
        ) {
          isMatched = true
          path.stop()
        }
      },
      // @ts-ignore
      ['MemberExpression|Identifier'](path) {
        if (
          isScopeDepthPassed(path, mergedOptions.detectScopeDepth) &&
          reactClassMemberTokens.some((token) => isMemberExpression(path, token))
        ) {
          isMatched = true
          path.stop()
        }
        path.skip()
      },
      JSXElement(path) {
        if (isScopeDepthPassed(path, mergedOptions.detectScopeDepth)) {
          isMatched = true
          path.stop()
        }
      },
      JSXFragment(path) {
        if (isScopeDepthPassed(path, mergedOptions.detectScopeDepth)) {
          isMatched = true
          path.stop()
        }
      }
    })
    return isMatched
  }

  const vTypes = [
    detectFunctionComponent && 'FunctionExpression|ArrowFunctionExpression',
    detectFunctionComponent && 'FunctionDeclaration',
    detectClassComponent && 'ClassExpression|ClassDeclaration'
  ]
    .filter(Boolean)
    .map((name) => ({
      type: name,
      condition: (path: import('@babel/traverse').NodePath, a, b, api) => {
        if (condition) {
          if (false === condition(path, a, b, api)) {
            return false
          }
        }

        let isMatched = false
        if (name === 'ClassExpression|ClassDeclaration') {
          if (!(path.get('superClass') as any)?.node) {
            return false
          }
          if (
            isScopeDepthPassed(path, mergedOptions.detectScopeDepth) &&
            reactClassSuperTokens.some((token) => isMemberExpression(path.get('superClass') as any, token))
          ) {
            path.stop()
            return true
          }

          const deltaDepth = (delta) => {
            if (delta != null) {
              return mergedOptions.detectScopeDepth != null
                ? mergedOptions.detectScopeDepth < 0
                  ? mergedOptions.detectScopeDepth
                  : mergedOptions.detectScopeDepth + delta
                : mergedOptions.detectScopeDepth
            }
            return mergedOptions.detectScopeDepth
          }

          path.traverse({
            ClassMethod(path) {
              // console.log(String(path.get('key')), reactClassMethodsTokens.some((token) => isMemberExpression(path.get('key') as any, token)))
              if (
                isScopeDepthPassed(path, deltaDepth(1)) &&
                reactClassMethodsTokens.some((token) => isMemberExpression(path.get('key') as any, token))
              ) {
                isMatched = true
                path.stop()
              }
            },
            CallExpression(path) {
              if (
                isScopeDepthPassed(path, deltaDepth(2)) &&
                reactClassCallTokens.some((token) => isMemberExpression(path.get('callee') as any, token))
              ) {
                isMatched = true
                path.stop()
              }
            },
            // @ts-ignore
            ['MemberExpression|Identifier'](path) {
              if (
                isScopeDepthPassed(path, deltaDepth(2)) &&
                reactClassMemberTokens.some((token) => isMemberExpression(path, token))
              ) {
                isMatched = true
                path.stop()
              }
              path.skip()
            },
            JSXElement(path) {
              if (isScopeDepthPassed(path, deltaDepth(2))) {
                isMatched = true
                path.stop()
              }
            },
            JSXFragment(path) {
              if (isScopeDepthPassed(path, deltaDepth(2))) {
                isMatched = true
                path.stop()
              }
            }
          })

          return isMatched
        } else {
          // @ts-ignore
          if (path.node?.async || path.node?.generator) {
            return false
          }

          /**
           * function Button() {}
           */
          if (
            path.node.type === 'FunctionDeclaration' &&
            isReactInner(path) &&
            (!detectComponentName || detectIsValidName(path))
          ) {
            const getVariableDeclarator = () => {
              // path.opts
              return t.variableDeclarator(
                // @ts-ignore
                t.identifier(path.node?.id?.name || '__unknow'),
                t.functionExpression(
                  // @ts-ignore
                  path.node.id,
                  // @ts-ignore
                  path.node.params,
                  // @ts-ignore
                  path.node.body,
                  // @ts-ignore
                  path.node.generator,
                  // @ts-ignore
                  path.node.async
                )
              )
            }
            const getVariableDeclaration = () => {
              return t.variableDeclaration('const', [getVariableDeclarator()])
            }
            /**
             * function X() {
             *   return <div></div>
             * }
             * =>
             * const X = function X() {
             *   return <div></div>
             * }
             */
            if (path.parent?.type === 'Program') {
              // @ts-ignore
              replaceAdvancedWith(path, getVariableDeclaration())
              api.noSkip()
              return false
            }

            /**
             * export function X() {
             *   return <div></div>
             * }
             * =>
             * export const X = function X() {
             *   return <div></div>
             * }
             */
            if (path.parent?.type === 'ExportNamedDeclaration') {
              replaceAdvancedWith(path, getVariableDeclaration())
              api.noSkip()
              return false
            }

            /**
             * export default function X() {
             *   return <div></div>
             * }
             * =>
             * const X = function X() {
             *   return <div></div>
             * }
             * export default X;
             */
            if (path.parent?.type === 'ExportDefaultDeclaration') {
              // @ts-ignore
              path.parentPath.insertBefore(getVariableDeclaration())
              replaceAdvancedWith(path, t.identifier(path.node.id.name))
              api.noSkip()
              return false
            }

            return false
          }
          // // @ts-ignore
          // if (path.parent.node?.type === 'CallExpression') {
          //   debugger
          // }

          if (detectComponentName && !detectIsValidName(path)) {
            return false
          }

          if (isReactInner(path)) {
            const parentPath: any = path.parentPath
            if (
              parentPath.node?.type === 'CallExpression' &&
              parentPath.node?.callee?.name &&
              wrapFunctionComponentDecorateTokens.some((t) => isMemberExpression(parentPath.get('callee'), t))
            ) {
              api.wrap()
              return true
            }
            return true
          }
          return false
        }
      }
    }))

  return createDecorateVisitor({ deepVisitorTypes: vTypes, visitorTypes: vTypes, ...mergedOptions })
}

export default createDecorateReactVisitor
