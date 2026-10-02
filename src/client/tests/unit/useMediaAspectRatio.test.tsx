import { render, screen, fireEvent } from "@testing-library/react"
import "@testing-library/jest-dom"
import { useMediaAspectRatio } from "../../components/utils/useMediaAspectRatio"

const Probe = ({ complete }: { complete: boolean }) => {
  const { aspectRatio, probeRef, onLoad } = useMediaAspectRatio()

  return (
    <>
      <span data-testid="ratio">{aspectRatio ?? "unknown"}</span>
      <img
        alt=""
        data-testid="probe"
        ref={(image) => {
          if (image) {
            Object.defineProperty(image, "complete", {
              value: complete,
              configurable: true,
            })
            Object.defineProperty(image, "naturalWidth", {
              value: 1600,
              configurable: true,
            })
            Object.defineProperty(image, "naturalHeight", {
              value: 900,
              configurable: true,
            })
          }
          probeRef(image)
        }}
        onLoad={onLoad}
      />
    </>
  )
}

describe("useMediaAspectRatio", () => {
  test("reads the size of an image the browser already had cached", () => {
    // The load event fired before React attached onLoad, so nothing else
    // will report the size -- this is what left spanning cues in the editor
    // rendering as if they did not span.
    render(<Probe complete={true} />)

    expect(screen.getByTestId("ratio")).toHaveTextContent(String(16 / 9))
  })

  test("waits for the load event when the image is still coming", () => {
    render(<Probe complete={false} />)

    expect(screen.getByTestId("ratio")).toHaveTextContent("unknown")

    fireEvent.load(screen.getByTestId("probe"))

    expect(screen.getByTestId("ratio")).toHaveTextContent(String(16 / 9))
  })
})
