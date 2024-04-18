import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ShowModeButtons, {
  ScreenButtons,
  ChangeCueButton,
} from '../../components/presentation/ShowModeButtons'

describe(ScreenButtons, () => {
  it('should render the correct number of buttons', () => {
    const mockOpenWindow = jest.fn()
    const mockCloseWindow = jest.fn()
    const screens = [false, false, false, false]

    render(
      <ScreenButtons
        openWindow={mockOpenWindow}
        closeWindow={mockCloseWindow}
        screens={screens}
      />
    )

    expect(screen.getAllByRole('button')).toHaveLength(4)
  })

  it('should call the openWindow function when a closed screen button is clicked', () => {
    const mockOpenWindow = jest.fn()
    const mockCloseWindow = jest.fn()
    const screens = [false, false, false, false]

    render(
      <ScreenButtons
        openWindow={mockOpenWindow}
        closeWindow={mockCloseWindow}
        screens={screens}
      />
    )

    fireEvent.click(screen.getAllByRole('button')[0])

    expect(mockOpenWindow).toHaveBeenCalledTimes(1)
  })

  it('should call the closeWindow function when an open screen button is clicked', () => {
    const mockOpenWindow = jest.fn()
    const mockCloseWindow = jest.fn()
    const screens = [true, false, false, false]

    render(
      <ScreenButtons
        openWindow={mockOpenWindow}
        closeWindow={mockCloseWindow}
        screens={screens}
      />
    )

    fireEvent.click(screen.getAllByRole('button')[0])

    expect(mockCloseWindow).toHaveBeenCalledTimes(1)
  })
})

describe(ChangeCueButton, () => {
  it('should render the correct icon based on the direction prop', () => {
    const mockUpdateScreen = jest.fn()

    render(
      <ChangeCueButton updateScreen={mockUpdateScreen} direction="Previous" />
    )
    const previous = screen.getByLabelText('Previous Cue')
    expect(previous).toBeDefined()

    render(<ChangeCueButton updateScreen={mockUpdateScreen} direction="Next" />)

    const next = screen.getByLabelText('Next Cue')
    expect(next).toBeDefined()
  })

  it('should call the updateScreen function when clicked', () => {
    const mockUpdateScreen = jest.fn()

    render(
      <ChangeCueButton updateScreen={mockUpdateScreen} direction="Previous" />
    )

    fireEvent.click(screen.getByLabelText('Previous Cue'))

    expect(mockUpdateScreen).toHaveBeenCalledTimes(1)
  })
})

describe(ShowModeButtons, () => {
  it('should render the correct number of buttons', () => {
    const mockSetScreensList = jest.fn()
    const mockSetCueIndex = jest.fn()
    const screensList = [false, false, false, false]
    const presentationInfo = { cueIndex: 0 }

    render(
      <ShowModeButtons
        screensList={screensList}
        setScreensList={mockSetScreensList}
        presentationInfo={presentationInfo}
        setCueIndex={mockSetCueIndex}
        cueIndex={presentationInfo.cueIndex}
      />
    )

    expect(screen.getAllByRole('button')).toHaveLength(6)
  })
  it('should call the setCueIndex function when the next button is clicked', () => {
    const mockSetScreensList = jest.fn()
    const mockSetCueIndex = jest.fn()
    const screensList = [false, false, false, false]
    const presentationInfo = { cues: [{ index: 1 }] }

    render(
      <ShowModeButtons
        screensList={screensList}
        setScreensList={mockSetScreensList}
        presentationInfo={presentationInfo}
        setCueIndex={mockSetCueIndex}
        cueIndex={0}
      />
    )

    fireEvent.click(screen.getByLabelText('Next Cue'))

    expect(mockSetCueIndex).toHaveBeenCalledTimes(1)
  })
  it('should call the setCueIndex function when the previous button is clicked', () => {
    const mockSetScreensList = jest.fn()
    const mockSetCueIndex = jest.fn()
    const screensList = [false, false, false, false]
    const presentationInfo = { cues: [{ index: 1 }] }

    render(
      <ShowModeButtons
        screensList={screensList}
        setScreensList={mockSetScreensList}
        presentationInfo={presentationInfo}
        setCueIndex={mockSetCueIndex}
        cueIndex={1}
      />
    )

    fireEvent.click(screen.getByLabelText('Previous Cue'))

    expect(mockSetCueIndex).toHaveBeenCalledTimes(1)
  })
  it('should call the setScreensList function when a screen button is clicked', () => {
    const mockSetScreensList = jest.fn()
    const mockSetCueIndex = jest.fn()
    const screensList = [false, false, false, false]
    const presentationInfo = {
      cues: [{ name: 'test', index: 1, screen: 1, file: { url: 'test url' } }],
    }

    render(
      <ShowModeButtons
        screensList={screensList}
        setScreensList={mockSetScreensList}
        presentationInfo={presentationInfo}
        setCueIndex={mockSetCueIndex}
        cueIndex={1}
      />
    )
    const buttons = screen.getAllByRole('button')

    fireEvent.click(buttons[0])

    expect(mockSetScreensList).toHaveBeenCalledTimes(1)
  })
  it('user is alerted if no cues are assigned to the screen', () => {
    const mockSetScreensList = jest.fn()
    const mockSetCueIndex = jest.fn()
    const screensList = [false, false, false, false]
    const presentationInfo = {
      cues: [{ name: 'test', index: 1, screen: 1, file: { url: 'test url' } }],
    }

    jest.spyOn(window, 'alert').mockImplementation(() => {})

    render(
      <ShowModeButtons
        screensList={screensList}
        setScreensList={mockSetScreensList}
        presentationInfo={presentationInfo}
        setCueIndex={mockSetCueIndex}
        cueIndex={1}
      />
    )
    const buttons = screen.getAllByRole('button')

    fireEvent.click(buttons[1])

    expect(mockSetScreensList).toHaveBeenCalledTimes(0)
    expect(window.alert).toHaveBeenCalledWith('No cues found for this screen')
  })
  it('setScreensList is called when close screen is pressed', () => {
    const mockSetScreensList = jest.fn()
    const mockSetCueIndex = jest.fn()
    const screensList = [undefined, undefined, undefined, undefined]
    const presentationInfo = {
      cues: [{ name: 'test', index: 1, screen: 1, file: { url: 'test url' } }],
    }

    render(
      <ShowModeButtons
        screensList={screensList}
        setScreensList={mockSetScreensList}
        presentationInfo={presentationInfo}
        setCueIndex={mockSetCueIndex}
        cueIndex={1}
      />
    )
    const buttons = screen.getAllByRole('button')

    fireEvent.click(buttons[0])
    fireEvent.click(buttons[0])

    expect(mockSetScreensList).toHaveBeenCalledTimes(2)
    expect(mockSetScreensList).toHaveBeenCalledWith([
      undefined,
      undefined,
      undefined,
      undefined,
    ])
  })
})
