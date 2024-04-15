import React from "react"
import {
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Heading,
  Text,
  Button,
} from "@chakra-ui/react"

import { motion } from "framer-motion"
import { purple } from "@mui/material/colors"

const InfoCard = ({ title, description }) => (
  <motion.div
    whileHover={{ scale: 1.05 }}
    onHoverStart={(e) => {}}
    onHoverEnd={(e) => {}}
  >
    <Card height="280">
      <CardHeader>
        <Heading size="md">{title}</Heading>
      </CardHeader>
      <CardBody>
        <Text>{description}</Text>
      </CardBody>
      <CardFooter justifyContent="center">
        <Button colorScheme="purple" variant="outline" px={6}>
          Learn more
        </Button>
      </CardFooter>
    </Card>
  </motion.div>
)

export default InfoCard
