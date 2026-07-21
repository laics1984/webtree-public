import { describe, expect, it } from 'vitest'
import { parseVideoEmbed } from './videoEmbed'

describe('parseVideoEmbed', () => {
  it('parses a YouTube watch URL', () => {
    expect(parseVideoEmbed('https://www.youtube.com/watch?v=A3l6YYkXzzg')).toMatchObject({
      provider: 'youtube',
      videoId: 'A3l6YYkXzzg',
      embedUrl: 'https://www.youtube.com/embed/A3l6YYkXzzg',
      thumbnailUrl: 'https://i.ytimg.com/vi/A3l6YYkXzzg/hqdefault.jpg',
    })
  })

  it('parses a youtu.be short URL', () => {
    expect(parseVideoEmbed('https://youtu.be/A3l6YYkXzzg?t=10')?.embedUrl).toBe(
      'https://www.youtube.com/embed/A3l6YYkXzzg'
    )
  })

  it('parses a /shorts/ URL and an already-embed URL (with extra params)', () => {
    expect(parseVideoEmbed('https://www.youtube.com/shorts/A3l6YYkXzzg')?.videoId).toBe(
      'A3l6YYkXzzg'
    )
    expect(
      parseVideoEmbed('https://www.youtube.com/embed/A3l6YYkXzzg?si=zbcCeWcpq7Cwf8W1')?.videoId
    ).toBe('A3l6YYkXzzg')
  })

  it('extracts the src from a pasted <iframe> snippet', () => {
    const iframe =
      '<iframe width="560" height="315" src="https://www.youtube.com/embed/A3l6YYkXzzg" allowfullscreen></iframe>'
    expect(parseVideoEmbed(iframe)?.embedUrl).toBe(
      'https://www.youtube.com/embed/A3l6YYkXzzg'
    )
  })

  it('parses Vimeo URLs (no derivable thumbnail)', () => {
    expect(parseVideoEmbed('https://vimeo.com/123456789')).toMatchObject({
      provider: 'vimeo',
      videoId: '123456789',
      embedUrl: 'https://player.vimeo.com/video/123456789',
      thumbnailUrl: null,
    })
    expect(parseVideoEmbed('https://player.vimeo.com/video/123456789')?.provider).toBe('vimeo')
  })

  it('accepts an unknown http(s) embed URL as a raw embed', () => {
    expect(parseVideoEmbed('https://example.com/player/abc')).toMatchObject({
      provider: 'other',
      embedUrl: 'https://example.com/player/abc',
    })
  })

  it('rejects empty and non-URL input', () => {
    expect(parseVideoEmbed('')).toBeNull()
    expect(parseVideoEmbed(null)).toBeNull()
    expect(parseVideoEmbed('not a url')).toBeNull()
  })
})
