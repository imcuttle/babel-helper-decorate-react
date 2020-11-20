import * as babel from '@babel/core'

import parseCommentsRanges, { DisableRange, EnableRange } from '../src/parseCommentsRanges'

const parse = (code, options) => {
  // @ts-ignore
  const { comments } = babel.parseSync(code, { comments: true })

  return parseCommentsRanges(comments, options)
}

describe('parseCommentsRanges - lines', () => {
  it('should comment line', function () {
    expect(
      parse(
        `
const a = 'a';
const x = 2; // eslint-disable-line 1
const y = 1; // eslint-disable-line 2
const z = 3; // eslint-disable-line 3

const xx = () => {
  const xxx = 3; // eslint-disable-line 4

  // eslint-disable-next-line 5
  return 1 + 2;
}

`,
        {
          prefix: 'eslint',
          parseArgument: (text) => text
        }
      )
    ).toEqual([
      new DisableRange(3, 3, '1'),
      new DisableRange(4, 4, '2'),
      new DisableRange(5, 5, '3'),
      new DisableRange(8, 8, '4'),
      new DisableRange(11, 11, '5')
    ])
  })

  it('should ignore un valid comment line', function () {
    expect(
      parse(
        `
const a = 'a';  //eslint-disable-line
const x = 2; // eslint-disable-line1

//eslint-disable-next-line 5
1 + 2;

// eslint-disable-next-line5
1 + 2;

// eslint-disable-next-line
1 + 2;
`,
        {
          prefix: 'eslint',
          parseArgument: (text) => text
        }
      )
    ).toEqual([new DisableRange(12, 12, '')])
  })
})

describe('parseCommentsRanges - blocks', () => {
  it('should comment blocks', function () {
    expect(
      parse(
        `
/* eslint-disable 1 */
const x = 2;
/* eslint-enable */

/* eslint-disable 2 */
const xx = () => {
  // eslint-disable-next-line 3
  return 1 + 2;
}
`,
        {
          prefix: 'eslint',
          parseArgument: (text) => text
        }
      )
    ).toEqual([
      new DisableRange(2, 3, '1'),
      new EnableRange(4, 5, ''),
      new DisableRange(6, 8, '2'),
      new DisableRange(9, 9, ['2', '3']),
      new DisableRange(6, Infinity, '2')
    ])
  })

  it('should comment blocks & enable line', function () {
    expect(
      parse(
        `
/* eslint-disable 1 */
const x = 2;
/* eslint-enable */

/* eslint-disable 2 */
const xx = () => {
  // eslint-enable-next-line 3
  return 1 + 2;
}
`,
        {
          prefix: 'eslint',
          parseArgument: (text) => text
        }
      )
    ).toEqual([
      new DisableRange(2, 3, '1'),
      new EnableRange(4, 5, ''),
      new DisableRange(6, 8, '2'),
      new EnableRange(9, 9, '3'),
      new DisableRange(6, Infinity, '2')
    ])
  })
})
