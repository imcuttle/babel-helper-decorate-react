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
          parserOpts.plugins.push('jsx', 'decorators-legacy')
        },
        visitor: createDecorateReactVisitor({
          moduleInteropPath: null,
          decorateLibPath: '/decorateLibPath/',
          ...opts
        })
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
      "import _decorate from \\"/decorateLibPath/\\";
      import * as React from 'react';
      export default @_decorate(\\"button.js\\")
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

    expect(
      visit(
        `const useXX = () => {
          React.useEffect(() => {}, [])
        };
const RectArea = function(width, height) {
  return <div></div>;
};

const RectArea2 = function() {
  return <div></div>;
};

function RectArea3() {
  return <div></div>;
};

const Button2 = () => {
  return <div></div>
};

const Button3 = React.memo(() => {
  return <div></div>
});

const useButton2 = () => {
  return <div></div>
};

export default function AppDefault() {
    return <div></div>
}

export function App() {
    return <div></div>
}
`
      )
    ).toMatchInlineSnapshot(`
      "import _decorate from \\"/decorateLibPath/\\";

      const useXX = () => {
        React.useEffect(() => {}, []);
      };

      const RectArea = _decorate(null)(function (width, height) {
        return <div></div>;
      });

      const RectArea2 = _decorate(null)(function () {
        return <div></div>;
      });

      const RectArea3 = _decorate(null)(function RectArea3() {
        return <div></div>;
      });

      ;

      const Button2 = _decorate(null)(() => {
        return <div></div>;
      });

      const Button3 = React.memo(_decorate(null)(() => {
        return <div></div>;
      }));

      const useButton2 = () => {
        return <div></div>;
      };

      const AppDefault = _decorate(null)(function AppDefault() {
        return <div></div>;
      });

      export default AppDefault;
      export const App = _decorate(null)(function App() {
        return <div></div>;
      });"
    `)
  })

  it('Eval Data', function () {
    expect(
      visit(
        `const Button = () => <div></div>;
    `,
        {
          transformData(_, __, ___, helper) {
            return helper.eval('module')
          }
        }
      )
    ).toMatchInlineSnapshot(`
      "import _decorate from \\"/decorateLibPath/\\";

      const Button = _decorate(module)(() => <div></div>);"
    `)

    expect(
      visit(
        `const Button = () => <div></div>;
    `,
        {
          transformData(_, __, ___, helper) {
            return {
              module: helper.eval('module'),
              modules: [helper.eval('module'), helper.eval('module')]
            }
          }
        }
      )
    ).toMatchInlineSnapshot(`
      "import _decorate from \\"/decorateLibPath/\\";

      const Button = _decorate({
        \\"module\\": module,
        \\"modules\\": [module, module]
      })(() => <div></div>);"
    `)
  })

  it('Decorate Component', function () {
    expect(
      visit(
        `export default (meta) => {
      return () => {
        return React.forwardRef(() => {
          React.useEffect(() => {
          }, []);
        });
      }
      }`,
        { detectScopeDepth: 1 }
      )
    ).toMatchInlineSnapshot(`
      "export default (meta => {
        return () => {
          return React.forwardRef(() => {
            React.useEffect(() => {}, []);
          });
        };
      });"
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


export default @noop class XButton extends Component {
  render() {
    return null;
  }
}
`)
    ).toMatchInlineSnapshot(`
      "import _decorate from \\"/decorateLibPath/\\";

      const fn = a => a;

      export const x = fn(_decorate(null)(class Button extends React.Component {
        render() {
          return null;
        }

      }));

      const n = () => {
        return <div></div>;
      };

      export const xx = n(function b() {});
      export default @noop
      @_decorate(null)
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
      "import _decorate from \\"/decorateLibPath/\\";

      const Button = _decorate(null)(() => {
        return <div>hh</div>;
      });

      const Button2 = _decorate(null)(() => {
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
      "import _decorate from \\"/decorateLibPath/\\";

      const Button = () => {
        return <div>hh</div>;
      }; // react-enable-next-line {\\"id\\": \\"tmp\\"}


      const Button2 = _decorate({
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
      "import _decorate from \\"/decorateLibPath/\\";

      const Button = () => {
        // jsx-enable-next-line [1, 2]
        return _decorate([1, 2])(<div>
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
