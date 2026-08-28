import { it } from 'vitest'
import { readFileSync, writeFileSync } from 'node:fs'
import { buildResponsiveStylesheet } from '~/lib/responsiveRuntime'
const SP = process.env.SP!
it('dump', () => {
  const out: string[] = []
  for (const arch of ['classic', 'centered-stack', 'floating-pill']) {
    const header = JSON.parse(readFileSync(`${SP}/header-${arch}.json`, 'utf8'))
    out.push(`########## ${arch} ##########`,
             buildResponsiveStylesheet({ headerSchema: [header] }) || '(EMPTY)')
  }
  writeFileSync(`${SP}/responsive-out.css`, out.join('\n\n'))
})
