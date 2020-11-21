/**
 * @file main
 * @author imcuttle
 * @date 2018/4/4
 */
import * as React from 'react'
import * as nps from 'path'
import * as Module from 'module'
import createDecorateReactVisitor, { createDecorateReactTopJSXVistor } from '../src'
import * as babel from '@babel/core'
import * as TestRenderer from 'react-test-renderer'

const visit = (code, opts?: Parameters<typeof createDecorateReactVisitor>[0], plugins = []) => {
  const prePlugins = plugins.length
    ? plugins
    : [
        {
          manipulateOptions(opts: any, parserOpts: any): void {
            parserOpts.plugins.push('jsx', 'decorate')
          },
          visitor: createDecorateReactVisitor({ decorateLibPath: '/decorateLibPath/', ...opts })
        }
      ]
  return babel.transformSync(code, {
    presets: ['@babel/react', '@babel/env'],
    plugins: [...prePlugins, ['@babel/plugin-proposal-decorators', { legacy: true }]]
  }).code
}

const runCode = (code, opts?: Parameters<typeof createDecorateReactVisitor>[0], plugins?) => {
  const outputCode = visit(code, opts, plugins)
  const exports = {}
  const mod = new Module(__filename, null)
  mod.exports = exports

  const script = new Function('exports', 'module', 'require', outputCode)
  script(exports, mod, Module.createRequire(__filename))

  return mod.exports
}

const runInjectIdCode = (code) => {
  let id = 1

  return runCode(code, {}, [
    {
      visitor: {
        Program(path) {
          const result = createDecorateReactVisitor({
            decorateLibPath: nps.join(__dirname, 'lib/inject/react.js'),
            transformData: () => `id-react-${id++}`,
            detectFunctionComponent: false
          })
          const result2 = createDecorateReactTopJSXVistor({
            decorateLibPath: nps.join(__dirname, 'lib/inject/jsx.js'),
            transformData: () => `id-jsx-${id++}`,
            detectClassComponent: false
          })

          result.Program(path)
          result2.Program(path)
        }
      }
    }
  ])
}

describe('createDecorateReactVisitor-inject', function () {
  it('should injectId', function () {
    let id = 1
    const { Button2, Button } = runCode(
      `
import * as React from 'react'
export const Button = (props) => <div {...props}></div>
export class Button2 extends React.Component {
    render() {
        return <div {...this.props}>hahaha</div>
    }

}`,
      {
        decorateLibPath: nps.join(__dirname, 'lib/inject/react.js'),
        transformData: (data, path, babelPluginPass) => {
          return `id-${id++}`
        }
      }
    )

    const buttonRender = TestRenderer.create(<Button />)
    const button2Render = TestRenderer.create(<Button2 />)

    expect(buttonRender.toJSON()).toMatchInlineSnapshot(`
      <div
        data-id="id-1"
      />
    `)
    expect(button2Render.toJSON()).toMatchInlineSnapshot(`
      <div
        data-id="id-2"
      >
        hahaha
      </div>
    `)
  })

  it('should injectId combine', function () {
    const { Button2, Button } = runInjectIdCode(
      `
import * as React from 'react'
export const Button = (props) => <div></div>
export class Button2 extends React.Component {
    render() {
        return <div >hahaha</div>
    }

}`
    )

    const buttonRender = TestRenderer.create(<Button />)
    const button2Render = TestRenderer.create(<Button2 />)

    expect(buttonRender.toJSON()).toMatchInlineSnapshot(`
      <div
        data-id="id-jsx-2"
      />
    `)
    expect(button2Render.toJSON()).toMatchInlineSnapshot(`
      <div
        data-id="id-react-1"
      >
        hahaha
      </div>
    `)
  })
})
