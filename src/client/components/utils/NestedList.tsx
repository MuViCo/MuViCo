/** NestedList.tsx
 * A reusable component for displaying a nested list of items.
 */

import { List, ListItem } from "@chakra-ui/react"

import type { ListProps } from "@chakra-ui/react"
import type { ReactNode } from "react"

interface NestedListProps extends Omit<ListProps, "children"> {
  items: ReactNode[]
}

const NestedList = ({
  items,
  styleType = "circle",
  ...props
}: NestedListProps) => {
  return (
    <List spacing={2} mb={3} pl={4} styleType={styleType} {...props}>
      {items.map((item, index) => (
        <ListItem key={index}>{item}</ListItem>
      ))}
    </List>
  )
}

export default NestedList
