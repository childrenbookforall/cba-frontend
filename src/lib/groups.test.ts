import { flattenGroups } from './groups'
import type { Group } from '../types/api'

function makeGroup(id: string, name: string, children?: Group[]): Group {
  return { id, name, slug: id, children }
}

describe('flattenGroups', () => {
  it('returns empty array for undefined', () => {
    expect(flattenGroups(undefined)).toEqual([])
  })

  it('returns empty array for empty list', () => {
    expect(flattenGroups([])).toEqual([])
  })

  it('returns standalone leaf groups as-is', () => {
    const groups = [makeGroup('1', 'Board Books'), makeGroup('2', 'Picture Books')]
    expect(flattenGroups(groups)).toEqual(groups)
  })

  it('returns children of a parent group instead of the parent', () => {
    const child1 = makeGroup('1a', 'Young Readers')
    const child2 = makeGroup('1b', 'Middle Grade')
    const parent = makeGroup('1', 'Fiction', [child1, child2])
    expect(flattenGroups([parent])).toEqual([child1, child2])
  })

  it('mixes parent children and standalone groups in order', () => {
    const child = makeGroup('1a', 'Chapter Books')
    const parent = makeGroup('1', 'Fiction', [child])
    const standalone = makeGroup('2', 'Nonfiction')
    expect(flattenGroups([parent, standalone])).toEqual([child, standalone])
  })

  it('handles a parent with an empty children array as having no leaves', () => {
    const parent = makeGroup('1', 'Fiction', [])
    expect(flattenGroups([parent])).toEqual([])
  })
})
