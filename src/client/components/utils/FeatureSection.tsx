/** FeatureSection.tsx
 * A reusable component to display a section of features with a title and a list.
 * Each feature can optionally have a nested list of items.
 */

import { Text, List, ListItem } from "@chakra-ui/react"
import NestedList from "./NestedList"

import type { ElementType } from "react"
import type { FeatureSection as FeatureSectionData } from "../../types"

interface FeatureSectionProps {
  title: string
  data: FeatureSectionData[]
  listAs?: ElementType
  listStyleType?: string
}

const FeatureSection = ({
  title,
  data,
  listAs = "ul",
  listStyleType = "disc",
}: FeatureSectionProps) => {
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
