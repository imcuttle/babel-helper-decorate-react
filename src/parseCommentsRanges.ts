import * as escape from 'escape-string-regexp'

function createCommentRegExps(prefix: string) {
  prefix = escape(prefix)

  return {
    DISABLE_SCOPE: new RegExp(`^ ${prefix}-disable(?:$| (.*)$)`),
    ENABLE_SCOPE: new RegExp(`^ ${prefix}-enable(?:$| (.*)$)`),

    ENABLE_NEXT_LINE: new RegExp(`^ ${prefix}-enable-next-line(?:$| (.*)$)`),
    ENABLE_THIS_LINE: new RegExp(`^ ${prefix}-enable-line(?:$| (.*)$)`),
    DISABLE_NEXT_LINE: new RegExp(`^ ${prefix}-disable-next-line(?:$| (.*)$)`),
    DISABLE_THIS_LINE: new RegExp(`^ ${prefix}-disable-line(?:$| (.*)$)`)
  }
}

export type CreateDisabledScopesOptions = {
  prefix: string
  parseArgument?: (text: string) => any
  composeData?: (a, b) => any
}

export class Range {
  constructor(public start: number, public end: number, public data: any) {}

  has(pos: number) {
    return this.start <= pos && this.end >= pos
  }

  clone() {
    // @ts-ignore
    return new this.constructor(this.start, this.end, this.data)
  }
}

export class EnableRange extends Range {
  public type = 'enable'
}

export class DisableRange extends Range {
  public type = 'disable'
}

export class RangesEater {
  public ranges: Array<EnableRange | DisableRange> = []

  regexps: ReturnType<typeof createCommentRegExps>
  opts: CreateDisabledScopesOptions

  constructor(opts: CreateDisabledScopesOptions) {
    this.regexps = createCommentRegExps(opts.prefix)
    this.opts = {
      composeData: (a, b) => [].concat(a).concat(b),
      ...opts
    }
  }

  get lastRange() {
    return this.ranges[this.ranges.length - 1]
  }

  parseArgument(value: string, reg: RegExp) {
    const result = value.match(reg)
    const ruleText = ((result && result[1]) || '').trim()
    if (this.opts.parseArgument) {
      return this.opts.parseArgument(ruleText)
    }
    return ruleText
  }

  eatBlock(value: string, location: any) {
    if (this.regexps.DISABLE_SCOPE.test(value)) {
      const data = this.parseArgument(value, this.regexps.DISABLE_SCOPE)
      const last = this.lastRange

      if (!last || last.end !== Infinity) {
        this.ranges.push(new DisableRange(location.start.line, Infinity, data))
      } else {
        last.end = location.start.line - 1
        if (last.type === 'enable') {
          this.ranges.push(new DisableRange(location.start.line, Infinity, data))
        } else {
          last.data = this.opts.composeData(last.data, data)
        }
      }
    } else if (this.regexps.ENABLE_SCOPE.test(value)) {
      const data = this.parseArgument(value, this.regexps.ENABLE_SCOPE)

      const last = this.lastRange
      if (!last || last.end !== Infinity) {
        this.ranges.push(new EnableRange(location.start.line, Infinity, data))
      } else {
        last.end = location.start.line - 1
        if (last.type === 'disable') {
          this.ranges.push(new EnableRange(location.start.line, Infinity, data))
        } else {
          last.data = this.opts.composeData(last.data, data)
        }
      }
    }
  }

  eatLine(value: string, location: any) {
    const handleLine = (delta, data, RangeClass) => {
      const last = this.lastRange
      if (!last || last.end !== Infinity) {
        this.ranges.push(new RangeClass(location.start.line + delta, location.end.line + delta, data))
      } else {
        let newData
        if (RangeClass === last.constructor) {
          newData = this.opts.composeData(last.data, data)
        } else {
          newData = data
        }
        const newLast = last.clone()

        last.end = location.start.line
        this.ranges.push(new RangeClass(location.start.line + delta, location.end.line + delta, newData), newLast)
      }
    }

    if (this.regexps.DISABLE_THIS_LINE.test(value)) {
      const data = this.parseArgument(value, this.regexps.DISABLE_THIS_LINE)
      handleLine(0, data, DisableRange)
    } else if (this.regexps.DISABLE_NEXT_LINE.test(value)) {
      const data = this.parseArgument(value, this.regexps.DISABLE_NEXT_LINE)
      handleLine(1, data, DisableRange)
    } else if (this.regexps.ENABLE_THIS_LINE.test(value)) {
      const data = this.parseArgument(value, this.regexps.ENABLE_THIS_LINE)
      handleLine(0, data, EnableRange)
    } else if (this.regexps.ENABLE_NEXT_LINE.test(value)) {
      const data = this.parseArgument(value, this.regexps.ENABLE_NEXT_LINE)
      handleLine(1, data, EnableRange)
    }
  }
}

function parseCommentsRanges(comments: any[], options: CreateDisabledScopesOptions) {
  const eater = new RangesEater(options)
  comments.forEach(({ loc, value, type }) => {
    if (type === 'CommentBlock') {
      eater.eatBlock(value, loc)
    } else if (type === 'CommentLine') {
      eater.eatLine(value, loc)
    }
  })

  return eater.ranges
}

export default parseCommentsRanges
