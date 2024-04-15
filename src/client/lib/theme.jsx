import { extendTheme } from "@chakra-ui/react"
import { mode } from "@chakra-ui/theme-tools"

const styles = {
  global: (props) => ({
    body: {
      bg: mode("#ffffff", "#000000")(props),
      // bgGradient: "radial(circle, rgba(118,31,78,1) 0%, rgba(0,0,0,0) 61%)",
      transition: "background-color 1s ease-in-out",
    },
  }),
}

const components = {
  Heading: {
    variants: {
      "section-title": {
        textDecoration: "underline",
        fontSize: 20,
        textUnderlineOffset: 6,
        textDecorationColor: "#525252",
        textDecorationThickness: 4,
        marginTop: 3,
        marginBottom: 4,
      },
    },
  },
}

const fonts = {
  heading: "'Poppins', sans-serif",
  body: "'Poppins', sans-serif",
}

const config = {
  initialColorMode: "dark",
  useSystemColorMode: true,
}

const theme = extendTheme({
  config,
  styles,
  components,
  fonts,
})

export default theme
