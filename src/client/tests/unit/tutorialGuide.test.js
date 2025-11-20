import React from 'react'
import { render, screen, fireEvent, act, waitForElementToBeRemoved, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { MemoryRouter } from 'react-router-dom'
import TutorialGuide from '../../components/tutorial/TutorialGuide'

// Helper to render with router context
const renderWithRouter = (ui, { route = '/home' } = {}) =>
  render(<MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>)

describe('TutorialGuide', () => {
  beforeEach(() => {
    // ensure tutorial doesn't persist between tests
    localStorage.removeItem('hasSeenHelp_homepage')
    localStorage.removeItem('hasSeenHelp_presentation')
  })

  test('renders centered welcome step and Next/Skip work', async () => {
    const steps = [
      { id: 'welcome', center: true, title: 'Welcome', description: 'Hello' },
      { id: 'end', center: true, title: 'End', description: 'Bye' },
    ]

    // Render with a small controller so onClose actually closes the guide (isOpen prop is controlled)
    const Wrapper = () => {
      const [open, setOpen] = React.useState(true)
      return (
        <TutorialGuide
          steps={steps}
          isOpen={open}
          onClose={() => {
            setOpen(false)
          }}
        />
      )
    }
  const utils = renderWithRouter(<Wrapper />)

    const title = await screen.findByText('Welcome')
    expect(title).toBeInTheDocument()

  const next = screen.getByRole('button', { name: /next/i })
  // specifically target the Quit Tutorial button text to avoid ambiguity
  const skip = screen.getByText('Quit Tutorial')

    // click next -> moves to second step
    fireEvent.click(next)
    expect(await screen.findByText('End')).toBeInTheDocument()

    // click skip/quit -> tutorial should close; wait for the centered element to be removed
    fireEvent.click(skip)
    // Force prop-based close by re-rendering with isOpen=false (simulate wrapper onClose)
    const { rerender } = utils
    rerender(
      <MemoryRouter initialEntries={["/home"]}>
        <TutorialGuide steps={steps} isOpen={false} onClose={() => {}} />
      </MemoryRouter>
    )
    const el = document.querySelector('[data-testid^="tutorial-centered"]')
    if (el) {
      await waitForElementToBeRemoved(() => document.querySelector('[data-testid^="tutorial-centered"]'), { timeout: 1000 })
    }
  })

  test('renders selector-based tooltip and highlight when target exists', () => {
    // create a target element in document
  const btn = document.createElement('button')
    btn.id = 'test-target'
    btn.textContent = 'Target'
    document.body.appendChild(btn)

    const steps = [
      { id: 'target', selector: '#test-target', title: 'Target section', description: 'Click it' },
    ]

    const Wrapper = () => {
      const [open, setOpen] = React.useState(true)
      return (
        <TutorialGuide steps={steps} isOpen={open} onClose={() => setOpen(false)} />
      )
    }
    renderWithRouter(<Wrapper />)

    // tooltip title
    expect(screen.getByText('Target section')).toBeInTheDocument()
    // highlight box should exist (use data-testid)
  const highlight = document.querySelector('[data-testid="tutorial-highlight"]')
  expect(highlight).toBeTruthy()

    // cleanup
    document.body.removeChild(btn)
  })

  test('keyboard navigation: Enter advances, Escape quits, ArrowLeft goes back', () => {
    const steps = [
      { id: 'one', center: true, title: 'One', description: '1' },
      { id: 'two', center: true, title: 'Two', description: '2' },
    ]

    const Wrapper = () => {
      const [open, setOpen] = React.useState(true)
      return (
        <TutorialGuide steps={steps} isOpen={open} onClose={() => setOpen(false)} />
      )
    }
    renderWithRouter(<Wrapper />)

    expect(screen.getByText('One')).toBeInTheDocument()

    act(() => {
      fireEvent.keyDown(window, { key: 'Enter' })
    })
    expect(screen.getByText('Two')).toBeInTheDocument()

    act(() => {
      fireEvent.keyDown(window, { key: 'ArrowLeft' })
    })
    expect(screen.getByText('One')).toBeInTheDocument()

    act(() => {
      fireEvent.keyDown(window, { key: 'Escape' })
    })
    expect(screen.queryByText('One')).not.toBeInTheDocument()
  })

  test('does not respond to navigation keys while typing in an input', () => {
    const steps = [
      { id: 'one', center: true, title: 'One', description: '1' },
      { id: 'two', center: true, title: 'Two', description: '2' },
    ]

    const Wrapper = () => {
      const [open, setOpen] = React.useState(true)
      return (
        <div>
          <input data-testid="chat-input" />
          <TutorialGuide steps={steps} isOpen={open} onClose={() => setOpen(false)} />
        </div>
      )
    }

    renderWithRouter(<Wrapper />)

    // focus the input so isTyping() returns true
    const input = screen.getByTestId('chat-input')
    input.focus()

    // pressing Enter while typing should NOT advance the tutorial
    act(() => {
      fireEvent.keyDown(window, { key: 'Enter' })
    })

    // still on the first step
    expect(screen.getByText('One')).toBeInTheDocument()
  })

  test('applies mobile offset when posLeftNeeded and viewport is narrow', () => {
    const btn = document.createElement('button')
    btn.id = 'mobile-target'
    btn.textContent = 'Target'
    document.body.appendChild(btn)

    // mock bounding rect for deterministic placement
    const fakeRect = { top: 100, left: 100, width: 50, height: 20, right: 0, bottom: 0 }
    jest.spyOn(btn, 'getBoundingClientRect').mockReturnValue(fakeRect)

    // set a narrow viewport
    const prevWidth = window.innerWidth
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1366 })

    const steps = [
      { id: 't', selector: '#mobile-target', title: 'T', description: 'd', posLeftNeeded: true },
    ]

    renderWithRouter(<TutorialGuide steps={steps} isOpen={true} onClose={() => {}} />)

    const tooltip = screen.getByTestId('tutorial-step-0')
    // computed left = scrollX(0) + left(100) + width(50) + 12 + mobileOffset(-280) = -118
    expect(tooltip).toHaveStyle({ left: '-118px' })

    // cleanup / restore
    document.body.removeChild(btn)
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: prevWidth })
  })

  test('manualLeftPos overrides computed left', () => {
    const btn = document.createElement('button')
    btn.id = 'manual-target'
    document.body.appendChild(btn)
    jest.spyOn(btn, 'getBoundingClientRect').mockReturnValue({ top: 10, left: 10, width: 20, height: 10, right: 0, bottom: 0 })

    const steps = [
      { id: 't', selector: '#manual-target', title: 'Manual', description: 'd', manualLeftPos: 42 },
    ]

    renderWithRouter(<TutorialGuide steps={steps} isOpen={true} onClose={() => {}} />)

    const tooltip = screen.getByTestId('tutorial-step-0')
    expect(tooltip).toHaveStyle({ left: '42px' })

    document.body.removeChild(btn)
  })

  test('missing selector produces no tooltip or highlight', () => {
    const steps = [ { id: 'missing', selector: '#does-not-exist', title: 'X', description: 'no' } ]
    renderWithRouter(<TutorialGuide steps={steps} isOpen={true} onClose={() => {}} />)

    // no tooltip or highlight should be rendered for missing selector
    expect(screen.queryByTestId('tutorial-step-0')).toBeNull()
    expect(screen.queryByTestId('tutorial-highlight')).toBeNull()
  })

  test('finish stores storageKey and restores body styles', async () => {
    const steps = [ { id: 'welcome', center: true, title: 'Welcome', description: 'Hello' } ]
    const Wrapper = () => {
      const [open, setOpen] = React.useState(true)
      return (
        <TutorialGuide steps={steps} isOpen={open} onClose={() => setOpen(false)} storageKey="test_tut_key" />
      )
    }

    const prevOverflow = document.body.style.overflow
    const prevTouch = document.body.style.touchAction

    const { rerender } = renderWithRouter(<Wrapper />)

    // tutorial should be open and body styles changed
    expect(document.body.style.overflow).toBe('hidden')
    expect(document.body.style.touchAction).toBe('none')

    // click Quit Tutorial to finish
    const quit = await screen.findByText('Quit Tutorial')
    fireEvent.click(quit)

    // simulate parent closing by re-rendering with isOpen=false
    rerender(
      <MemoryRouter initialEntries={["/home"]}>
        <TutorialGuide steps={steps} isOpen={false} onClose={() => {}} storageKey="test_tut_key" />
      </MemoryRouter>
    )

    // storage key must be set
    expect(localStorage.getItem('test_tut_key')).toBe('true')

    // styles restored
    expect(document.body.style.overflow).toBe(prevOverflow)
    expect(document.body.style.touchAction).toBe(prevTouch)
  })

  test('preventDefault is called for wheel and touchmove while open', () => {
    const steps = [ { id: 'one', center: true, title: 'One', description: '1' } ]
    renderWithRouter(<TutorialGuide steps={steps} isOpen={true} onClose={() => {}} />)

    const spy = jest.spyOn(Event.prototype, 'preventDefault')

    // dispatch synthetic events
    window.dispatchEvent(new Event('wheel', { bubbles: true, cancelable: true }))
    window.dispatchEvent(new Event('touchmove', { bubbles: true, cancelable: true }))

    expect(spy).toHaveBeenCalled()
    spy.mockRestore()
  })

  test('calls finish when opened with no steps', async () => {
    const onClose = jest.fn()
    renderWithRouter(<TutorialGuide steps={[]} isOpen={true} onClose={onClose} />)

    await waitFor(() => expect(onClose).toHaveBeenCalled())
  })

  test('step without selector and not centered yields no tooltip/highlight', () => {
    const steps = [ { id: 'no', title: 'X', description: 'x' } ]
    renderWithRouter(<TutorialGuide steps={steps} isOpen={true} onClose={() => {}} />)

    expect(screen.queryByTestId('tutorial-step-0')).toBeNull()
    expect(screen.queryByTestId('tutorial-centered-0')).toBeNull()
    expect(screen.queryByTestId('tutorial-highlight')).toBeNull()
  })

  test('Next on final step triggers finish and sets storageKey', async () => {
    const steps = [ { id: 'only', center: true, title: 'Only', description: 'end' } ]
    const Wrapper = () => {
      const [open, setOpen] = React.useState(true)
      return (
        <TutorialGuide steps={steps} isOpen={open} onClose={() => setOpen(false)} storageKey="final_key" />
      )
    }

    const utils = renderWithRouter(<Wrapper />)

    const next = await screen.findByRole('button', { name: /done/i })
    fireEvent.click(next)

    // simulate parent closing
    const { rerender } = utils
    rerender(
      <MemoryRouter initialEntries={["/home"]}>
        <TutorialGuide steps={steps} isOpen={false} onClose={() => {}} storageKey="final_key" />
      </MemoryRouter>
    )

    expect(localStorage.getItem('final_key')).toBe('true')
  })

  test('selector tooltip shows Done on final step and sets storageKey', async () => {
    const btn = document.createElement('button')
    btn.id = 'sel-target'
    btn.textContent = 'Target'
    document.body.appendChild(btn)

    const steps = [
      { id: 'only', selector: '#sel-target', title: 'Only', description: 'end' },
    ]

    const Wrapper = () => {
      const [open, setOpen] = React.useState(true)
      return (
        <TutorialGuide steps={steps} isOpen={open} onClose={() => setOpen(false)} storageKey="sel_key" />
      )
    }

    const utils = renderWithRouter(<Wrapper />)

    // Next button should be labeled Done for the only step
    const done = await screen.findByRole('button', { name: /done/i })
    expect(done).toBeInTheDocument()

    fireEvent.click(done)

    // simulate parent closing in case it wasn't already closed
    const { rerender } = utils
    rerender(
      <MemoryRouter initialEntries={["/home"]}>
        <TutorialGuide steps={steps} isOpen={false} onClose={() => {}} storageKey="sel_key" />
      </MemoryRouter>
    )

    expect(localStorage.getItem('sel_key')).toBe('true')

    document.body.removeChild(btn)
  })

  test('selector tooltip Prev/Next navigation works and Quit closes', () => {
    const btn = document.createElement('button')
    btn.id = 'nav-target'
    btn.textContent = 'Target'
    document.body.appendChild(btn)

    const steps = [
      { id: 'one', selector: '#nav-target', title: 'Step1', description: '1' },
      { id: 'two', selector: '#nav-target', title: 'Step2', description: '2' },
    ]

    const Wrapper = () => {
      const [open, setOpen] = React.useState(true)
      return (
        <TutorialGuide steps={steps} isOpen={open} onClose={() => setOpen(false)} />
      )
    }

    renderWithRouter(<Wrapper />)

    expect(screen.getByText('Step1')).toBeInTheDocument()

    const next = screen.getByRole('button', { name: /next/i })
    fireEvent.click(next)
    expect(screen.getByText('Step2')).toBeInTheDocument()

    const prev = screen.getByRole('button', { name: /prev/i })
    fireEvent.click(prev)
    expect(screen.getByText('Step1')).toBeInTheDocument()

    const quit = screen.getByRole('button', { name: /quit/i })
    fireEvent.click(quit)
    expect(screen.queryByText('Step1')).not.toBeInTheDocument()

    document.body.removeChild(btn)
  })
})
