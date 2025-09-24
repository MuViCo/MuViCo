import { createFormData } from "./formDataUtils"
import presentation from "../../services/presentation"

const addInitialElements = async (presentationId, screenCount, showToast) => {
  try {
    for (let screen = 1; screen <= screenCount; screen++) {
      const formData = createFormData(
        0,
        `initial element for screen ${screen}`,
        screen,
        "/blank.png"
      )
      await presentation.addCue(presentationId, formData)
    }

    const audioScreen = screenCount + 1
    const audioFormData = createFormData(
      0,
      "initial element for audio",
      audioScreen,
      "/blank.png"
    )
    await presentation.addCue(presentationId, audioFormData)

    showToast({
      title: "Elements added",
      description: "Initial elements added to screens",
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
