import { createFormData } from "./formDataUtils"
import presentation from "../../services/presentation"

const addInitialElements = async (presentationId, showToast) => {
  const screens = [1, 2, 3, 4, 5]
  try {
    for (const screen of screens) {
      if (screen === 5) {
        const formData = createFormData(
          0,
          "initial element for audio",
          screen,
          "/blank.png"
        )
        await presentation.addCue(presentationId, formData)
        return
      }

      const formData = createFormData(
        0,
        `initial element for screen ${screen}`,
        screen,
        "/blank.png"
      )
      await presentation.addCue(presentationId, formData)
    }

    showToast({
      title: "Elements added",
      description: "Four initial elements added to screens",
      status: "success",
    })
  } catch (error) {
    const errorMessage = error.message || "An error occurred"
    console.error("Error adding initial elements:", error)
    showToast({
      title: "Error",
      description: errorMessage,
      status: "error",
    })
  }
}

export default addInitialElements
