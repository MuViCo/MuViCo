import { List, ListItem } from "@chakra-ui/react"

const NestedList = ({ items, styleType = "circle", ...props }) => {
  return (
    <List spacing={2} mb={3} pl={4} styleType={styleType} {...props}>
      {items.map((item, index) => (
        <ListItem key={index}>{item}</ListItem>
      ))}
    </List>
  )
}

export default NestedList
