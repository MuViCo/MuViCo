/*
 * Shared context menu for timeline cues.
 * Chakra UI v2 has no context-trigger primitive, so an invisible fixed
 * MenuButton anchors the menu at the pointer coordinates supplied by the grid.
 */
import {
  Menu,
  MenuButton,
  MenuDivider,
  MenuGroup,
  MenuItem,
  MenuList,
  Portal,
  useColorModeValue,
} from "@chakra-ui/react"
import { useEffect, useRef } from "react"
import {
  ArrowForwardIcon,
  CopyIcon,
  DeleteIcon,
  EditIcon,
  ExternalLinkIcon,
  RepeatIcon,
  TimeIcon,
} from "@chakra-ui/icons"

import { CUE_FRAME_PRESETS } from "../utils/cueFrame"

import type { CueFrame } from "../utils/cueFrame"
import type { Cue } from "../../types"

export interface CueContextMenuState {
  cue: Cue
  x: number
  y: number
  returnFocusTo: HTMLElement | null
}

interface CueContextMenuProps {
  state: CueContextMenuState | null
  onClose: () => void
  onEdit: (cue: Cue) => void
  onCopy: (cue: Cue) => void
  onDelete: (cue: Cue) => void
  onToggleLoop: (cue: Cue) => void | Promise<void>
  onToggleContinuePlayback: (cue: Cue) => void | Promise<void>
  onOpenMultiScreen: (cue: Cue) => void
  onSetCueFrame?: (cue: Cue, frame: CueFrame) => void
}

