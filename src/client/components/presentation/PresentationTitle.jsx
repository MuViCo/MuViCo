/**
 * presentation title component - displays presentation name and allows editing
 * When edit button is clicked, shows input field and save/cancel buttons. On save, updates presentation name in redux store and shows success toast.
 * On cancel, reverts to original name and hides input field.
 */

import React, { useState, useEffect } from "react"
import { useSelector, useDispatch } from "react-redux"
import { Box, IconButton, Input, Button } from "@chakra-ui/react"
import { EditIcon } from "@chakra-ui/icons"
import { updatePresentationName } from "../../redux/presentationReducer"
import { useCustomToast } from "../utils/toastUtils"

const PresentationTitle = ({ id, presentationName }) => {
  const [isEditingPresentationName, setIsEditingPresentationName] =
    useState(false)
  const [newPresentationName, setNewPresentationName] = useState("")
  const showToast = useCustomToast()
  const dispatch = useDispatch()

  useEffect(() => {
    setNewPresentationName(presentationName)
  }, [presentationName])

  const handleEditPresentationName = () => {
    if (newPresentationName.trim() === "") {
      showToast({
        status: "error",
        title: "Error",
        description: "Presentation name cannot be empty.",
      })
      return
    }

    dispatch(updatePresentationName(id, newPresentationName))
      .then(() => {
        setIsEditingPresentationName(false)
        showToast({
          status: "success",
          title: "Success",
          description: "Presentation name updated successfully.",
        })
      })
      .catch((error) => {
        showToast({
          status: "error",
          title: "Error",
          description: error.message,
        })
      })
  }

  return (
    <Box display="flex" minW={0} alignItems="center" gap="8px">
      {!isEditingPresentationName && (
        <h2
          style={{
            margin: 0,
            minWidth: 0,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            fontSize: "19px",
            lineHeight: 1.2,
            fontWeight: 700,
            letterSpacing: 0,
          }}
        >
          {presentationName}
        </h2>
      )}
      {isEditingPresentationName && (
        <Input
          data-testid="edit-presentation-name-input"
          value={newPresentationName}
          onChange={({ target }) => setNewPresentationName(target.value)}
          width={{ base: "180px", md: "300px" }}
          size="sm"
          fontSize="16px"
          fontWeight={700}
        />
      )}
      {!isEditingPresentationName && (
        <IconButton
          id="edit-presentation-name-button"
          data-testid="edit-presentation-name-button"
          icon={<EditIcon />}
          aria-label="Edit presentation name"
          size="sm"
          variant="muvico-secondary"
          onClick={() => setIsEditingPresentationName(true)}
        />
      )}
      {isEditingPresentationName && (
        <Button
          data-testid="save-presentation-name-button"
          size="sm"
          variant="muvico-primary"
          onClick={handleEditPresentationName}
        >
          Save
        </Button>
      )}
      {isEditingPresentationName && (
        <Button
          data-testid="cancel-edit-presentation-name-button"
          size="sm"
          variant="muvico-secondary"
          onClick={() => setIsEditingPresentationName(false)}
        >
          Cancel
        </Button>
      )}
    </Box>
  )
}

export default PresentationTitle
