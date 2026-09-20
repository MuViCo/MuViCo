import {
  Button,
  Flex,
  Icon,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
  useClipboard,
  useDisclosure,
} from "@chakra-ui/react"
import { FiLink } from "react-icons/fi"
import { useState } from "react"

import { useAppDispatch, useAppSelector } from "../../redux/hooks"
import {
  disablePresentationSharing,
  enablePresentationSharing,
} from "../../redux/presentationReducer"
import { useCustomToast } from "../utils/toastUtils"

const shareUrlFor = (shareToken: string | null) =>
  shareToken ? `${window.location.origin}/shared/${shareToken}` : ""

const SharePresentationButton = ({
  presentationId,
}: {
  presentationId: string
}) => {
  const { isOpen, onOpen, onClose } = useDisclosure()
  const dispatch = useAppDispatch()
  const showToast = useCustomToast()
  const shareToken = useAppSelector((state) => state.presentation.shareToken)
  const [isBusy, setIsBusy] = useState(false)

  const shareUrl = shareUrlFor(shareToken)
  const { onCopy, hasCopied } = useClipboard(shareUrl)

  const run = async (action: () => Promise<unknown>) => {
    setIsBusy(true)
    try {
      await action()
    } catch (error) {
      showToast({
        status: "error",
        title: "Sharing failed",
        description: error instanceof Error ? error.message : undefined,
      })
    } finally {
      setIsBusy(false)
    }
  }

  return (
    <>
      <Button
        className="edit-mode-btn edit-mode-btn-share"
        variant="muvico-secondary"
        leftIcon={<Icon as={FiLink} />}
        onClick={onOpen}
      >
        Share
      </Button>

      <Modal isCentered isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Share this presentation</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {shareToken ? (
              <>
                <Text mb={3}>
                  Anyone with this link can view the presentation, as long as
                  they are logged in to MuViCo. They cannot edit it.
                </Text>
                <Flex gap={2}>
                  <Input
                    readOnly
                    value={shareUrl}
                    aria-label="Share link"
                    onFocus={(event) => event.target.select()}
                  />
                  <Button onClick={onCopy} colorScheme="purple">
                    {hasCopied ? "Copied" : "Copy"}
                  </Button>
                </Flex>
              </>
            ) : (
              <Text>
                This presentation is private. Create a link to let other MuViCo
                users view it, read-only.
              </Text>
            )}
          </ModalBody>
          <ModalFooter gap={2}>
            {shareToken ? (
              <Button
                variant="outline"
                colorScheme="red"
                isLoading={isBusy}
                onClick={() =>
                  run(async () => {
                    await dispatch(disablePresentationSharing(presentationId))
                    showToast({
                      status: "success",
                      title: "Sharing stopped",
                      description: "The old link no longer works.",
                    })
                  })
                }
              >
                Stop sharing
              </Button>
            ) : (
              <Button
                colorScheme="purple"
                isLoading={isBusy}
                onClick={() =>
                  run(() => dispatch(enablePresentationSharing(presentationId)))
                }
              >
                Create link
              </Button>
            )}
            <Button onClick={onClose}>Close</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  )
}

export default SharePresentationButton
