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
      expect(navigate).toHaveBeenCalledWith('/home')
    })
  })
  test('token is expired', () => {
  // exp in token is 3.8.2021
  const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6InRlc3RpMSIsImlkIjoiNjZlMjk5Mzk1YmM0NjVkZDI2NDU2ZDgzIiwiaWF0IjoxNzI3OTQzOTAzLCJleHAiOjE3Mjc5NDc1MDN9.YGpD4OMMq07wwEwUZlXCZI9DUaSzoKmgPIpPzcloqfceyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6InRlc3RpMSIsImlkIjoiNjZlMjk5Mzk1YmM0NjVkZDI2NDU2ZDgzIiwiaWF0IjoxNzI3OTQzOTAzLCJleHAiOjE2Mjc5NDY1MDN9.kmKnLkLMc8SqQVt7ncMeTEOWlGNr9pu5dTU5zugbPmU"
    
  const result = isTokenExpired(token)
  expect(result).toBe(true)
  })
})