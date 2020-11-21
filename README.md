# babel-helper-decorate-react

[![Build status](https://img.shields.io/travis/imcuttle/babel-helper-decorate-react/master.svg?style=flat-square)](https://travis-ci.org/imcuttle/babel-helper-decorate-react)
[![Test coverage](https://img.shields.io/codecov/c/github/imcuttle/babel-helper-decorate-react.svg?style=flat-square)](https://codecov.io/github/imcuttle/babel-helper-decorate-react?branch=master)
[![NPM version](https://img.shields.io/npm/v/babel-helper-decorate-react.svg?style=flat-square)](https://www.npmjs.com/package/babel-helper-decorate-react)
[![NPM Downloads](https://img.shields.io/npm/dm/babel-helper-decorate-react.svg?style=flat-square&maxAge=43200)](https://www.npmjs.com/package/babel-helper-decorate-react)
[![Prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://prettier.io/)
[![Conventional Commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-yellow.svg?style=flat-square)](https://conventionalcommits.org)

> Babel Helper for custom decorator for React Component

### Input

```jsx
export const Button = () => {
  return <button>button</button>
}

// decorate-enable-next-line { "argument": 123 }
export default class ButtonDefault extends React.Component {
  // ...
}

// decorate-disable-next-line
export class Button2 extends React.Component {
  // ...
}
```

### Output

```jsx
import hoc from '/your/hoc/path'

export const Button = hoc()(() => {
  return <button>button</button>
})

// decorate-enable-next-line { "argument": 123 }
export default
@hoc({ argument: 123 })
class ButtonDefault extends React.Component {
  // ...
}

// decorate-disable-next-line
export class Button2 extends React.Component {
  // ...
}
```

## Installation

```bash
npm install babel-helper-decorate-react
# or use yarn
yarn add babel-helper-decorate-react
```

## Usage

```javascript
import babel from '@babel/core'
import createDecorateReactVisitor from 'babel-helper-decorate-react'

babel.transform(code, {
  plugins: [
    {
      visitor: createDecorateReactVisitor({
        // ...opts
      })
    }
  ]
})
```

## API

### `createDecorateReactVisitor(options?)`

#### `Options`

extends [createDecorateVisitor#Options](#options2)

##### `detectClassComponent`

Should detect react class component?

- **Type: ** `boolean`
- **Default: ** `true`

##### `detectFunctionComponent`

Should detect react function component?

- **Type: ** `boolean`
- **Default: ** `true`

##### `reactClassMemberTokens`

The MemberExpression or Identifier tokens for Detecting React class component

- **Type: ** `string[]`
- **Default: ** `['React.Profiler', 'React.Suspense', 'React.StrictMode', 'React.Fragment', 'Profiler', 'Suspense', 'StrictMode', 'Fragment']`

##### `reactClassSuperTokens`

The super class tokens for Detecting React class component

- **Type: ** `string[]`
- **Default: ** `['React.Component', 'React.PureComponent', 'Component', 'PureComponent']`

##### `reactClassCallTokens`

The CallExpression tokens for Detecting React class component

- **Type: ** `string[]`
- **Default: ** `['React.createRef', 'React.createFactory', 'React.createElement', 'React.cloneElement', 'createRef', 'createFactory', 'createElement', 'cloneElement']`

##### `reactClassMethodsTokens`

The ClassMethod tokens for Detecting React class component

- **Type: ** `string[]`
- **Default: ** `['componentDidUpdate', 'componentDidCatch', 'componentDidMount', 'componentWillMount', 'componentWillReceiveProps', 'componentWillUnmount', 'componentWillUpdate', 'UNSAFE_componentWillMount', 'UNSAFE_componentWillReceiveProps', 'UNSAFE_componentWillUpdate', 'getSnapshotBeforeUpdate', 'shouldComponentUpdate', 'render']`

##### `reactFunctionCallTokens`

The ClassMethod tokens for Detecting React function component

- **Type: ** `string[]`
- **Default: ** `['React.createRef', 'React.createFactory', 'React.createElement', 'React.cloneElement', 'createRef', 'createFactory', 'createElement', 'cloneElement', 'React.useCallback', 'React.useEffect', 'React.useMemo', 'React.useImperativeHandle', 'React.useLayoutEffect', 'React.useReducer', 'React.useContext', 'React.useState', 'React.useDebugValue', 'React.useRef', 'useCallback', 'useEffect', 'useMemo', 'useImperativeHandle', 'useLayoutEffect', 'useReducer', 'useContext', 'useState', 'useDebugValue', 'useRef']`

### createDecorateVisitor

#### Options

##### `prefix`

Comment prefix for enable or disable decoration like eslint comment

```js
/* decorate-disable */
/* decorate-enable */

// decorate-disable-next-line
// decorate-disable-line

// decorate-enable-next-line
// decorate-enable-line
```

- **Type: ** `string`
- **Default: ** `'decorate'`

##### `decorateLibPath`

The Path of decoration library.

- **Type: ** `string`
- **Default: ** `null`

##### `moduleInteropPath`

You may not use it.

- **Type: ** `string | null`
- **Default: ** `require.resolve('module-interop')`

##### `defaultEnable`

The decoration's status by default

you can use `// decorate-enable-next-line` to enable when is disabled by default

- **Type: ** `boolean`
- **Default: ** `true`

## Contributing

- Fork it!
- Create your new branch:  
  `git checkout -b feature-new` or `git checkout -b fix-which-bug`
- Start your magic work now
- Make sure npm test passes
- Commit your changes:  
  `git commit -am 'feat: some description (close #123)'` or `git commit -am 'fix: some description (fix #123)'`
- Push to the branch: `git push`
- Submit a pull request :)

## Authors

This library is written and maintained by imcuttle, <a href="mailto:imcuttle@163.com">imcuttle@163.com</a>.

## License

MIT - [imcuttle](https://github.com/imcuttle) 🐟
