let mobx

try {
  mobx = require('mobx-react')
} catch (e) {
  if (e.code === 'MODULE_NOT_FOUND') {
    if (!global.__mobx_decorate_) {
      global.__mobx_decorate_ = true
      console.error('Find mobx-react module failed, will use mobx-react-lite')
      console.error(e)
    }
    mobx = require('mobx-react-lite')
  }
}

module.exports = () => {
  return (Component) => {
    return mobx.observer(Component)
  }
}
