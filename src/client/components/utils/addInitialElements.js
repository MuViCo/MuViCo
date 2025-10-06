import { createFormData } from "./formDataUtils"
import presentation from "../../services/presentation"

const addInitialElements = async (presentationId, screenCount, showToast) => {
  if (!presentationId || typeof screenCount !== "number" || typeof showToast !== "function") {
    return
  }
  
  try {
    for (let screen = 1; screen <= screenCount; screen++) {
      const formData = createFormData(
        0,
        `initial element for screen ${screen}`,
        screen,
        null
      )

      formData.append("image", "/blank.png")
      await presentation.addCue(presentationId, formData)
    }

    showToast({
      title: "Elements added",
      description: "Initial elements added to screens",
      status: "success",
    })
  
  } catch (error) {
    const errorMessage = error.message || "An error occurred"
    
    showToast({
      title: "Error",
      description: errorMessage,
      status: "error",
    })
  }
}

export default addInitialElements
