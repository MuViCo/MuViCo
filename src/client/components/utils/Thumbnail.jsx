import React, { useMemo } from "react"
import { Box } from "@chakra-ui/react"
import randomLinearGradient from "./randomGradient"

const getFirstFrameCue = (presentation) => {
	const cues = Array.isArray(presentation?.cues) ? presentation.cues : []

	return (          
		cues.find((cue) => (cue.file ? ((cue.file.type === "image/jpeg") || (cue.file.type === "image/png") || (cue.color)) : false)) ||
		null
	)
}

const Thumbnail = ({ presentation, borderRadius = "inherit" }) => {
	const fallbackGradient = useMemo(() => randomLinearGradient(), [])
	const firstFrameCue = getFirstFrameCue(presentation)
	const persistedThumbnail = typeof presentation?.thumbnail === "string" ? presentation.thumbnail : ""

	const file = firstFrameCue?.file
	const fileType = file?.type || ""
	const isVideo = fileType.startsWith("video/")
	const isImage = fileType.startsWith("image/")
	const isBlankImage = Boolean(file?.name && file.name.includes("blank"))

	if (!firstFrameCue || isVideo) {
		return (
			<Box
				position="absolute"
				inset={0}
				borderRadius={borderRadius}
				bg={fallbackGradient}
			/>
		)
	}

	if (isImage && !isBlankImage) {
		const imageUrl = file?.url || (file?.name ? `/${file.name}` : "")

		if (imageUrl) {
			return (
				<Box
					as="img"
					src={imageUrl}
					alt={presentation?.name || "Presentation thumbnail"}
					position="absolute"
					inset={0}
					w="100%"
					h="100%"
					borderRadius={borderRadius}
					objectFit="cover"
				/>
			)
		}
	}

	if (persistedThumbnail) {
		return (
			<Box
				as="img"
				src={persistedThumbnail}
				alt={presentation?.name || "Presentation thumbnail"}
				position="absolute"
				inset={0}
				w="100%"
				h="100%"
				borderRadius={borderRadius}
				objectFit="cover"
			/>
		)
	}

	if (firstFrameCue?.color) {
		return (
			<Box
				position="absolute"
				inset={0}
				borderRadius={borderRadius}
				bg={firstFrameCue.color}
			/>
		)
	}

	return (
		<Box
			position="absolute"
			inset={0}
			borderRadius={borderRadius}
			bg={fallbackGradient}
		/>
	)
}

export default Thumbnail
