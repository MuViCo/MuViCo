import React from "react"
import { ChakraProvider } from "@chakra-ui/react"
import { render, screen, fireEvent } from "@testing-library/react"
import "@testing-library/jest-dom"
import {
  ColumnHeaders,
  RowHeaders,
} from "../../components/presentation/EditModeHeaders"
import EditorDock from "../../components/presentation/EditorDock"
import ScorePanel from "../../components/presentation/ScorePanel"
import PresentationTitle from "../../components/presentation/PresentationTitle"
import GridLayoutComponent from "../../components/presentation/GridLayoutComponent"
import ScoreMarkerOverlay from "../../components/presentation/ScoreMarkerOverlay"
import {
  ReadOnlyProvider,
  useReadOnly,
} from "../../components/utils/ReadOnlyContext"
import { buildRowModel } from "../../components/utils/screenRowModel"

const mockDispatch = jest.fn()
jest.mock("../../redux/hooks", () => ({
  useAppDispatch: () => mockDispatch,
  useAppSelector: (selector: (state: unknown) => unknown) =>
    selector({ presentation: { media: [] } }),
}))

jest.mock("react-redux", () => ({
  useDispatch: () => mockDispatch,
  useSelector: jest.fn(),
}))

jest.mock("../../components/utils/toastUtils", () => ({
  useCustomToast: () => jest.fn(),
}))

jest.mock(
  "../../components/presentation/CuesForm",
  () =>
    ({ activeTab }: { activeTab: string }) => (
      <div data-testid="cues-form">{activeTab}</div>
    )
)

jest.mock("../../components/presentation/ScorePdfViewer", () => () => (
  <div data-testid="score-pdf-viewer" />
))

jest.mock("react-grid-layout", () => {
  return function MockGridLayout({ children }: { children: React.ReactNode }) {
    return <div data-testid="mock-grid-layout">{children}</div>
  }
})

const asViewer = (ui: React.ReactElement) => (
  <ReadOnlyProvider value>{ui}</ReadOnlyProvider>
)

const renderWithChakra = (ui: React.ReactElement) =>
  render(<ChakraProvider>{ui}</ChakraProvider>)

describe("ReadOnlyContext", () => {
  const Probe = () => <span>{String(useReadOnly())}</span>

  test("is off unless a provider turns it on", () => {
    render(<Probe />)
    expect(screen.getByText("false")).toBeInTheDocument()
  })

  test("is on inside a read-only provider", () => {
    render(asViewer(<Probe />))
    expect(screen.getByText("true")).toBeInTheDocument()
  })
})

