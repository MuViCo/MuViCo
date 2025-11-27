import { getAnims, fadeIn, fadeOut, zoomIn, zoomOut, slideInLeft, slideOutRight, slideInRight, slideOutLeft } from '../../utils/transitionUtils'

describe('getAnims', () => {
  test('returns fade animations for "fade"', () => {
    const { enter, exit } = getAnims('fade')
    expect(enter).toBe(fadeIn)
    expect(exit).toBe(fadeOut)
  })

  test('returns zoom animations for "zoom"', () => {
    const { enter, exit } = getAnims('zoom')
    expect(enter).toBe(zoomIn)
    expect(exit).toBe(zoomOut)
  })

  test('returns slide-left animations for "slide-left"', () => {
    const { enter, exit } = getAnims('slide-left')
    expect(enter).toBe(slideInLeft)
    expect(exit).toBe(slideOutRight)
  })

  test('returns slide-right animations for "slide-right"', () => {
    const { enter, exit } = getAnims('slide-right')
    expect(enter).toBe(slideInRight)
    expect(exit).toBe(slideOutLeft)
  })

  test('returns no animations for "none"', () => {
    const { enter, exit } = getAnims('none')
    expect(enter).toBeNull()
    expect(exit).toBeNull()
  })

  test('falls back to fade by default', () => {
    const { enter, exit } = getAnims('unknown')
    expect(enter).toBe(fadeIn)
    expect(exit).toBe(fadeOut)
  })
})
