/**
 * Babel Helper for custom decorator for React Component
 * @author imcuttle
 */
import * as types from '@babel/types'
import tpl from '@babel/template'
import { addDefault, addNamespace } from '@babel/helper-module-imports'

import parseCommentsRanges, { CreateDisabledScopesOptions } from './parseCommentsRanges'

export type CreateDecorateReactVisitorOpts = Partial<CreateDisabledScopesOptions> & {
  visitorTypes?: string[]
  deepVisitorTypes?: string[]
  exportVisitorTypes?: string[]
  importType?: 'default' | 'namespace'
  ExportDefaultDeclaration?: boolean
  ExportNamedDeclaration?: boolean
  decorateLibPath?: string
}

class RangesHelper {
  public ranges: ReturnType<typeof parseCommentsRanges>
  importName: any
  constructor(public opts: any) {}

  inject(path) {
    const { matched, data } = this.getEnableOptions(path.node.loc.start.line)
    if (!matched) {
      return false
    }

    if (!this.importName) {
      if (this.opts.importType === 'default') {
        this.importName = addDefault(path, this.opts.libPath)
      } else {
        this.importName = addNamespace(path, this.opts.libPath)
      }
    }
    const importName = this.importName
    path.replaceWith(
      types.callExpression(types.callExpression(importName, [tpl.expression(JSON.stringify(data || null))()]), [
        path.node
      ])
    )

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
      matched: true,
      data: null
    }
  }
}

function createDecorateReactVisitor({
  prefix = 'decorate',
  decorateLibPath,
  visitorTypes = ['FunctionExpression', 'ArrowFunctionExpression', 'ClassExpression'],
  deepVisitorTypes = visitorTypes,
  importType = 'default',
  exportVisitorTypes = ['ExportDefaultDeclaration', 'ExportNamedDeclaration'],
  ...opts
}: CreateDecorateReactVisitorOpts = {}) {
  if (!prefix) {
    throw new Error('`prefix` is required')
  }
  if (!decorateLibPath) {
    throw new Error('`decorateLibPath` is required')
  }

  const helper = new RangesHelper({ importType, libPath: decorateLibPath })

  let deepVisitors = deepVisitorTypes.reduce((acc: any, name) => {
    acc[name] = (path) => {
      helper.inject(path)
    }
    return acc
  }, {})

  let _visitors = visitorTypes.reduce((acc: any, name) => {
    acc[name] = (path) => {
      helper.inject(path)
    }
    return acc
  }, {})

  let exportVisitors = exportVisitorTypes.reduce((acc: any, name) => {
    acc[name] = (path) => {
      path.traverse(deepVisitors, {
        helper
      })
    }
    return acc
  }, {})

  return {
    ..._visitors,
    ...exportVisitors,
    Program(path) {
      helper.ranges = parseCommentsRanges(path.container.comments, { prefix, ...opts })
    }
  }
}

export default createDecorateReactVisitor