describe("read-only timeline headers", () => {
  const screenCount = 2
  const cues = [{ _id: "c1", cueType: "visual", screen: 1, layer: 1, index: 0 }]
  const rowModel = buildRowModel(screenCount, cues as never, {})

  const rowProps = () => ({
    rows: rowModel.rows,
    collapsedGroups: {},
    onToggleGroupCollapsed: jest.fn(),
    onAddVisualLayer: jest.fn(),
    onRemoveVisualLayer: jest.fn(),
    onAddAudioTrack: jest.fn(),
    maxVisualLayers: 3,
    maxAudioTracks: 2,
    rowGap: 4,
    rowHeight: 60,
    screenCount,
    isAudioMuted: false,
    screenIcon: "screen-icon.svg",
    headerActionsRef: {
      current: {
        toggleAudioMute: jest.fn(),
        increaseScreenCount: jest.fn(),
        decreaseScreenCount: jest.fn(),
        addIndex: jest.fn(),
        removeIndex: jest.fn(),
      },
    },
  })

  const columnProps = (onSelectFrame = jest.fn()) => ({
    xLabels: ["0", "1", "2"],
    cueIndex: 0,
    bgCurrentFrame: "purple",
    bgColorIndex: "pink",
    rowHeight: 60,
    columnWidth: 100,
    indexCount: 3,
    frameHeaderHeight: 30,
    headerActionsRef: rowProps().headerActionsRef,
    onSelectFrame,
  })

  test("the owner can add and remove layers, screens and audio tracks", () => {
    render(<RowHeaders {...rowProps()} />)

    expect(
      screen.getByLabelText("Remove layer from screen 1")
    ).toBeInTheDocument()
    expect(screen.getByLabelText("Add layer to screen 2")).toBeInTheDocument()
    expect(screen.getByLabelText("Add audio track")).toBeInTheDocument()
    expect(screen.getByLabelText("Remove screen")).toBeInTheDocument()
  })

  test("a viewer gets none of those buttons", () => {
    render(asViewer(<RowHeaders {...rowProps()} />))

    expect(screen.queryByLabelText(/Remove layer from screen/)).toBeNull()
    expect(screen.queryByLabelText(/Add layer to screen/)).toBeNull()
    expect(screen.queryByLabelText("Add audio track")).toBeNull()
    expect(screen.queryByLabelText("Remove screen")).toBeNull()
    expect(screen.queryByLabelText("Add screen")).toBeNull()
  })

  test("a viewer can still mute the audio row for themselves", () => {
    const props = rowProps()
    render(asViewer(<RowHeaders {...props} />))

    fireEvent.mouseDown(screen.getByLabelText("Mute/unmute audio"))

    expect(props.headerActionsRef.current.toggleAudioMute).toHaveBeenCalled()
  })

  test("the owner can add and remove frames", () => {
    render(<ColumnHeaders {...columnProps()} />)

    expect(screen.getAllByLabelText("Add Frame").length).toBeGreaterThan(0)
    expect(screen.getAllByLabelText("Remove Frame").length).toBeGreaterThan(0)
  })

  test("a viewer gets no frame buttons but can still pick a frame", () => {
    const onSelectFrame = jest.fn()
    render(asViewer(<ColumnHeaders {...columnProps(onSelectFrame)} />))

    expect(screen.queryByLabelText("Add Frame")).toBeNull()
    expect(screen.queryByLabelText("Add Frame Before")).toBeNull()
    expect(screen.queryByLabelText("Remove Frame")).toBeNull()

    fireEvent.click(screen.getByText("2"))
    expect(onSelectFrame).toHaveBeenCalledWith(2)
  })
})

describe("read-only editor dock", () => {
  const renderDock = (viewer: boolean) => {
    const dock = (
      <EditorDock
        presentationId="presentation-1"
        scores={[]}
        cues={[]}
        updateCue={jest.fn()}
        screenCount={3}
        indexCount={5}
      />
    )
    return renderWithChakra(viewer ? asViewer(dock) : dock)
  }

  beforeEach(() => {
    window.localStorage.clear()
  })

  test("the owner sees Colors, Text, Media and Scores", () => {
    renderDock(false)

    expect(screen.getAllByRole("tab")).toHaveLength(4)
  })

  test("a viewer only gets the Scores tab, opened by default", () => {
    window.localStorage.setItem("editModeMediaPoolActiveTab", "colors")
    renderDock(true)

    expect(screen.getAllByRole("tab")).toHaveLength(1)
    expect(screen.getByRole("tab", { name: "Scores" })).toBeInTheDocument()
    expect(screen.queryByRole("tab", { name: "Media" })).toBeNull()
    expect(screen.queryByRole("tab", { name: "Text" })).toBeNull()
    expect(screen.queryByTestId("cues-form")).toBeNull()
  })

  test("a viewer's dock leaves their own remembered tab alone", () => {
    window.localStorage.setItem("editModeMediaPoolActiveTab", "colors")
    renderDock(true)

    expect(window.localStorage.getItem("editModeMediaPoolActiveTab")).toBe(
      "colors"
    )
  })
})

describe("read-only score panel", () => {
  const score = {
    _id: "score-1",
    title: "Apano stin Triantafyllia",
    source: "upload" as const,
    file: { name: "score.pdf", type: "application/pdf" },
    markers: [],
  }

  test("the owner can remove a score and import one when there is none", () => {
    renderWithChakra(
      <ScorePanel presentationId="presentation-1" scores={[score]} />
    )
    expect(screen.getByRole("button", { name: /Remove/ })).toBeInTheDocument()

    renderWithChakra(<ScorePanel presentationId="presentation-1" scores={[]} />)
    expect(screen.getByText("Upload PDF")).toBeInTheDocument()
  })

  test("a viewer can't remove the score", () => {
    renderWithChakra(
      asViewer(<ScorePanel presentationId="presentation-1" scores={[score]} />)
    )

    expect(screen.getByTestId("score-pdf-viewer")).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /Remove/ })).toBeNull()
  })

  test("a viewer isn't offered an import when there is no score", () => {
    renderWithChakra(
      asViewer(<ScorePanel presentationId="presentation-1" scores={[]} />)
    )

    expect(screen.queryByText("Upload PDF")).toBeNull()
    expect(screen.queryByPlaceholderText(/imslp/i)).toBeNull()
  })
})

