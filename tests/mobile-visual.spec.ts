import { expect, test } from '@playwright/test'

type OverflowResult = {
  viewportWidth: number
  documentWidth: number
  offenders: Array<{
    element: string
    left: number
    right: number
    width: number
  }>
}

const targets = (process.env.MOBILE_QA_TARGETS || '/')
  .split(',')
  .map((target) => target.trim())
  .filter(Boolean)

function targetName(target: string) {
  if (target === '/') return 'onboarding'

  return target
    .replace(/^https?:\/\/[^/]+/i, '')
    .replace(/[?#].*$/, '')
    .replace(/^\/+|\/+$/g, '')
    .replace(/[^a-z0-9_-]+/gi, '-') || 'page'
}

for (const target of targets) {
  test(`${targetName(target)} fits the phone viewport`, async ({ page }, testInfo) => {
    await page.goto(target, { waitUntil: 'domcontentloaded' })
    await page.waitForLoadState('load')
    await page.waitForTimeout(1_000)

    const viewport = await page.locator('meta[name="viewport"]').getAttribute('content')
    expect(viewport).toContain('width=device-width')
    expect(viewport).toContain('maximum-scale=1')
    expect(viewport).toContain('user-scalable=no')

    const input = page.locator('input:not([type="hidden"]):not([type="file"]), textarea').first()
    if (await input.count()) {
      const fontSize = await input.evaluate((element) => Number.parseFloat(getComputedStyle(element).fontSize))
      expect(fontSize, 'Focused controls must be at least 16px to prevent iOS input zoom').toBeGreaterThanOrEqual(16)
      await input.focus()
      await page.waitForTimeout(250)
    }

    const overflow = await page.evaluate<OverflowResult>(() => {
      const viewportWidth = document.documentElement.clientWidth
      const tolerance = 1
      const offenders = Array.from(document.body.querySelectorAll<HTMLElement>('*'))
        .map((element) => {
          const rect = element.getBoundingClientRect()
          return {
            element: `${element.tagName.toLowerCase()}${element.id ? `#${element.id}` : ''}${
              element.classList.length ? `.${Array.from(element.classList).join('.')}` : ''
            }`,
            left: Math.round(rect.left * 10) / 10,
            right: Math.round(rect.right * 10) / 10,
            width: Math.round(rect.width * 10) / 10
          }
        })
        .filter(({ width, left, right }) => width > 0 && (left < -tolerance || right > viewportWidth + tolerance))
        .slice(0, 12)

      return {
        viewportWidth,
        documentWidth: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth),
        offenders
      }
    })

    expect(overflow.documentWidth, JSON.stringify(overflow, null, 2)).toBeLessThanOrEqual(overflow.viewportWidth + 1)
    expect(overflow.offenders, JSON.stringify(overflow, null, 2)).toEqual([])

    const screenshot = testInfo.outputPath(`${targetName(target)}.png`)
    await page.screenshot({ path: screenshot, fullPage: true })
    await testInfo.attach('mobile-page', { path: screenshot, contentType: 'image/png' })
  })
}
