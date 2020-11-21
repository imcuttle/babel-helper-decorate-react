const React = require('react')
const isComponentClass = require('@rcp/util.iscompclass').default

module.exports = (id) => {
  return (Component) => {
    if (isComponentClass(Component)) {
      return class extends Component {
        render() {
          const element = super.render()
          // console.log(element)
          return React.cloneElement(element, {
            'data-id': id
          })
        }
      }
    } else if (typeof Component === 'function') {
      return React.forwardRef((props, ref) => {
        return React.createElement(Component, {
          'data-id': id,
          ref,
          ...props
        })
      })
    }
    return Component
  }
}
