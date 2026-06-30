import { cloudinaryUrl, cn, getInitials, formatName, formatRelativeTime, textAlign, getApiError } from './utils'

const CLOUDINARY_BASE = 'https://res.cloudinary.com/demo/image/upload'

describe('cloudinaryUrl', () => {
  it('returns undefined for null', () => {
    expect(cloudinaryUrl(null, 'f_auto')).toBeUndefined()
  })

  it('returns undefined for undefined', () => {
    expect(cloudinaryUrl(undefined, 'f_auto')).toBeUndefined()
  })

  it('returns original url when not a Cloudinary url', () => {
    const url = 'https://example.com/image.jpg'
    expect(cloudinaryUrl(url, 'f_auto')).toBe(url)
  })

  it('injects transforms after /upload/', () => {
    const url = `${CLOUDINARY_BASE}/v1234/sample.jpg`
    expect(cloudinaryUrl(url, 'f_auto,q_auto,w_400')).toBe(
      `${CLOUDINARY_BASE}/f_auto,q_auto,w_400/v1234/sample.jpg`
    )
  })

  it('does not double-inject if transforms already present', () => {
    const url = `${CLOUDINARY_BASE}/f_auto,q_auto,w_400/v1234/sample.jpg`
    expect(cloudinaryUrl(url, 'f_auto,q_auto,w_400')).toBe(url)
  })

  it('injects different transforms even when some are already present', () => {
    const url = `${CLOUDINARY_BASE}/f_auto/v1234/sample.jpg`
    expect(cloudinaryUrl(url, 'f_auto,q_auto,w_400')).toBe(
      `${CLOUDINARY_BASE}/f_auto,q_auto,w_400/f_auto/v1234/sample.jpg`
    )
  })
})

describe('cn', () => {
  it('joins class strings', () => {
    expect(cn('a', 'b', 'c')).toBe('a b c')
  })

  it('filters out undefined, null, and false', () => {
    expect(cn('a', undefined, null, false, 'b')).toBe('a b')
  })

  it('returns empty string when all values are falsy', () => {
    expect(cn(undefined, null, false)).toBe('')
  })
})

describe('getInitials', () => {
  it('returns uppercased first initial only when no last name', () => {
    expect(getInitials('alice')).toBe('A')
  })

  it('returns both initials uppercased', () => {
    expect(getInitials('alice', 'smith')).toBe('AS')
  })

  it('handles null lastName', () => {
    expect(getInitials('Bob', null)).toBe('B')
  })
})

describe('formatName', () => {
  it('returns first name only when no last name', () => {
    expect(formatName('Alice')).toBe('Alice')
  })

  it('returns first name only when lastName is null', () => {
    expect(formatName('Alice', null)).toBe('Alice')
  })

  it('combines first and last name with a space', () => {
    expect(formatName('Alice', 'Smith')).toBe('Alice Smith')
  })
})

describe('formatRelativeTime', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-06-15T12:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns "just now" for under a minute ago', () => {
    expect(formatRelativeTime('2024-06-15T11:59:30Z')).toBe('just now')
  })

  it('returns minutes ago', () => {
    expect(formatRelativeTime('2024-06-15T11:45:00Z')).toBe('15m ago')
  })

  it('returns hours ago', () => {
    expect(formatRelativeTime('2024-06-15T10:00:00Z')).toBe('2h ago')
  })

  it('returns days ago', () => {
    expect(formatRelativeTime('2024-06-12T12:00:00Z')).toBe('3d ago')
  })

  it('returns weeks ago', () => {
    expect(formatRelativeTime('2024-06-01T12:00:00Z')).toBe('2w ago')
  })

  it('returns months ago', () => {
    expect(formatRelativeTime('2024-04-15T12:00:00Z')).toBe('2mo ago')
  })

  it('returns years ago', () => {
    expect(formatRelativeTime('2022-06-15T12:00:00Z')).toBe('2y ago')
  })
})

describe('textAlign', () => {
  it('returns text-center for 15 words or fewer', () => {
    expect(textAlign('one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen')).toBe('text-center')
  })

  it('returns text-left for more than 15 words', () => {
    expect(textAlign('one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen')).toBe('text-left')
  })

  it('returns text-center for a short title', () => {
    expect(textAlign('A lovely book')).toBe('text-center')
  })
})

describe('getApiError', () => {
  it('returns the server-provided error string', () => {
    expect(getApiError({ response: { data: { error: 'Email already in use' } } })).toBe('Email already in use')
  })

  it('returns session expired message for 401 with no error string', () => {
    expect(getApiError({ response: { status: 401, data: {} } })).toBe('Your session has expired. Please sign in again.')
  })

  it('returns permission error for 403', () => {
    expect(getApiError({ response: { status: 403, data: {} } })).toBe("You don't have permission to do that.")
  })

  it('returns not found for 404', () => {
    expect(getApiError({ response: { status: 404, data: {} } })).toBe('Not found.')
  })

  it('returns rate limit message for 429', () => {
    expect(getApiError({ response: { status: 429, data: {} } })).toBe('Too many requests. Please try again later.')
  })

  it('returns server error for 500', () => {
    expect(getApiError({ response: { status: 500, data: {} } })).toBe('Server error. Please try again.')
  })

  it('returns network error when there is a request but no response', () => {
    expect(getApiError({ request: {} })).toBe('Network error. Please check your connection.')
  })

  it('returns fallback for unknown error shapes', () => {
    expect(getApiError(new Error('boom'))).toBe('Something went wrong. Please try again.')
    expect(getApiError('a string')).toBe('Something went wrong. Please try again.')
    expect(getApiError(null)).toBe('Something went wrong. Please try again.')
  })
})