describe("read-only presentation title", () => {
  test("the owner can rename, a viewer can't", () => {
    const { unmount } = renderWithChakra(
      <PresentationTitle id="presentation-1" presentationName="My show" />
    )
    expect(
      screen.getByTestId("edit-presentation-name-button")
    ).toBeInTheDocument()
    unmount()

    renderWithChakra(
      asViewer(
        <PresentationTitle id="presentation-1" presentationName="My show" />
      )
    )
    expect(screen.getByText("My show")).toBeInTheDocument()
    expect(screen.queryByTestId("edit-presentation-name-button")).toBeNull()
  })
})

describe("read-only cue grid", () => {
  const cue = {
    _id: "visual-1",
    index: 0,
    screen: 1,
    name: "Visual cue",
    color: "#ffffff",
    cueType: "visual",
    file: {
      type: "image/png",
      url: "https://example.com/i.png",
      name: "i.png",
    },
  }
  const layout = [{ i: "visual-1", x: 0, y: 0, w: 1, h: 1, static: false }]

  const renderGrid = (viewer: boolean) => {
    const grid = (
      <GridLayoutComponent
        id="presentation-1"
        cues={[cue] as never}
        layout={layout}
        setCopiedCue={jest.fn()}
        setIsCopied={jest.fn()}
        columnWidth={150}
        rowHeight={100}
        gap={10}
        rowGap={10}
        cueIndex={0}
        isAudioMuted={false}
        setSelectedCue={jest.fn()}
        setIsToolboxOpen={jest.fn()}
        setIsMultiScreenModalOpen={jest.fn()}
        indexCount={5}
        setShowAlert={jest.fn()}
        setAlertData={jest.fn()}
        screenCount={2}
      />
    )
    return renderWithChakra(viewer ? asViewer(grid) : grid)
  }

  test("the owner gets an options button on each cue", () => {
    renderGrid(false)

    expect(screen.getByTestId("cue-menu-button-visual-1")).toBeInTheDocument()
  })

  test("a viewer gets no options button", () => {
    renderGrid(true)

    expect(screen.getByTestId("mock-grid-layout")).toBeInTheDocument()
    expect(screen.queryByTestId("cue-menu-button-visual-1")).toBeNull()
  })

  const cueElement = () =>
    document.querySelector("[data-cue-content-id='visual-1']") as Element

  test("right-clicking a cue opens its menu for the owner", () => {
    renderGrid(false)

    fireEvent.contextMenu(cueElement())

    expect(screen.getByRole("menu")).toBeInTheDocument()
  })

  test("right-clicking the same cue opens no menu for a viewer", () => {
    renderGrid(true)

    const target = cueElement()
    expect(target).not.toBeNull()
    fireEvent.contextMenu(target)

    expect(screen.queryByRole("menu")).toBeNull()
  })
})

describe("score marker overlay without handlers", () => {
  const marker = {
    _id: "m1",
    page: 1,
    frameIndex: 3,
    rect: { x: 0.2, y: 0.4, width: 0, height: 0 },
  }

  test("shows the pins but never reacts to a click", () => {
    render(<ScoreMarkerOverlay markers={[marker]} isPlacing={false} />)

    const pin = screen.getByTestId("score-marker-pin")
    expect(pin).toHaveAttribute("title", "Frame 3")

    expect(() => fireEvent.click(pin)).not.toThrow()
    expect(screen.getByTestId("score-marker-overlay")).toHaveStyle({
      pointerEvents: "none",
    })
  })

  test("a click while placing is ignored when there is nothing to place with", () => {
    render(<ScoreMarkerOverlay markers={[]} isPlacing />)

    expect(() =>
      fireEvent.click(screen.getByTestId("score-marker-overlay"))
    ).not.toThrow()
  })
})
