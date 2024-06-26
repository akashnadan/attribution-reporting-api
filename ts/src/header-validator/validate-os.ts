import { Context, ValidationResult } from './context'
import { Maybe } from './maybe'
import * as validate from './validate'
import { param } from './validate-structured'
import {
  InnerList,
  Item,
  List,
  parseList,
  serializeList,
} from 'structured-headers'

export type OsItem = {
  url: URL
  debugReporting: boolean
}

function parseItem(ctx: Context, member: InnerList | Item): Maybe<OsItem> {
  if (typeof member[0] !== 'string') {
    ctx.warning('ignored, must be a string')
    return Maybe.None
  }

  let url: URL
  try {
    url = new URL(member[0])
  } catch {
    ctx.warning('ignored, must contain a valid URL')
    return Maybe.None
  }

  return param.struct(ctx, member[1], {
    url: () => Maybe.some(url),
    debugReporting: param.field(
      'debug-reporting',
      (ctx, value) => {
        if (typeof value !== 'boolean') {
          ctx.warning('ignored, must be a boolean')
          value = false
        }
        return Maybe.some(value)
      },
      false
    ),
  })
}

export function validateOsRegistration(
  str: string
): [ValidationResult, Maybe<OsItem[]>] {
  const ctx = new Context()

  let list
  try {
    list = parseList(str)
  } catch (err) {
    const msg = err instanceof Error ? err.toString() : 'unknown error'
    return [ctx.finish(msg), Maybe.None]
  }

  const items = validate.array(
    ctx,
    list.entries(),
    parseItem,
    validate.ItemErrorAction.ignore
  )
  return [ctx.finish(), items]
}

export function serializeOsRegistration(items: OsItem[]): string {
  const list: List = []
  for (const item of items) {
    list.push([
      item.url.toString(),
      new Map([['debug-reporting', item.debugReporting]]),
    ])
  }
  return serializeList(list)
}
