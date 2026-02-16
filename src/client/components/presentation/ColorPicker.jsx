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
        outline="solid 1px #8282824a"
        rounded={"9px"}
        sx={{
            width: "100%",

            "& .react-colorful": {
                width: "auto",
            },
        }}
        >
            <HexColorPicker color={color} onChange={onChange} />
            <HexColorInput style={{width: "100%", outline: "1px solid #8282824a"}} color={color} prefixed onChange={onChange} />
            
            <Box
            
                className="picker__swatches"
                sx={{
                    display: "flex",
                    padding: "12px",
                    flexWrap: "wrap",
                }}
            >
                
                {presetColors.map((presetColor) => (
                    <Box
                        key={presetColor}
                        className="picker__swatch"
                        style={{
                            background: presetColor,
                            width: "24px",
                            height: "24px",
                            margin: "4px",
                            border: "none",
                            padding: "1px",
                            borderRadius: "4px",
                            cursor: "pointer",
                            outline: "1px solid #8282824a",
                        }}
                        onClick={() => onChange(presetColor)}
                    />
                ))}
                
            </Box>
        </Box>
    )
}