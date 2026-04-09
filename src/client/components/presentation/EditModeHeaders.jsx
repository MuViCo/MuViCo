import React from "react"
import {
  Box,
  Text,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Portal,
} from "@chakra-ui/react"
import { AddIcon, ChevronDownIcon, MinusIcon } from "@chakra-ui/icons"
import { SpeakerIcon, SpeakerMutedIcon } from "../../lib/icons"

const RowHeadersBase = ({
  yLabels,
  gap,
  rowHeight,
  columnWidth,
  isShowMode,
  screenCount,
  isAudioMuted,
  headerActionsRef,
}) => {
  return yLabels.map((label, index) => (
    <Box
      key={label}
      display="flex"
      alignItems="center"
      justifyContent="center"
      bg={label === "Audio files" ? "rgb(204, 46, 252)" : "purple.200"}
      borderRadius="md"
      marginRight={`${gap}px`}
      h={`${rowHeight}px`}
      width={`${columnWidth}px`}
      position="relative"
    >
      <Text fontWeight="bold" color="black">
        {label}
      </Text>

      {label !== "Audio files" && !isShowMode && (
        <>
          {index === screenCount - 1 && screenCount < 8 && (
            <IconButton
              icon={<AddIcon />}
              size="sm"
              colorScheme="green"
              variant="solid"
              bg="white"
              color="green.600"
              border="2px solid"
              borderColor="green.500"
              position="absolute"
              bottom="4px"
              right="4px"
              aria-label="Add screen"
              title="Add screen"
              onClick={() => {
                headerActionsRef.current.increaseScreenCount()
              }}
              _hover={{ bg: "green.50", borderColor: "green.600", transform: "scale(1.1)" }}
              _active={{ bg: "green.100" }}
              boxShadow="0 2px 4px rgba(0,0,0,0.2)"
              zIndex="10"
            />
          )}

          {index === screenCount - 1 && screenCount > 1 && (
            <IconButton
              icon={<MinusIcon />}
              size="sm"
              colorScheme="red"
              variant="solid"
              bg="white"
              color="red.600"
              border="2px solid"
              borderColor="red.500"
              position="absolute"
              top="4px"
              right="4px"
              aria-label="Remove screen"
              title="Remove screen"
              onClick={() => {
                headerActionsRef.current.decreaseScreenCount()
              }}
              _hover={{ bg: "red.50", borderColor: "red.600", transform: "scale(1.1)" }}
              _active={{ bg: "red.100" }}
              boxShadow="0 2px 4px rgba(0,0,0,0.2)"
              zIndex="10"
            />
          )}
        </>
      )}

      {label === "Audio files" && (
        <IconButton
          icon={isAudioMuted ? <SpeakerMutedIcon boxSize="32px" /> : <SpeakerIcon boxSize="32px" />}
          disabled={isShowMode}
          _disabled={{
            opacity: 0.7,
            cursor: "not-allowed",
          }}
          sx={{
            width: "48px",
            height: "48px",
            padding: "10px",
          }}
          _hover={{ color: "rgb(99, 76, 107)" }}
          textColor={"black"}
          variant="ghost"
          draggable={false}
          position="absolute"
          zIndex="10"
          top="0px"
          right="0px"
          aria-label="Mute/unmute audio"
          title={isAudioMuted ? "Unmute audio" : "Mute audio"}
          onMouseDown={(e) => {
            e.stopPropagation()
            headerActionsRef.current.toggleAudioMute()
          }}
        />
      )}
    </Box>
  ))
}

const ColumnHeadersBase = ({
  xLabels,
  cueIndex,
  bgCurrentFrame,
  bgColorIndex,
  rowHeight,
  columnWidth,
  isShowMode,
  indexCount,
  headerActionsRef,
}) => {
  return xLabels.map((label, index) => (
    <Box
      key={label}
      position="relative"
      display="inline-flex"
      alignItems="center"
      justifyContent="center"
    >
      <Box
        className="x-index-label"
        display="flex"
        alignItems="center"
        justifyContent="center"
        bg={index === cueIndex ? bgCurrentFrame : bgColorIndex}
        borderRadius="md"
        h={`${rowHeight}px`}
        width={`${columnWidth}px`}
      >
        <Text fontWeight="bold" color="black">
          {label}
        </Text>
        <Menu>
          <MenuButton
            isDisabled={isShowMode}
            as={IconButton}
            aria-label="Options"
            icon={<ChevronDownIcon />}
            variant="outline"
            position="absolute"
            zIndex="10"
            top="2px"
            right="2px"
            size="xs"
            backgroundColor="var(--chakra-colors-gray-700)"
            _hover={{ backgroundColor: "var(--chakra-colors-gray-600)" }}
            _active={{ backgroundColor: "var(--chakra-colors-gray-600)" }}
          />
          <Portal>
            <MenuList
              backgroundColor="var(--chakra-colors-gray-700)"
              margin="-5px 0 0 -166px"
              padding="10px 10px 0 10px"
              minW="none"
              display="flex"
              flexDirection="column"
            >
              <MenuItem
                onClick={() => {
                  headerActionsRef.current.removeIndex(index)
                }}
                isDisabled={indexCount <= 1 || index === 0}
                backgroundColor="var(--chakra-colors-red-600)"
                color="white"
                _hover={{ backgroundColor: "var(--chakra-colors-red-700)" }}
                borderRadius="5px"
                fontWeight={700}
                display="block"
                textAlign="center"
              >
                Delete Frame
              </MenuItem>
              <MenuItem
                onClick={() => {
                  headerActionsRef.current.addIndex(index)
                }}
                isDisabled={indexCount >= 100}
                marginTop="10px"
                marginBottom="10px"
                backgroundColor="var(--chakra-colors-green-600)"
                color="white"
                _hover={{ backgroundColor: "var(--chakra-colors-green-700)" }}
                borderRadius="5px"
                fontWeight={700}
                display="block"
                textAlign="center"
              >
                Add Frame After
              </MenuItem>
            </MenuList>
          </Portal>
        </Menu>
      </Box>
    </Box>
  ))
}

export const RowHeaders = React.memo(RowHeadersBase)
export const ColumnHeaders = React.memo(ColumnHeadersBase)
