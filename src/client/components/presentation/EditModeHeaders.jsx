import React from "react"
import {
  Box,
  Text,
  IconButton,
} from "@chakra-ui/react"
import { AddIcon, MinusIcon } from "@chakra-ui/icons"
import { SpeakerIcon, SpeakerMutedIcon } from "../../lib/icons"

const RowHeadersBase = ({
  yLabels,
  gap,
  rowHeight,
  isShowMode,
  screenCount,
  isAudioMuted,
  screenIcon,
  headerActionsRef,
}) => {
  const getScreenNumberFromLabel = (label) => {
    const match = /^Screen\s+(\d+)$/.exec(label)
    return match ? match[1] : null
  }

  return yLabels.map((label, index) => (
    <Box
      key={label}
      display="flex"
      alignItems="center"
      justifyContent="center"
      bg={label === "Audio files" ? "rgb(204, 46, 252)" : "purple.200"}
      border="2px solid #b31bff"
      marginRight={`${gap}px`}
      h={`${rowHeight}px`}
      width="120px"
      position="relative"
    >
      <Box fontWeight="bold" color="black">
        {label === "Audio files" ? (
          <IconButton
            icon={isAudioMuted ? <SpeakerMutedIcon boxSize="55px" /> : <SpeakerIcon boxSize="55px" />}
            disabled={isShowMode}
            _disabled={{
              opacity: 0.7,
              cursor: "not-allowed",
            }}
            sx={{
              width: "65px",
              height: "65px",
              padding: "10px",
            }}
            _hover={{ color: "rgb(99, 76, 107)" }}
            textColor={"black"}
            variant="ghost"
            draggable={false}
            aria-label="Mute/unmute audio"
            title={isAudioMuted ? "Unmute audio" : "Mute audio"}
            onMouseDown={(e) => {
              e.stopPropagation()
              headerActionsRef.current.toggleAudioMute()
            }}
          />
        ) : (
          <Box position="relative" width="65px" height="65px">
            <Box
              as="img"
              src={screenIcon}
              alt=""
              width="65px"
              height="65px"
              aria-hidden="true"
            />
            <Text
              as="span"
              position="absolute"
              top="43%"
              left="50%"
              transform="translate(-50%, -50%)"
              fontSize="24px"
              fontWeight="700"
              lineHeight="1"
              color="black"
              pointerEvents="none"
            >
              {getScreenNumberFromLabel(label)}
            </Text>
          </Box>
        )}
      </Box>

      {label !== "Audio files" && !isShowMode && (
        <>
          {index === screenCount - 1 && screenCount < 8 && (
            <IconButton
              icon={<AddIcon />}
              size="xs"
              variant="solid"
              color="black"
              position="absolute"
              bottom="1px"
              right="1px"
              aria-label="Add screen"
              title="Add screen"
              onClick={() => {
                headerActionsRef.current.increaseScreenCount()
              }}
              _hover={{ bg: "white", borderColor: "white", transform: "scale(1.1)" }}
              _active={{ bg: "white" }}
              boxShadow="0 2px 4px rgba(0,0,0,0.2)"
              zIndex="10"
            />
          )}

          {index === screenCount - 1 && screenCount > 1 && (
            <IconButton
              icon={<MinusIcon />}
              size="xs"
              variant="solid"
              color="black"
              position="absolute"
              top="1px"
              right="1px"
              aria-label="Remove screen"
              title="Remove screen"
              onClick={() => {
                headerActionsRef.current.decreaseScreenCount()
              }}
              _hover={{ bg: "white", borderColor: "white", transform: "scale(1.1)" }}
              _active={{ bg: "white" }}
              boxShadow="0 2px 4px rgba(0,0,0,0.2)"
              zIndex="10"
            />
          )}
        </>
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
        border="2px solid #b31bff"
        h={`${rowHeight}px`}
        width={`${columnWidth}px`}
      >
        <Text fontWeight="bold" color="black">
          {label}
        </Text>
        <IconButton
          icon={<AddIcon />}
          size="xs"
          variant="solid"
          color="black"
          position="absolute"
          bottom="1px"
          right="1px"
          isDisabled={isShowMode || indexCount >= 100}
          aria-label="Add screen"
          title="Add screen"
          onClick={() => {
            headerActionsRef.current.addIndex(index)
          }}
          _hover={{ bg: "white", borderColor: "white", transform: "scale(1.1)" }}
          _active={{ bg: "white" }}
          boxShadow="0 2px 4px rgba(0,0,0,0.2)"
          zIndex="10"
        />
        <IconButton
          icon={<MinusIcon />}
          size="xs"
          variant="solid"
          color="black"
          position="absolute"
          top="1px"
          right="1px"
          isDisabled={isShowMode || indexCount <= 1 || index === 0}
          aria-label="Remove screen"
          title="Remove screen"
          onClick={() => {
            headerActionsRef.current.removeIndex(index)
          }}
          _hover={{ bg: "white", borderColor: "white", transform: "scale(1.1)" }}
          _active={{ bg: "white" }}
          boxShadow="0 2px 4px rgba(0,0,0,0.2)"
          zIndex="10"
        />
      </Box>
    </Box>
  ))
}

export const RowHeaders = React.memo(RowHeadersBase)
export const ColumnHeaders = React.memo(ColumnHeadersBase)