const CueContextMenu = ({
  state,
  onClose,
  onEdit,
  onCopy,
  onDelete,
  onToggleLoop,
  onToggleContinuePlayback,
  onOpenMultiScreen,
  onSetCueFrame,
}: CueContextMenuProps) => {
  const menuListRef = useRef<HTMLDivElement>(null)
  const menuBg = useColorModeValue("white", "#18111f")
  const menuBorder = useColorModeValue("purple.200", "#3a2447")
  const menuText = useColorModeValue("gray.800", "whiteAlpha.900")
  const itemHoverBg = useColorModeValue(
    "purple.50",
    "rgba(192, 132, 252, 0.12)"
  )
  const itemActiveBg = useColorModeValue(
    "purple.100",
    "rgba(192, 132, 252, 0.2)"
  )
  const dangerText = useColorModeValue("red.600", "red.300")
  const dangerHoverBg = useColorModeValue("red.50", "rgba(229, 72, 77, 0.16)")

  useEffect(() => {
    if (!state) return

    const focusTimer = window.setTimeout(
      () => menuListRef.current?.focus({ preventScroll: true }),
      0
    )

    return () => window.clearTimeout(focusTimer)
  }, [state])

  if (!state) return null

  const { cue, x, y, returnFocusTo } = state

  const closeAndRestoreFocus = () => {
    onClose()
    window.setTimeout(() => returnFocusTo?.focus({ preventScroll: true }), 0)
  }

  const itemHover = { bg: itemHoverBg }

  return (
    <Menu
      key={`${cue._id}-${x}-${y}`}
      isOpen
      isLazy
      autoSelect={false}
      placement="bottom-start"
      strategy="fixed"
      gutter={4}
      onClose={closeAndRestoreFocus}
    >
      <MenuButton
        data-testid="cue-context-menu-anchor"
        aria-label={`Context actions for ${cue.name}`}
        position="fixed"
        left={`${x}px`}
        top={`${y}px`}
        boxSize="1px"
        minWidth="1px"
        padding={0}
        border={0}
        opacity={0}
        pointerEvents="none"
        tabIndex={-1}
      />

      <Portal>
        <MenuList
          ref={menuListRef}
          data-testid="cue-context-menu"
          minWidth="210px"
          padding={1}
          bg={menuBg}
          color={menuText}
          borderColor={menuBorder}
          borderRadius="10px"
          boxShadow="0 14px 34px rgba(0, 0, 0, 0.32)"
          overflow="hidden"
        >
          <MenuItem
            icon={<EditIcon boxSize={4} />}
            minHeight="36px"
            paddingX={3}
            paddingY={2}
            bg="transparent"
            borderRadius="md"
            fontSize="sm"
            fontWeight="500"
            _focus={itemHover}
            _hover={itemHover}
            _active={{ bg: itemActiveBg }}
            aria-label={`Edit ${cue.name}`}
            title="Edit element"
            onClick={() => onEdit(cue)}
          >
            Edit
          </MenuItem>
          <MenuItem
            icon={<CopyIcon boxSize={4} />}
            minHeight="36px"
            paddingX={3}
            paddingY={2}
            bg="transparent"
            borderRadius="md"
            fontSize="sm"
            fontWeight="500"
            _focus={itemHover}
            _hover={itemHover}
            _active={{ bg: itemActiveBg }}
            aria-label={`Copy ${cue.name}`}
            title="Copy element"
            onClick={() => onCopy(cue)}
          >
            Copy
          </MenuItem>

          {cue.file != null && cue.cueType === "visual" && (
            <MenuItem
              icon={<ExternalLinkIcon boxSize={4} />}
              minHeight="36px"
              paddingX={3}
              paddingY={2}
              bg="transparent"
              borderRadius="md"
              fontSize="sm"
              fontWeight="500"
              _focus={itemHover}
              _hover={itemHover}
              _active={{ bg: itemActiveBg }}
              aria-label={`Multi-screen ${cue.name}`}
              title="Span across multiple screens"
              onClick={() => onOpenMultiScreen(cue)}
            >
              Span across screens
            </MenuItem>
          )}

          {onSetCueFrame && cue.cueType === "visual" && (
            <MenuGroup title="Position on screen" fontSize="xs" marginX={3}>
              {CUE_FRAME_PRESETS.map((preset) => (
                <MenuItem
                  key={preset.label}
                  minHeight="32px"
                  paddingX={3}
                  paddingY={1}
                  bg="transparent"
                  borderRadius="md"
                  fontSize="sm"
                  _focus={itemHover}
                  _hover={itemHover}
                  _active={{ bg: itemActiveBg }}
                  aria-label={`${preset.label} position for ${cue.name}`}
                  onClick={() => onSetCueFrame(cue, preset.frame)}
                >
                  {preset.label}
                </MenuItem>
              ))}
            </MenuGroup>
          )}

          {cue.file != null && cue.cueType === "audio" && (
            <>
              <MenuItem
                icon={
                  cue.loop ? (
                    <RepeatIcon boxSize={4} />
                  ) : (
                    <ArrowForwardIcon boxSize={4} />
                  )
                }
                minHeight="36px"
                paddingX={3}
                paddingY={2}
                bg="transparent"
                borderRadius="md"
                fontSize="sm"
                fontWeight="500"
                _focus={itemHover}
                _hover={itemHover}
                _active={{ bg: itemActiveBg }}
                aria-label={`Loop audio ${cue.name}`}
                title={cue.loop ? "Disable loop" : "Enable loop"}
                onClick={() => void onToggleLoop(cue)}
              >
                {cue.loop ? "Disable loop" : "Enable loop"}
              </MenuItem>
              <MenuItem
                icon={<TimeIcon boxSize={4} />}
                minHeight="36px"
                paddingX={3}
                paddingY={2}
                bg="transparent"
                borderRadius="md"
                fontSize="sm"
                fontWeight="500"
                _focus={itemHover}
                _hover={itemHover}
                _active={{ bg: itemActiveBg }}
                aria-label={`Continue audio ${cue.name}`}
                title={
                  cue.continuePlayback
                    ? "Disable continuous playback"
                    : "Enable continuous playback"
                }
                onClick={() => void onToggleContinuePlayback(cue)}
              >
                {cue.continuePlayback
                  ? "Disable continuous playback"
                  : "Enable continuous playback"}
              </MenuItem>
            </>
          )}

          <MenuDivider marginY={1} borderColor={menuBorder} />

          <MenuItem
            icon={<DeleteIcon boxSize={4} />}
            minHeight="36px"
            paddingX={3}
            paddingY={2}
            bg="transparent"
            borderRadius="md"
            fontSize="sm"
            fontWeight="500"
            color={dangerText}
            _focus={{ bg: dangerHoverBg }}
            _hover={{ bg: dangerHoverBg }}
            _active={{ bg: dangerHoverBg }}
            aria-label={`Delete ${cue.name}`}
            title="Delete element"
            onClick={() => onDelete(cue)}
          >
            Delete
          </MenuItem>
        </MenuList>
      </Portal>
    </Menu>
  )
}

export default CueContextMenu
