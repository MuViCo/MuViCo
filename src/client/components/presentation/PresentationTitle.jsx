import React, { useState, useEffect } from "react"
import { useSelector, useDispatch } from "react-redux"
import { Box, IconButton, Input, Button } from "@chakra-ui/react"
import { EditIcon } from "@chakra-ui/icons"
import { updatePresentationName } from "../../redux/presentationReducer"
import { useCustomToast } from "../utils/toastUtils"

const PresentationTitle = ({ id, presentationName, showMode }) => {
    const [isEditingPresentationName, setIsEditingPresentationName] = useState(false)
    const [newPresentationName, setNewPresentationName] = useState("")
    const showToast = useCustomToast()
    const dispatch = useDispatch()

    useEffect(() => {
        setNewPresentationName(presentationName)
    }, [presentationName])

  const handleEditPresentationName = () => {
    if (newPresentationName.trim() === "") {
      showToast({status: "error", title: "Error", description: "Presentation name cannot be empty."})
      return
    }

    dispatch(updatePresentationName(id, newPresentationName))
      .then(() => {
        setIsEditingPresentationName(false)
        showToast({status: "success", title: "Success", description: "Presentation name updated successfully."})
      })
      .catch((error) => {
        showToast({status: "error", title: "Error", description: error.message})
      })
  }

    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        gap="10px" 
      >
        {!isEditingPresentationName && (
          <h2 style={{
          textAlign: "center",
          fontSize: "2em",
          fontWeight: 700
          }}>{presentationName}
          </h2>
        )}
        {isEditingPresentationName && (
          <Input
            data-testid="edit-presentation-name-input"
            value={newPresentationName}
            onChange={({ target }) => setNewPresentationName(target.value)}
            width="300px"
            fontSize="1.5em"
            fontWeight={700}
          />
        )}
        {!showMode && !isEditingPresentationName && (
          <IconButton
            data-testid="edit-presentation-name-button"
            icon={<EditIcon />}
            aria-label="Edit presentation name"
            onClick={() => setIsEditingPresentationName(true)}
          />
        )}
        {isEditingPresentationName && (
          <Button
            data-testid="save-presentation-name-button"
            colorScheme="blue"
            onClick={handleEditPresentationName}
          >
            Save
          </Button>
        )}
        {isEditingPresentationName && (
          <Button
            data-testid="cancel-edit-presentation-name-button"
            colorScheme="red"
            onClick={() => setIsEditingPresentationName(false)}
          >
            Cancel
          </Button>
        )}
      </Box>
    )
}

export default PresentationTitle