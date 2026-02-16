import { createFormData } from "./formDataUtils"
import presentation from "../../services/presentation"      
import { color } from "framer-motion"

const addInitialElements = async (presentationId, screenCount, showToast, startingFrameColor = "#000000") => {
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

      formData.append("color", startingFrameColor)
      await presentation.addCue(presentationId, formData)
    }

    showToast({
      title: "New presentation created",
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
