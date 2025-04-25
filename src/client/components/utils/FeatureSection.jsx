import { Text, List, ListItem } from "@chakra-ui/react"
import NestedList from "./NestedList"

const FeatureSection = ({
  title,
  data,
  listAs = "ul",
  listStyleType = "disc",
}) => {
  return (
    <>
      <Text fontWeight="bold" mb={1}>
        {title}
      </Text>
      <List spacing={2} mb={3} pl={4} as={listAs} styleType={listStyleType}>
        {data.map((feature, idx) => (
          <ListItem key={idx}>
            {feature.title}
            {feature.items && <NestedList items={feature.items} />}
          </ListItem>
        ))}
      </List>
    </>
  )
}

export default FeatureSection
