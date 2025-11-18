import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import HomepageManual from '../../components/homepage/HomepageManual'
import PresentationManual from '../../components/presentation/PresentationManual'

describe('Manual restart buttons', () => {
  beforeEach(() => {
    // ensure clean storage for each test
    localStorage.clear()
  })

  afterEach(() => {
    jest.restoreAllMocks()
    localStorage.clear()
  })

  test('HomepageManual restart button prevents default, removes storage key and reloads', () => {
    // prepare storage and spies
    localStorage.setItem('hasSeenHelp_homepage', 'true')
    const removeSpy = jest.spyOn(Storage.prototype, 'removeItem')


    const originalLocation = window.location
    const reloadMock = jest.fn()
    // try to replace location.reload; assign a mutated location if possible
    try {
      // delete may fail in some jsdom environments, so guard
      // eslint-disable-next-line no-delete
      delete window.location
    } catch (e) {}
    // assign a shallow copy with reload replaced
    // eslint-disable-next-line no-undef
    // @ts-ignore
    window.location = { ...originalLocation, reload: reloadMock }

    const preventSpy = jest.spyOn(Event.prototype, 'preventDefault')

    render(<HomepageManual />)

    const btn = screen.getByText(/Restart the tutorial/i)
    fireEvent.click(btn)

    expect(preventSpy).toHaveBeenCalled()
    expect(removeSpy).toHaveBeenCalledWith('hasSeenHelp_homepage')
    expect(reloadMock).toHaveBeenCalled()
    // storage item should be removed
    expect(localStorage.getItem('hasSeenHelp_homepage')).toBeNull()
    // restore original location
    // eslint-disable-next-line no-undef
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
    // eslint-disable-next-line no-undef
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
    // restore
    // eslint-disable-next-line no-undef
    // @ts-ignore
    window.location = originalLocation
  })
})
