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

  // `video` is the schema's only iframe primitive, so a Google Map reaches the
  // renderer through this same function — locations-map-cards and the `map`
  // sections both write a Maps URL into `content.src`. The `other` fallback is
  // what frames them: tighten it to a player whitelist and every map on every
  // published site silently disappears. These cases exist to make that break
  // loudly here instead.
  describe('map embeds ride the same path', () => {
    const PB =
      'https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d3983.53!2d101.62!3d3.21' +
      '!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31cc466e0167ea45%3A0xa29b85f66d526668' +
      '!2sBright+Kids+HQ!5e0!3m2!1sen!2smy!4v1416634492186'

    it('frames a Google Maps "Embed a map" URL unchanged', () => {
      expect(parseVideoEmbed(PB)).toMatchObject({
        provider: 'other',
        embedUrl: PB,
        // No poster, so VideoBlock renders the iframe directly rather than a
        // click-to-load facade — a map must be live on arrival.
        thumbnailUrl: null,
      })
    })

    it('frames the keyless output=embed form the generator writes', () => {
      const url = 'https://maps.google.com/maps?q=Metro+Prima+Kepong&output=embed'
      expect(parseVideoEmbed(url)?.embedUrl).toBe(url)
    })

    it('extracts the src from a pasted Google Maps <iframe> snippet', () => {
      expect(
        parseVideoEmbed(`<iframe src="${PB}" width="100%" height="250"></iframe>`)?.embedUrl
      ).toBe(PB)
    })

    it('frames an OpenStreetMap export widget', () => {
      const url = 'https://www.openstreetmap.org/export/embed.html?bbox=1%2C2%2C3%2C4'
      expect(parseVideoEmbed(url)?.provider).toBe('other')
    })
  })

  it('rejects empty and non-URL input', () => {
    expect(parseVideoEmbed('')).toBeNull()
    expect(parseVideoEmbed(null)).toBeNull()
    expect(parseVideoEmbed('not a url')).toBeNull()
  })
})
