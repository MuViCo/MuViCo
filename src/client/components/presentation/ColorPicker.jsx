/* * This component is a color picker with preset colors. It uses the react-colorful library for the color picker and Chakra UI for styling.
 * The component accepts three props:
 * - color: the current color value
 * - onChange: a function to call when the color changes
 * - presetColors: an array of preset color values to display as swatches
 */

import { HexColorPicker, HexColorInput } from "react-colorful"
import { Box } from "@chakra-ui/react"

export const ColorPickerWithPresets = ({ color, onChange, presetColors }) => {
  return (
    <Box
      className="picker"
      bg="none"
      border="1px solid rgba(130, 130, 130, 0.29)"
      rounded="6px"
      overflow="hidden"
      sx={{
        width: "100%",

        "& .react-colorful": {
          width: "100%",
          height: "140px",
        },
        "& .react-colorful__saturation": {
          borderRadius: "0",
          flex: "1 1 auto",
          minHeight: 0,
        },
        "& .react-colorful__hue": {
          height: "14px",
          borderRadius: "0",
        },
      }}
    >
      <HexColorPicker color={color} onChange={onChange} />
      <HexColorInput
        style={{
          width: "100%",
          backgroundColor: "#2c2c2c",
          color: "#ffffff",
          border: "none",
          padding: "4px 8px",
          fontSize: "12px",
          fontFamily: "monospace",
          display: "block",
          boxSizing: "border-box",
        }}
        color={color}
        prefixed
        onChange={onChange}
      />

      <Box
        className="picker__swatches"
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(8, 1fr)",
          gap: "6px",
          padding: "10px",
          backgroundColor: "transparent",
        }}
      >
        {presetColors.map((presetColor) => (
          <Box
            key={presetColor}
            className="picker__swatch"
            style={{
              background: presetColor,
              aspectRatio: "1/1",
              width: "100%",
              border: "1px solid rgba(0,0,0,0.1)",
              borderRadius: "4px",
              cursor: "pointer",
              boxShadow:
                color === presetColor
                  ? "0 0 0 2px #fff, 0 0 0 4px #9244ff"
                  : "none",
            }}
            onClick={() => onChange(presetColor)}
          />
        ))}
      </Box>
    </Box>
  )
}
