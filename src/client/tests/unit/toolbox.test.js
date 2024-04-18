import { render, screen, fireEvent } from '@testing-library/react'

import Toolbox from '../../components/presentation/ToolBox'

describe('Toolbox', () => {
  test('should render a button', () => {
    const addCue = jest.fn()
    render(<Toolbox addCue={addCue} />)
    expect(screen.getByRole('button')).toBeDefined()
  })
  test('should open the drawer when the button is clicked', () => {
    const addCue = jest.fn()
    render(<Toolbox addCue={addCue} />)
    fireEvent.click(screen.getByRole('button'))
    expect(screen.getByRole('dialog')).toBeDefined()
  })
})
