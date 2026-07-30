import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const projectFile = (path: string) => resolve(import.meta.dirname, '..', path)
const indexHtml = readFileSync(projectFile('index.html'), 'utf8')

describe('social sharing metadata', () => {
  it('provides crawler-visible Daymark metadata with absolute production URLs', () => {
    expect(indexHtml).toContain('<title>Daymark — A calm workspace for your day</title>')
    expect(indexHtml).toContain('name="description"')
    expect(indexHtml).toContain(
      '<link rel="canonical" href="https://weeny-v.github.io/daymark/">',
    )
    expect(indexHtml).toContain('property="og:title"')
    expect(indexHtml).toContain('property="og:description"')
    expect(indexHtml).toContain(
      'content="https://weeny-v.github.io/daymark/daymark-social-preview.png"',
    )
    expect(indexHtml).toContain('name="twitter:card" content="summary_large_image"')
    expect(indexHtml).toContain('name="twitter:image"')
  })

  it('ships a 1200 by 630 PNG preview and favicon assets', () => {
    const preview = readFileSync(projectFile('public/daymark-social-preview.png'))

    expect(preview.subarray(1, 4).toString()).toBe('PNG')
    expect(preview.readUInt32BE(16)).toBe(1200)
    expect(preview.readUInt32BE(20)).toBe(630)
    expect(() => readFileSync(projectFile('public/favicon.svg'))).not.toThrow()
    expect(() => readFileSync(projectFile('public/favicon-32x32.png'))).not.toThrow()
    expect(() => readFileSync(projectFile('public/apple-touch-icon.png'))).not.toThrow()
  })
})
