import { render, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import '@testing-library/jest-dom'
import React from 'react'
import NavBar from '../../components/navbar/index'
import { isTokenExpired } from '../../auth'

jest.mock('../../auth')
jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useNavigate: jest.fn(),
  }))
jest.mock('../../components/utils/firebase', () => ({
  apikey: 'testkey'
  }))

describe('autologout', () => {
  test('user is logged out when token expires', async () => {
    const setUser = jest.fn()
    const navigate = jest.fn()

    isTokenExpired.mockReturnValue(true)
    require('react-router-dom').useNavigate.mockReturnValue(navigate)

    render(
      <MemoryRouter>
        <NavBar user={{ username: 'testuser' }} 
        setUser={setUser} 
        navigate={navigate} 
        />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(setUser).toHaveBeenCalledWith(null)
      expect(navigate).toHaveBeenCalledWith('/')
    })
  })
})