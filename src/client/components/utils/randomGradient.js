// Function to generate random color values within a certain range, focusing on darker shades of purple
const randomColor = () => {
  const red = 200 // R: 218
  const blue = 255 // B: 255
  const green = Math.floor(Math.random() * 175) // G: Random value between 0 and 100
  return `rgba(${red}, ${green}, ${blue}, 1)`
}

// Function to generate a random linear gradient
const randomLinearGradient = () => {
  const color1 = randomColor()
  const color2 = randomColor()
  return `linear-gradient(0deg, ${color1} 0%, ${color2} 100%)`
}

export default randomLinearGradient
