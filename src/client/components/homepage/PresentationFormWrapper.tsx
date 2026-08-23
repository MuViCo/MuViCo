import { SimpleGrid, GridItem } from "@chakra-ui/react"
import Togglable from "../utils/Togglable"
import PresentationForm from "./PresentationForm"

import type { RefObject } from "react"
import type { TogglableHandle } from "../utils/Togglable"
import type { CreatePresentationInput } from "../../types"

interface PresentationFormWrapperProps {
  createPresentation: (input: CreatePresentationInput) => void
  togglableRef: RefObject<TogglableHandle | null>
  handleCancel: () => void
}

const PresentationFormWrapper = ({
  createPresentation,
  togglableRef,
  handleCancel,
}: PresentationFormWrapperProps) => (
  <SimpleGrid columns={[1, 2, 3]} gap={10}>
    <GridItem>
      <Togglable
        buttonLabel="New presentation"
        ref={togglableRef}
        buttonId="presentation-form-togglable"
      >
        <PresentationForm
          createPresentation={createPresentation}
          onCancel={handleCancel}
        />
      </Togglable>
    </GridItem>
  </SimpleGrid>
)
export default PresentationFormWrapper
