import * as types from '@babel/types'
import tpl from '@babel/template'
import { addDefault, addNamespace } from '@babel/helper-module-imports'

import parseCommentsRanges, { CreateDisabledScopesOptions } from './parseCommentsRanges'

export type TransformDataFn = (
  data: any,
  path: import('@babel/traverse').NodePath,
  babelPluginPass: import('@babel/core').PluginPass,
  helper: RangesHelper
) => any

export type StrictVisitorConfig = {
  type: string
  condition?: (
    path: import('@babel/traverse').NodePath,
    babelPluginPass: import('@babel/core').PluginPass,
    helper: RangesHelper
  ) => boolean
  transformData?: TransformDataFn
}

export type VisitorConfig = string | StrictVisitorConfig

export type CreateDecorateVisitorOpts = Partial<CreateDisabledScopesOptions> & {
  visitorTypes?: VisitorConfig[]
  deepVisitorTypes?: VisitorConfig[]
  exportVisitorTypes?: string[]
  transformData?: TransformDataFn
  ExportDefaultDeclaration?: boolean
  ExportNamedDeclaration?: boolean
  decorateLibPath?: string
  detectScopeDepth?: number
  importType?: 'namespace' | 'default'
  defaultEnable?: boolean
  moduleInteropPath?: string
}

export class RangesHelper {
  public ranges: ReturnType<typeof parseCommentsRanges>
  importName: any
  cache = new Map()
  babelPass: import('@babel/core').PluginPass

  constructor(public opts: any) {}

  inject(path, transformData?: any) {
    let { matched, data } = this.getEnableOptions(path.node.loc.start.line)
    if (!matched) {
      return false
    }

    if (!this.cache.get(path.node)) {
      this.cache.set(path.node, [])
    }

    const decorated = this.cache.get(path.node)
    if (decorated.includes(this.opts.libPath)) {
      return path.skip()
    }
    decorated.push(this.opts.libPath)

    let importName = this.importName

    if (!importName) {
      const moduleInteropPath = this.opts.moduleInteropPath
      if (this.opts.importType === 'namespace') {
        this.importName = addNamespace(path, this.opts.libPath, { nameHint: 'decorate' })
      } else {
        this.importName = addDefault(path, this.opts.libPath, { nameHint: 'decorate' })
      }

      if (moduleInteropPath) {
        const moduleInterop = addDefault(path, moduleInteropPath)
        this.importName = types.callExpression(moduleInterop, [this.importName])
      }
      importName = this.importName
    } else {
      importName = types.cloneDeep(this.importName)
    }
    // this.importName
    if (transformData) {
      data = transformData(data, path, this)
    }

    let dataExp = tpl.expression(JSON.stringify(data || null))()
    if ('ClassDeclaration' === path.node.type) {
      path.node.decorators = path.node.decorators || []
      path.node.decorators.push(types.decorator(types.callExpression(importName, [dataExp])))
    } else {
      path.replaceWith(types.callExpression(types.callExpression(importName, [dataExp]), [path.node]))
    }
  }

  getEnableOptions(line: number) {
    for (const r of this.ranges) {
      if (r.type === 'disable') {
        if (r.has(line)) {
          return {
            matched: false,
            data: null
          }
        }
      }

      if (r.has(line)) {
        return {
          matched: true,
          data: r.data
        }
      }
    }

    return {
      matched: this.opts.defaultEnable,
      data: null
    }
  }
}

function createDecorateVisitor({
  prefix = 'decorate',
  decorateLibPath,
  moduleInteropPath = require.resolve('module-interop'),
  visitorTypes = ['FunctionExpression', 'ArrowFunctionExpression', 'ClassExpression', 'ClassDeclaration'],
  deepVisitorTypes = visitorTypes,
  exportVisitorTypes = ['ExportDefaultDeclaration', 'ExportNamedDeclaration'],
  defaultEnable = true,
  transformData,
  importType = 'default',
  detectScopeDepth = -1,
  ...opts
}: CreateDecorateVisitorOpts = {}) {
  if (!prefix) {
    throw new Error('`prefix` is required')
  }
  if (!decorateLibPath) {
    throw new Error('`decorateLibPath` is required')
  }

  const isScopeDepthPassed = (path) => {
    if (detectScopeDepth < 0) {
      return true
    }

    let t = detectScopeDepth
    let scope = path.scope
    do {
      scope = scope.parent
      if (t === 0 && !scope) {
        return true
      }
      t--
    } while (t >= 0 && scope)
    return false
  }

  const reduceVisitors = (types: VisitorConfig[]) =>
    types.reduce((acc: any, name) => {
      if (typeof name === 'string') {
        acc[name] = function (path, { helper }) {
          if (isScopeDepthPassed(path)) {
            helper.inject(path)
          }
          path.skip()
        }
      } else {
        acc[name.type] = function (path, { helper }) {
          const transform = name.transformData || transformData
          if (isScopeDepthPassed(path)) {
            if (!name.condition) {
              helper.inject(path, (data) => (transform ? transform(data, path, helper.babelPass, helper) : data))
            } else if (name.condition(path, helper.babelPass, helper)) {
              helper.inject(path, (data) => (transform ? transform(data, path, helper.babelPass, helper) : data))
            }
          }
          path.skip()
        }
      }
      return acc
    }, {})

  const deepVisitors = reduceVisitors(deepVisitorTypes)
  const _visitors = reduceVisitors(visitorTypes)

  let exportVisitors = exportVisitorTypes.reduce((acc: any, name) => {
    acc[name] = function (path, state) {
      path.traverse(deepVisitors, state)
      path.skip()
    }
    return acc
  }, {})

  return {
    Program(path) {
      const helper = new RangesHelper({
        importType,
        moduleInteropPath,
        libPath: decorateLibPath,
        defaultEnable
      })
      helper.babelPass = this
      helper.ranges = parseCommentsRanges(path.container.comments, { prefix, ...opts })

      path.traverse(
        {
          ..._visitors,
          ...exportVisitors
        },
        { helper }
      )
    }
  }
}

export default createDecorateVisitor
