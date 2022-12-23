import * as babel from '@babel/core'
import * as fs from 'fs'
import * as nps from 'path'
import * as escape from 'escape-string-regexp'
import * as TestRenderer from 'react-test-renderer'
import * as React from 'react'
import * as Module from 'module'

const runCode = (code) => {
  const exports = {}
  const mod = new Module(__filename, null)
  mod.exports = exports

  const script = new Function('exports', 'module', 'require', code)
  script(exports, mod, Module.createRequire(__filename))

  return mod.exports
}

const projectRoot = nps.join(__dirname, '..')

describe('demo', () => {
  const root = nps.join(__dirname, 'lib')

  const cases = fs.readdirSync(root)
  // const cases = ['mobx']
  cases.forEach((name) => {
    // fs.readFileSync(, 'utf8')
    // fs.readFileSync(nps.join(__dirname, name, 'index.js'), 'utf8')
    // code
    const dir = nps.join(root, name, 'input')
    const names = fs.readdirSync(dir)
    names.forEach((subName) => {
      it(`demo-${name}`, () => {
        const output = babel.transformFileSync(nps.join(dir, subName), {
          presets: ['@babel/react', '@babel/env', '@babel/typescript'],
          plugins: [nps.join(root, name, 'index.js'), ['@babel/plugin-proposal-decorators', { legacy: true }]]
        }).code

        const es6Output = babel.transformFileSync(nps.join(dir, subName), {
          presets: ['@babel/typescript'],
          plugins: [nps.join(root, name, 'index.js'), '@babel/plugin-syntax-jsx']
        }).code

        const stripOutput = es6Output.replace(new RegExp(escape(projectRoot), 'g'), '<rootDir>')
        expect(stripOutput).toMatchSnapshot(`DemoEs6Code-${name}-${subName}`)

        expect(output.replace(new RegExp(escape(projectRoot), 'g'), '<rootDir>')).toMatchSnapshot(
          `DemoCode-${name}-${subName}`
        )

        if (require(nps.join(root, name, 'index.js')).runCode !== false) {
          const { Test } = runCode(output)
          const test = TestRenderer.create(<Test />)
          expect(test.toJSON()).toMatchSnapshot(`DemoOutput-${name}-${subName}`)
        }
      })
    })
  })
})
