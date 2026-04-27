
/*
 * Manual restart button unit tests.
 * Verifies tutorial reset behavior for homepage and presentation manuals:
 * prevent default, clear localStorage flag, and trigger page reload.
 */
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import HomepageManual from '../../components/homepage/HomepageManual'
import PresentationManual from '../../components/presentation/PresentationManual'

describe('Manual restart buttons', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    jest.restoreAllMocks()
    localStorage.clear()
  })

  test('HomepageManual restart button prevents default, removes storage key and reloads', () => {
    localStorage.setItem('hasSeenHelp_homepage', 'true')
    const removeSpy = jest.spyOn(Storage.prototype, 'removeItem')


    const originalLocation = window.location
    const reloadMock = jest.fn()
    // JSDOM may lock window.location; guard delete and replace only reload.
    try {
      // eslint-disable-next-line no-delete
      delete window.location
    } catch (e) {}

    // @ts-ignore
    window.location = { ...originalLocation, reload: reloadMock }

    const preventSpy = jest.spyOn(Event.prototype, 'preventDefault')

    render(<HomepageManual />)

    const btn = screen.getByText(/Restart the tutorial/i)
    fireEvent.click(btn)

    expect(preventSpy).toHaveBeenCalled()
    expect(removeSpy).toHaveBeenCalledWith('hasSeenHelp_homepage')
    expect(reloadMock).toHaveBeenCalled()
    expect(localStorage.getItem('hasSeenHelp_homepage')).toBeNull()

    // @ts-ignore
    window.location = originalLocation
  })

  test('PresentationManual restart button prevents default, removes storage key and reloads', () => {
    localStorage.setItem('hasSeenHelp_presentation', 'true')
    const removeSpy = jest.spyOn(Storage.prototype, 'removeItem')


    const originalLocation = window.location
    const reloadMock = jest.fn()
    try {
      // eslint-disable-next-line no-delete
      delete window.location
    } catch (e) {}

    // @ts-ignore
    window.location = { ...originalLocation, reload: reloadMock }

    const preventSpy = jest.spyOn(Event.prototype, 'preventDefault')

    render(<PresentationManual />)

    const btn = screen.getByText(/Restart the tutorial/i)
    fireEvent.click(btn)

    expect(preventSpy).toHaveBeenCalled()
    expect(removeSpy).toHaveBeenCalledWith('hasSeenHelp_presentation')
    expect(reloadMock).toHaveBeenCalled()
    expect(localStorage.getItem('hasSeenHelp_presentation')).toBeNull()

    // @ts-ignore
    window.location = originalLocation
  })
})
