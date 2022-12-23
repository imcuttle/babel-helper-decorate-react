import * as React from 'react'
const Button = () => <div></div>
export const ButtonExport = () => <div></div>

export default class ButtonExportDefault extends React.Component {
  render() {
    const renderC = () => <div></div>

    return <div>{renderC()}</div>
  }
}

/* mobx-observer-disable */
export function Test() {
  return (
    <div>
      <Button />
      <ButtonExport />
      <ButtonExportDefault />
    </div>
  )
}
