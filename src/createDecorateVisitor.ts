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

export type VisitorConfig =
  | string
  | {
      type: string
      condition?: (
        path: import('@babel/traverse').NodePath,
        babelPluginPass: import('@babel/core').PluginPass,
        helper: RangesHelper
      ) => boolean
      transformData?: TransformDataFn
    }

export type CreateDecorateVisitorOpts = Partial<CreateDisabledScopesOptions> & {
  visitorTypes?: VisitorConfig[]
  deepVisitorTypes?: VisitorConfig[]
  exportVisitorTypes?: string[]
  transformData?: TransformDataFn
  importType?: 'default' | 'namespace'
  ExportDefaultDeclaration?: boolean
  ExportNamedDeclaration?: boolean
  decorateLibPath?: string
  defaultEnable?: boolean
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

    if (!this.importName) {
      if (this.opts.importType === 'default') {
        this.importName = addDefault(path, this.opts.libPath)
      } else {
        this.importName = addNamespace(path, this.opts.libPath)
      }
    }
    const importName = this.importName

    if (transformData) {
      data = transformData(data, path, this)
    }

    let dataExp = tpl.expression(JSON.stringify(data || null))()
    if ('ClassDeclaration' === path.node.type) {
      path.node.decorators = path.node.decoraters || []
      path.node.decorators.push(types.decorator(types.callExpression(importName, [dataExp])))
    } else {
      path.replaceWith(types.callExpression(types.callExpression(importName, [dataExp]), [path.node]))
    }

    path.skip()
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
  visitorTypes = ['FunctionExpression', 'ArrowFunctionExpression', 'ClassExpression', 'ClassDeclaration'],
  deepVisitorTypes = visitorTypes,
  importType = 'default',
  exportVisitorTypes = ['ExportDefaultDeclaration', 'ExportNamedDeclaration'],
  defaultEnable = true,
  transformData,
  ...opts
}: CreateDecorateVisitorOpts = {}) {
  if (!prefix) {
    throw new Error('`prefix` is required')
  }
  if (!decorateLibPath) {
    throw new Error('`decorateLibPath` is required')
  }

  const helper = new RangesHelper({ importType, libPath: decorateLibPath, defaultEnable })

  const reduceVisitors = (types: VisitorConfig[]) =>
    types.reduce((acc: any, name) => {
      if (typeof name === 'string') {
        acc[name] = function (path) {
          helper.inject(path)
        }
      } else {
        acc[name.type] = function (path) {
          const transform = name.transformData || transformData
          if (!name.condition) {
            helper.inject(path, (data) => (transform ? transform(data, path, helper.babelPass, helper) : data))
          } else if (name.condition(path, helper.babelPass, helper)) {
            helper.inject(path, (data) => (transform ? transform(data, path, helper.babelPass, helper) : data))
          }
        }
      }
      return acc
    }, {})

  const deepVisitors = reduceVisitors(deepVisitorTypes)
  const _visitors = reduceVisitors(visitorTypes)

  let exportVisitors = exportVisitorTypes.reduce((acc: any, name) => {
    acc[name] = function (path) {
      path.traverse(deepVisitors, {})
    }
    return acc
  }, {})

  return {
    ..._visitors,
    ...exportVisitors,
    Program(path) {
      helper.babelPass = this
      helper.ranges = parseCommentsRanges(path.container.comments, { prefix, ...opts })
    }
  }
}

export default createDecorateVisitor
