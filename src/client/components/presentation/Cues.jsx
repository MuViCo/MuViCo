import {
	FormControl,
	FormLabel,
	NumberInput,
	NumberInputField,
	NumberInputStepper,
	NumberIncrementStepper,
	FormHelperText,
	NumberDecrementStepper,
	Input,
	Box,
	Button,
} from "@chakra-ui/react"
import { useState } from "react"

const CuesForm = ({ addCue }) => {
	const [file, setFile] = useState(null)
	const [index, setIndex] = useState(0)
	const [cueName, setCueName] = useState("")
	const [screen, setScreen] = useState(0)

	const onAddCue = () => {
		console.log(file)
		console.log(index)
		console.log(fileName)
		console.log(screen)
		setFile(null)
		setFileName("")
		setIndex(0)
		setScreen(0)
	}

	const fileSelected = (event) => {
		const selected = event.target.files[0]
		setFile(selected)
	}

	console.log("moi")
	return (
		<FormControl as="fieldset">
			<FormLabel as="legend">Add cue</FormLabel>
			<FormHelperText>Index</FormHelperText>
			<NumberInput value={index} min={1} max={350} onChange={setIndex}>
				<NumberInputField />
				<NumberInputStepper>
					<NumberIncrementStepper />
					<NumberDecrementStepper />
				</NumberInputStepper>
			</NumberInput>
			<FormHelperText>Name</FormHelperText>
			<Input
				value={cueName}
				placeholder="Cue name"
				onChange={(e) => setCueName(e.target.value)}
			/>
			<FormHelperText>Screen</FormHelperText>
			<NumberInput value={screen} min={1} max={4} onChange={setScreen}>
				<NumberInputField />
				<NumberInputStepper>
					<NumberIncrementStepper />
					<NumberDecrementStepper />
				</NumberInputStepper>
			</NumberInput>
			<Input type="file" onChange={fileSelected} />
			<Button type="submit">Submit</Button>
		</FormControl>
	)
}

export default CuesForm
