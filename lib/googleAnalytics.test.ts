import { describe, expect, it } from 'vitest'
import { buildGtagScripts, isValidMeasurementId, toGtagEvent, toGtagPageviewEvent } from './googleAnalytics'

describe('isValidMeasurementId', () => {
  it('accepts GA4 measurement IDs', () => {
    expect(isValidMeasurementId('G-AB12CD34EF')).toBe(true)
  })

  it.each([['UA-12345678-1'], ['GTM-ABC123'], ['g-ab12cd34ef'], ["G-AB12');alert(1);//"], [''], [null]])(
    'rejects %s',
    (id) => {
      expect(isValidMeasurementId(id)).toBe(false)
    }
  )
})

describe('buildGtagScripts', () => {
  it('builds a keyed async loader and init for a valid ID', () => {
    const [loader, init] = buildGtagScripts('G-AB12CD34EF')

    expect(loader).toEqual({
      key: 'wt-ga-loader',
      src: 'https://www.googletagmanager.com/gtag/js?id=G-AB12CD34EF',
      async: true
    })
    expect(init.key).toBe('wt-ga-init')
    expect(init.children).toContain("gtag('config','G-AB12CD34EF',{send_page_view:false});")
  })

  it('emits nothing for an ID that could break out of the script', () => {
    expect(buildGtagScripts("G-AB12');alert(1);//")).toEqual([])
  })
})

describe('toGtagEvent', () => {
  it('maps a form submission to the recommended generate_lead event', () => {
    expect(toGtagEvent('form_submit', { formId: 'contact-1' })).toEqual([
      'event',
      'generate_lead',
      { form_id: 'contact-1' }
    ])
  })

  it('forwards CTA and WhatsApp clicks under their own names', () => {
    expect(toGtagEvent('cta_click', { ctaId: 'hero' })).toEqual(['event', 'cta_click', { cta_id: 'hero' }])
    expect(toGtagEvent('whatsapp_click')).toEqual(['event', 'whatsapp_click', {}])
  })

  it('leaves scroll depth to GA itself', () => {
    expect(toGtagEvent('scroll_depth')).toBeNull()
  })
})

describe('toGtagPageviewEvent', () => {
  it('builds a page_view event with the page path', () => {
    expect(toGtagPageviewEvent('/about')).toEqual(['event', 'page_view', { page_path: '/about' }])
  })
})
