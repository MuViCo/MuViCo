import { SimpleGrid, GridItem } from "@chakra-ui/react"
import Togglable from "../utils/Togglable"
import CreatePresentation from "./CreatePresentation"

const CreatePresentationContainer = ({
  createPresentation,
  togglableRef,
  handleCancel,
}) => (
  <SimpleGrid columns={[1, 2, 3]} gap={10}>
    <GridItem>
      <Togglable
        buttonLabel="New presentation"
        exitLabel="cancel"
        ref={togglableRef}
      >
        <CreatePresentation
          createPresentation={createPresentation}
          onCancel={handleCancel}
        />
      </Togglable>
    </GridItem>
  </SimpleGrid>
)
export default CreatePresentationContainer
