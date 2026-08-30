import { useEffect, useMemo, useRef, useState } from "react"
import {
  Box,
  Button,
  Divider,
  FormControl,
  HStack,
  Input,
  Text,
  VStack,
  useColorModeValue,
} from "@chakra-ui/react"
import { AddIcon } from "@chakra-ui/icons"
import {
  deleteScoreDocument,
  importImslpScore,
  uploadScorePdf,
} from "../../redux/presentationReducer"
import { useAppDispatch } from "../../redux/hooks"
import { useCustomToast } from "../utils/toastUtils"
import ScorePdfViewer from "./ScorePdfViewer"

import type { ScoreDocument } from "../../types"
import type { ChangeEvent } from "react"

interface ScorePanelProps {
  presentationId: string
  scores: ScoreDocument[]
}

const getScoreUrl = (score: ScoreDocument) => score.file?.url ?? score.sourceUrl

const getPdfTitle = (file: File) => file.name.replace(/\.pdf$/i, "").trim()

const ScorePanel = ({ presentationId, scores }: ScorePanelProps) => {
  const dispatch = useAppDispatch()
  const showToast = useCustomToast()
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [selectedScoreId, setSelectedScoreId] = useState<string | null>(null)
  const [imslpUrl, setImslpUrl] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const mutedText = useColorModeValue("gray.500", "whiteAlpha.600")
  const importSectionBg = useColorModeValue("whiteAlpha.600", "blackAlpha.300")
  const borderColor = useColorModeValue("purple.200", "whiteAlpha.200")

  /* Keep selection valid when scores list changes */
  useEffect(() => {
    if (!selectedScoreId && scores.length > 0) {
      setSelectedScoreId(scores[0]._id)
      return
    }
    if (selectedScoreId && !scores.some((s) => s._id === selectedScoreId)) {
      setSelectedScoreId(scores[0]?._id ?? null)
    }
  }, [scores, selectedScoreId])

  const selectedScore = useMemo(
    () => scores.find((s) => s._id === selectedScoreId) ?? null,
    [scores, selectedScoreId]
  )

  /* ── Handlers ─────────────────────────────────────────────────────────── */

  const handlePdfUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (!file) return

    setIsSubmitting(true)
    try {
      const score = await dispatch(
        uploadScorePdf(presentationId, {
          file,
          title: getPdfTitle(file) || file.name,
        })
      )
      setSelectedScoreId(score._id)
      showToast({
        title: "Score added",
        description: score.title,
        status: "success",
      })
    } catch (error) {
      showToast({
        title: "Upload failed",
        description:
          error instanceof Error ? error.message : "Unable to upload PDF",
        status: "error",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleImslpImport = async () => {
    const sourceUrl = imslpUrl.trim()
    if (!sourceUrl) {
      showToast({ title: "IMSLP URL required", status: "warning" })
      return
    }
    setIsSubmitting(true)
    try {
      const score = await dispatch(
        importImslpScore(presentationId, { sourceUrl })
      )
      setSelectedScoreId(score._id)
      setImslpUrl("")
      showToast({
        title: "Score imported",
        description: score.title,
        status: "success",
      })
    } catch (error) {
      showToast({
        title: "Import failed",
        description:
          error instanceof Error ? error.message : "Unable to import score",
        status: "error",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteScore = async (score: ScoreDocument) => {
    setIsSubmitting(true)
    try {
      await dispatch(deleteScoreDocument(presentationId, score._id))
      showToast({
        title: "Score removed",
        description: score.title,
        status: "success",
      })
    } catch (error) {
      showToast({
        title: "Removal failed",
        description:
          error instanceof Error ? error.message : "Unable to remove score",
        status: "error",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const openScore = (score: ScoreDocument) => {
    const url = getScoreUrl(score)
    if (!url) return
    window.open(url, "_blank", "noopener,noreferrer")
  }

  /* ── Render ───────────────────────────────────────────────────────────── */

  return (
    <VStack align="stretch" spacing={3} height="100%" overflow="hidden">
      {/* Hidden file input */}
      <Input
        ref={fileInputRef}
        type="file"
        accept="application/pdf,.pdf"
        display="none"
        onChange={handlePdfUpload}
      />

      {/* Viewer — takes all available vertical space */}
      <ScorePdfViewer
        scores={scores}
        selectedScore={selectedScore}
        onSelectScore={setSelectedScoreId}
        onOpenExternal={() => {
          if (selectedScore) openScore(selectedScore)
        }}
        onUpload={() => fileInputRef.current?.click()}
      />

      {/* Delete selected score */}
      {selectedScore && (
        <HStack justify="flex-end" px={1}>
          <Button
            size="xs"
            variant="ghost"
            colorScheme="red"
            isLoading={isSubmitting}
            maxW="100%"
            overflow="hidden"
            title={`Remove "${selectedScore.title}"`}
            onClick={() => handleDeleteScore(selectedScore)}
          >
            <Text fontSize="xs" noOfLines={1} maxW="220px">
              Remove «{selectedScore.title}»
            </Text>
          </Button>
        </HStack>
      )}

      {scores.length === 0 && (
        <>
          <Divider borderColor={borderColor} />

          {/* Import section — only shown when no score is loaded yet */}
          <Box
            bg={importSectionBg}
            border="1px solid"
            borderColor={borderColor}
            borderRadius="8px"
            p={3}
            flex="0 0 auto"
          >
            <HStack justify="space-between" mb={2}>
              <Text
                fontSize="11px"
                fontWeight={700}
                letterSpacing="0.07em"
                textTransform="uppercase"
                color={mutedText}
              >
                Import
              </Text>
            </HStack>

            {/* Upload button */}
            <Button
              leftIcon={<AddIcon />}
              colorScheme="purple"
              variant="outline"
              size="sm"
              width="100%"
              mb={2}
              isLoading={isSubmitting}
              onClick={() => fileInputRef.current?.click()}
            >
              Upload PDF
            </Button>

            {/* IMSLP row */}
            <FormControl>
              <HStack>
                <Input
                  value={imslpUrl}
                  placeholder="https://imslp.org/…"
                  size="sm"
                  onChange={(e) => setImslpUrl(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") void handleImslpImport()
                  }}
                />
                <Button
                  colorScheme="purple"
                  size="sm"
                  flexShrink={0}
                  isLoading={isSubmitting}
                  onClick={handleImslpImport}
                >
                  IMSLP
                </Button>
              </HStack>
            </FormControl>
          </Box>
        </>
      )}
    </VStack>
  )
}

export default ScorePanel
