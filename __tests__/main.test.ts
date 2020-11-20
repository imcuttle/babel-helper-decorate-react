/**
 * @file main
 * @author imcuttle
 * @date 2018/4/4
 */
import * as nps from 'path'
import createDecorateReactVisitor from '../src'
import * as babel from '@babel/core'
import { fixture } from './helper'

const visit = (code, opts?) => {
  return babel.transformSync(code, {
    plugins: [
      {
        manipulateOptions(opts: any, parserOpts: any): void {
          parserOpts.plugins.push('jsx', 'decorate')
        },
        visitor: createDecorateReactVisitor({ decorateLibPath: '/decorateLibPath/', ...opts })
      }
    ]
  }).code
}

const visitFile = (name, opts: Parameters<typeof createDecorateReactVisitor>[0]) => {
  return babel.transformFileSync(fixture(name), {
    plugins: [
      {
        manipulateOptions(opts: any, parserOpts: any): void {
          parserOpts.plugins.push('jsx')
        },
        visitor: createDecorateReactVisitor({ decorateLibPath: '/decorateLibPath/', ...opts })
      }
    ]
  }).code
}

describe('createDecorateReactVisitor', function () {
  it('button.js', function () {
    expect(
      visitFile(`button.js`, {
        transformData: (data, path, pass, helper) => {
          return nps.relative(fixture(), pass.filename)
        }
      })
    ).toMatchInlineSnapshot(`
      "import _default from \\"/decorateLibPath/\\";
      import * as React from 'react';
      export default @_default(\\"button.js\\")
      class Button extends React.Component {
        render() {
          return null;
        }

      }"
    `)
  })

  it('Function Component', function () {
    expect(
      visit(
        `const Button = () => {};
const Button2 = () => {};
`
      )
    ).toMatchInlineSnapshot(`
      "const Button = () => {};

      const Button2 = () => {};"
    `)
  })

  it('Complex', function () {
    expect(
      visit(`const fn = (a) => a
export const x = fn(class Button extends React.Component {
  render() {
    return null;
  }
})


const n = () => {
  return <div></div>
}

export const xx = n(function b() {
})

export default class XButton extends Component {
  render() {
    return null;
  }
}
`)
    ).toMatchInlineSnapshot(`
      "import _default from \\"/decorateLibPath/\\";

      const fn = a => a;

      export const x = fn(_default(null)(class Button extends React.Component {
        render() {
          return null;
        }

      }));

      const n = _default(null)(() => {
        return <div></div>;
      });

      export const xx = n(function b() {});
      export default @_default(null)
      class XButton extends Component {
        render() {
          return null;
        }

      }"
    `)
  })
})
