/*
 * Logout behavior unit tests for NavBar.
 * Verifies logout control rendering and user state reset when logging out.
 */
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import '@testing-library/jest-dom'
import NavBar from '../../components/navbar/index'

jest.mock('../../components/utils/firebase', () => ({
  apikey: 'testkey'
  }))

describe('logout', () => {
  test('render content', () => {
    const setUser = jest.fn()
    render(
      <MemoryRouter>
        <NavBar user={{ username: 'testuser' }} setUser={setUser} />
      </MemoryRouter>
    )
    expect(screen.getByText('Logout')).toBeDefined()
  })

  test('handleLogout', () => {
    // Core logout contract: active user is cleared from app state.
    const navigate = jest.fn()
    const setUser = jest.fn()

    const { getByText } = render(
      <MemoryRouter>
        <NavBar
          user={{ username: 'testuser' }}
          setUser={setUser}
          navigate={navigate}
        />
      </MemoryRouter>
    )
    const logoutButton = getByText('Logout')

    fireEvent.click(logoutButton)
    expect(setUser).toHaveBeenCalledWith(null)
  })
})
