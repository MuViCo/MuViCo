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

    /**
     * Show mode runs its own surface scale rather than reusing the editor's:
     * a live view is darker and flatter on purpose. The light values keep the
     * same ordering -- canvas behind panels behind controls -- so the layout
     * reads identically in either mode. Colours that are already dark ink on a
     * light chip (chip text, the GO label, the score paper) are left literal in
     * the stylesheet, since they are correct in both modes.
     */
    const show = {
      canvas: mode("#f7f4fb", "#08060a")(props),
      canvasDeep: mode("#efe9f6", "#0d0a11")(props),
      panel: mode("#ffffff", "#100c14")(props),
      surface: mode("#f6f1fc", "#14101a")(props),
      control: mode("#ffffff", "#161020")(props),
      controlAlt: mode("#efe9f6", "#211a28")(props),
      controlIcon: mode("#e9dcfa", "#241333")(props),
      border: mode("#e2d3f5", "#221c2a")(props),
      borderStrong: mode("#d6bcfa", "#2f2637")(props),
      borderDashed: mode("#c9b6e4", "#3a3145")(props),
      borderAccent: mode("#c4a7e7", "#4a2d63")(props),
      borderSubtle: mode("#e2d3f5", "#3a2447")(props),
      segmentActive: mode("#5b21a8", "#3a2d45")(props),
      dotOffline: mode("#b9adc6", "#5b5263")(props),
      toggleKnob: mode("#ffffff", "#0c1a16")(props),
      text: mode("#211926", "#f0e4ff")(props),
      textSecondary: mode("#44337a", "#cbb6dd")(props),
      textMuted: mode("#6b5c73", "#7b6b89")(props),
      textDim: mode("#8a7d97", "#695d73")(props),
      textHover: mode("#4a3f56", "#a995b8")(props),
      heading: mode("#5b21a8", "#e0c9ff")(props),
      live: mode("#c53030", "#e5484d")(props),
      liveText: mode("#9b2c2c", "#ff9a9d")(props),
      liveSurface: mode("#fff5f5", "#1d1016")(props),
      liveBorder: mode("#feb2b2", "#6b2a2c")(props),
      next: mode("#287d6a", "#7fd4bd")(props),
      nextSurface: mode("#dcf0e8", "#101a17")(props),
      nextText: mode("#1c4f42", "#d9f5ec")(props),
      audioSurface: mode("#dcf0e8", "#16302a")(props),
      audioBorder: mode("#b9e0d2", "#22483e")(props),
      audioBorderStrong: mode("#8fcdb8", "#315846")(props),
      go: mode("#1f9d60", "#23b26d")(props),
      pageShadow: mode("rgba(33, 25, 38, 0.16)", "rgba(0, 0, 0, 0.55)")(props),
    }

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
        "--show-canvas": show.canvas,
        "--show-canvas-deep": show.canvasDeep,
        "--show-panel": show.panel,
        "--show-surface": show.surface,
        "--show-control": show.control,
        "--show-control-alt": show.controlAlt,
        "--show-control-icon": show.controlIcon,
        "--show-border": show.border,
        "--show-border-strong": show.borderStrong,
        "--show-border-dashed": show.borderDashed,
        "--show-border-accent": show.borderAccent,
        "--show-border-subtle": show.borderSubtle,
        "--show-segment-active": show.segmentActive,
        "--show-dot-offline": show.dotOffline,
        "--show-toggle-knob": show.toggleKnob,
        "--show-text": show.text,
        "--show-text-secondary": show.textSecondary,
        "--show-text-muted": show.textMuted,
        "--show-text-dim": show.textDim,
        "--show-text-hover": show.textHover,
        "--show-heading": show.heading,
        "--show-live": show.live,
        "--show-live-text": show.liveText,
        "--show-live-surface": show.liveSurface,
        "--show-live-border": show.liveBorder,
        "--show-next": show.next,
        "--show-next-surface": show.nextSurface,
        "--show-next-text": show.nextText,
        "--show-audio-surface": show.audioSurface,
        "--show-audio-border": show.audioBorder,
        "--show-audio-border-strong": show.audioBorderStrong,
        "--show-go": show.go,
        "--show-page-shadow": show.pageShadow,
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
