import { extendTheme } from "@chakra-ui/react"
import { mode } from "@chakra-ui/theme-tools"

import type { ThemeConfig } from "@chakra-ui/react"
import type { StyleFunctionProps } from "@chakra-ui/theme-tools"

const styles = {
  global: (props: StyleFunctionProps) => {
    const canvas = mode("#f7f4fb", "#08060a")(props)
    const surface = mode("#ffffff", "#16101c")(props)
    const control = mode("#ffffff", "#1b1420")(props)
    const controlHover = mode("#f3eafa", "#241333")(props)
    const border = mode("#d6bcfa", "#3a2447")(props)
    const borderStrong = mode("#b794f4", "#572b6e")(props)
    const text = mode("#211926", "#f0e4ff")(props)
    const textSecondary = mode("#44337a", "#cbb6dd")(props)
    const textMuted = mode("#6b5c73", "#7b6b89")(props)
    const audio = mode("#287d6a", "#7fd4bd")(props)
    const audioSurface = mode("#dcf0e8", "#16302a")(props)

    return {
      ":root": {
        "--muvico-canvas": canvas,
        "--muvico-surface": surface,
        "--muvico-control": control,
        "--muvico-control-hover": controlHover,
        "--muvico-border": border,
        "--muvico-border-strong": borderStrong,
        "--muvico-text": text,
        "--muvico-text-secondary": textSecondary,
        "--muvico-text-muted": textMuted,
        "--muvico-audio": audio,
        "--muvico-audio-surface": audioSurface,
      },
      body: {
        bg: canvas,
        color: text,
        transition: "background-color 0.2s ease, color 0.2s ease",
      },
    }
  },
}

const components = {
  Button: {
    variants: {
      "muvico-primary": (props: StyleFunctionProps) => ({
        bg: mode("#805ad5", "#c084fc")(props),
        color: mode("white", "#160b1f")(props),
        border: "1px solid transparent",
        borderRadius: "8px",
        fontWeight: 700,
        _hover: {
          bg: mode("#6b46c1", "#d7a8ff")(props),
        },
        _active: {
          bg: mode("#553c9a", "#a965df")(props),
        },
        _focusVisible: {
          boxShadow: "0 0 0 3px rgba(192, 132, 252, 0.35)",
        },
      }),
      "muvico-secondary": (props: StyleFunctionProps) => ({
        bg: mode("#ffffff", "#1b1420")(props),
        color: mode("#44337a", "#cbb6dd")(props),
        border: "1px solid",
        borderColor: mode("#d6bcfa", "#3a2447")(props),
        borderRadius: "8px",
        fontWeight: 600,
        _hover: {
          bg: mode("#f3eafa", "#241333")(props),
          borderColor: mode("#b794f4", "#572b6e")(props),
          color: mode("#322659", "#f0e4ff")(props),
        },
        _active: {
          bg: mode("#e9d8fd", "#2f2637")(props),
        },
        _focusVisible: {
          boxShadow: "0 0 0 3px rgba(192, 132, 252, 0.25)",
        },
      }),
    },
  },
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

const config: ThemeConfig = {
  initialColorMode: "dark",
  useSystemColorMode: true,
}

const theme = extendTheme({
  config,
  styles,
  components,
  fonts,
  colors: {
    muvico: {
      canvas: "#08060a",
      navbar: "#030002",
      surface: "#16101c",
      panel: "#1b1024",
      control: "#241333",
      controlHover: "#2f2637",
      border: "#3a2447",
      borderStrong: "#572b6e",
      accent: "#c084fc",
      accentStrong: "#bd5bff",
      text: "#f0e4ff",
      textSecondary: "#cbb6dd",
      textMuted: "#7b6b89",
      audio: "#7fd4bd",
      audioSurface: "#16302a",
      danger: "#e5484d",
      paper: "#f7f4ee",
    },
  },
})

export default theme
