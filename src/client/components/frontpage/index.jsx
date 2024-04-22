import {
  Container,
  Box,
  Heading,
  useColorModeValue,
  Spacer,
} from "@chakra-ui/react"

const FrontPage = () => (
	<Container>
		<Box
			borderRadius="lg"
			mb={6}
			p={3}
			textAlign="center"
			bg={useColorModeValue("whiteAlpha.500", "whiteAlpha.200")}
			css={{ backdropFilter: "blur(10px)" }}
		>
			<p>
				MuviCo is a multimodal application designed to provide versatile visual
				elements and support functions for live music performances.The purpose of
				the application is to bring an additional dimension to music experiences
				that can complement and enrich the experience for both listeners and
				performers.The program is browser-based and intended to operate on
				computers. The application displays lyrics, images, or AI-generated visuals
				to enhance the musical experience. Additionally, it reflects the lyrics to
				support the singer. All performances can be pre-planned or guided in
				real-time.
			</p>
		</Box>
	</Container>
)

export default FrontPage
