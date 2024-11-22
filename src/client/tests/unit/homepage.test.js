import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { useNavigate, Router } from 'react-router-dom'
import HomePage from '../../components/homepage/index'
import {
  AdminControls,
  PresentationsGrid,
  CreatePresentation,
} from '../../components/homepage/index'
import PresentationForm from '../../components/homepage/presentationform'
import '@testing-library/jest-dom'

jest.mock('react-router-dom', () => ({
  useNavigate: jest.fn(),
}))
jest.mock('../../components/utils/firebase', () => ({
  apikey: 'testkey'
  }))

describe("HomePage", () => {
  beforeEach(() => {
    useNavigate.mockClear()
  })


  test('navigates to /users when "All users" button is clicked', () => {
    const navigate = jest.fn()
    useNavigate.mockReturnValue(navigate)
    render(<HomePage user={{ isAdmin: true }} />)
    fireEvent.click(screen.getByText("All users"))
    expect(navigate).toHaveBeenCalledWith("/users")
  })
})

describe('PresentationForm', () => {
  test('renders the form with name input field and buttons', () => {
    render(<PresentationForm />)

    expect(screen.getByRole('button', { name: /create/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
    expect(screen.getByTestId('presentation-name')).toBeInTheDocument()
    expect(screen.getByLabelText('Name')).toBeInTheDocument()
  })

  test('calls createPresentation function when create button is clicked', () => {
    const createPresentationMock = jest.fn()
    render(
      <PresentationForm
        createPresentation={createPresentationMock}
        onCancel={() => {}}
      />
    )

    const nameInput = screen.getByLabelText('Name')
    fireEvent.change(nameInput, { target: { value: 'Test Presentation' } })
    fireEvent.click(screen.getByText('create'))

    expect(createPresentationMock).toHaveBeenCalledWith({
      name: 'Test Presentation',
    })
  })

  test('calls onCancel function when cancel button is clicked', () => {
    const onCancelMock = jest.fn()
    render(
      <PresentationForm createPresentation={() => {}} onCancel={onCancelMock} />
    )

    fireEvent.click(screen.getByText('cancel'))

    expect(onCancelMock).toHaveBeenCalled()
  })
})

describe('AdminControls', () => {
  test('renders the component', () => {
    render(<AdminControls isAdmin={true} />)
    expect(screen.getByText('Admin controls')).toBeInTheDocument()
  })

  test('renders the component with buttons', () => {
    render(<AdminControls isAdmin={true} />)
    expect(screen.getByText('All users')).toBeInTheDocument()
  })
  test("navigates to /users when 'All users' button is clicked", () => {
    const navigate = jest.fn()
    useNavigate.mockReturnValue(navigate)
    render(<AdminControls isAdmin={true} navigate={navigate} />)
    fireEvent.click(screen.getByText('All users'))
    expect(navigate).toHaveBeenCalledWith('/users')
  })
})

const mock_data = [
  {
    id: '123',
    name: 'Test Presentation',
  },
  {
    id: '456',
    name: 'Another Presentation',
  },
]

describe('PresentationsGrid', () => {
  test('renders the component', () => {
    render(
      <PresentationsGrid
        presentations={[]}
        handlePresentationClick={() => {}}
      />
    )
    expect(screen.getByText('Presentations')).toBeInTheDocument()
  })
  test('renders the component with presentation buttons', () => {
    render(
      <PresentationsGrid
        presentations={mock_data}
        handlePresentationClick={() => {}}
      />
    )
    expect(screen.getByText('Test Presentation')).toBeInTheDocument()
    expect(screen.getByText('Another Presentation')).toBeInTheDocument()
  })
  test('calls handlePresentationClick with correct id when presentation button is clicked', () => {
    const handlePresentationClickMock = jest.fn()
    render(
      <PresentationsGrid
        presentations={mock_data}
        handlePresentationClick={handlePresentationClickMock}
      />
    )
    fireEvent.click(screen.getByText('Test Presentation'))
    expect(handlePresentationClickMock).toHaveBeenCalledWith('123')
  })
})

describe('Create presentation form', () => {
  test('renders the component', () => {
    render(
      <CreatePresentation
        createPresentation={() => {}}
        handleCancel={() => {}}
        handleConnectionsClick={() => {}}
      />
    )
    expect(screen.getByText('New presentation')).toBeInTheDocument()
  })
  test('renders the component with buttons', () => {
    render(
      <CreatePresentation
        createPresentation={() => {}}
        handleCancel={() => {}}
        handleConnectionsClick={() => {}}
      />
    )
    expect(screen.getByText('New presentation')).toBeInTheDocument()
  })
  test('calls createPresentation function when create button is clicked', () => {
    const createPresentationMock = jest.fn()
    render(
      <CreatePresentation
        createPresentation={createPresentationMock}
        handleCancel={() => {}}
        handleConnectionsClick={() => {}}
      />
    )
    fireEvent.click(screen.getByText('New presentation'))
    const nameInput = screen.getByLabelText('Name')
    fireEvent.change(nameInput, { target: { value: 'Test Presentation' } })
    fireEvent.click(screen.getByText('create'))
    expect(createPresentationMock).toHaveBeenCalledWith({
      name: 'Test Presentation',
    })
  })
})
