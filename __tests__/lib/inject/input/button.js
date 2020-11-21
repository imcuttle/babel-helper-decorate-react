import * as React from 'react'
const Button = () => <div></div>
export const ButtonExport = () => <div></div>

export default class ButtonExportDefault extends React.Component {
  render() {
    return <div></div>
  }
}

/* decorate-disable */
export function Test() {
  return (
    <div>
      <Button />
      <ButtonExport />
      <ButtonExportDefault />
    </div>
  )
}
