const React = require('react')
const isComponentClass = require('@rcp/util.iscompclass').default

module.exports = (id) => {
  return (element) => {
    return React.cloneElement(element, {
      'data-id': id
    })
  }
}
