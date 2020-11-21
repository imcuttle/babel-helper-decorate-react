/**
 * @file main
 * @author imcuttle
 * @date 2018/4/4
 */
import * as nps from 'path'
import createDecorateReactVisitor, { createDecorateReactTopJSXVisitor } from '../src'
import * as babel from '@babel/core'
import { fixture } from './helper'

const visitJSX = (code, opts?: Parameters<typeof createDecorateReactTopJSXVisitor>[0]) => {
  const prePlugins = [
    {
      manipulateOptions(opts: any, parserOpts: any): void {
        parserOpts.plugins.push('jsx', 'decorate')
      },
      visitor: createDecorateReactTopJSXVisitor({
        moduleInteropPath: null,
        decorateLibPath: '/decorateLibPath/',
        ...opts
      })
    }
  ]
  return babel.transformSync(code, {
    plugins: [...prePlugins]
  }).code
}

const visit = (code, opts?: Parameters<typeof createDecorateReactVisitor>[0]) => {
  return babel.transformSync(code, {
    plugins: [
      {
        manipulateOptions(opts: any, parserOpts: any): void {
          parserOpts.plugins.push('jsx', 'decorate')
        },
        visitor: createDecorateReactVisitor({ moduleInteropPath: null, decorateLibPath: '/decorateLibPath/', ...opts })
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
        visitor: createDecorateReactVisitor({ moduleInteropPath: null, decorateLibPath: '/decorateLibPath/', ...opts })
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

  it('Comment control', function () {
    expect(
      visit(
        `
const Button = () => {
  return <div>hh</div>
};
const Button2 = () => {
    const [hh] = React.useState([1, 2])
    return null
};

const Button3 = () => {
    // React.useState([1, 2])
    return null
};

// react-disable-next-line
const Button4 = () => {
    const [hh] = React.useState([1, 2])
    return null
};
`,
        {
          prefix: 'react'
        }
      )
    ).toMatchInlineSnapshot(`
      "import _default from \\"/decorateLibPath/\\";

      const Button = _default(null)(() => {
        return <div>hh</div>;
      });

      const Button2 = _default(null)(() => {
        const [hh] = React.useState([1, 2]);
        return null;
      });

      const Button3 = () => {
        // React.useState([1, 2])
        return null;
      }; // react-disable-next-line


      const Button4 = () => {
        const [hh] = React.useState([1, 2]);
        return null;
      };"
    `)
  })

  it('Comment control defaultEnable=false', function () {
    expect(
      visit(
        `
const Button = () => {
  return <div>hh</div>
};

// react-enable-next-line {"id": "tmp"}
const Button2 = () => {
    const [hh] = React.useState([1, 2])
    return null
};
`,
        {
          prefix: 'react',
          defaultEnable: false,
          parseArgument: (text) => {
            return !text.trim() ? {} : JSON.parse(text)
          }
        }
      )
    ).toMatchInlineSnapshot(`
      "import _default from \\"/decorateLibPath/\\";

      const Button = () => {
        return <div>hh</div>;
      }; // react-enable-next-line {\\"id\\": \\"tmp\\"}


      const Button2 = _default({
        \\"id\\": \\"tmp\\"
      })(() => {
        const [hh] = React.useState([1, 2]);
        return null;
      });"
    `)
  })
})

describe('visitJSX', () => {
  it('should visitJSX', function () {
    expect(
      visitJSX(
        `
const Button = () => {
  // jsx-enable-next-line [1, 2]
  return <div>
  <div>
  <div>hh</div>
</div>
</div>
};

const Button2 = () => {
    const [hh] = React.useState([1, 2])
    return null
};

const Button3 = () => {
    const [hh] = React.useState([1, 2])
    return <>
        <div>????</div>
    </>
};
`,
        {
          prefix: 'jsx',
          parseArgument: (text) => {
            return !text.trim() ? {} : JSON.parse(text)
          }
        }
      )
    ).toMatchInlineSnapshot(`
      "import _default from \\"/decorateLibPath/\\";

      const Button = () => {
        // jsx-enable-next-line [1, 2]
        return _default([1, 2])(<div>
        <div>
        <div>hh</div>
          </div>
        </div>);
      };

      const Button2 = () => {
        const [hh] = React.useState([1, 2]);
        return null;
      };

      const Button3 = () => {
        const [hh] = React.useState([1, 2]);
        return <>
              <div>????</div>
          </>;
      };"
    `)
  })
})
