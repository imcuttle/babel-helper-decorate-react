/**
 * @file main
 * @author imcuttle
 * @date 2018/4/4
 */
import createDecorateReactVisitor from '../src'
import * as babel from '@babel/core'

const visit = (code, opts?) => {
  return babel.transformSync(code, {
    plugins: [
      {
        visitor: createDecorateReactVisitor({ decorateLibPath: '/decorateLibPath/', ...opts })
      }
    ]
  }).code
}

describe('createDecorateReactVisitor', function () {
  it('Function Component', function () {
    expect(
      visit(
        `const Button = () => {};
const Button2 = () => {};
`
      )
    ).toMatchInlineSnapshot(`
      "import _default from \\"/decorateLibPath/\\";

      const Button = _default(null)(() => {});

      const Button2 = _default(null)(() => {});"
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


const n = () => {}

export const xx = n(function b() {
})

export default function b() {
}

export function bb() {
}`)
    ).toMatchInlineSnapshot(`
      "import _default from \\"/decorateLibPath/\\";

      const fn = _default(null)(a => a);

      export const x = fn(_default(null)(_default(null)(class Button extends React.Component {
        render() {
          return null;
        }

      })));

      const n = _default(null)(() => {});

      export const xx = n(_default(null)(_default(null)(function b() {})));
      export default function b() {}
      export function bb() {}"
    `)
  })
})
