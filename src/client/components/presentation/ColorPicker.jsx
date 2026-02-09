import React from "react";
import { HexColorPicker, HexColorInput } from "react-colorful";
import { Box } from "@chakra-ui/react";



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
            <HexColorInput style={{width: "100%"}} color={color} prefixed onChange={onChange} />
            
            <Box
            
                className="picker__swatches"
                sx={{
                    display: "flex",
                    padding: "12px",
                    flexWrap: "wrap",
                }}
            >
                
                {presetColors.map((presetColor) => (
                    <button
                        key={presetColor}
                        className="picker__swatch"
                        style={{
                            background: presetColor,
                            width: "24px",
                            height: "24px",
                            margin: "4px",
                            border: "none",
                            padding: "0",
                            borderRadius: "4px",
                            cursor: "pointer",
                            outline: "none",
                        }}
                        onClick={() => onChange(presetColor)}
                    />
                ))}
                
            </Box>
        </Box>
    );
};