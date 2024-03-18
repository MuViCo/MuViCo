import React from "react"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import "@testing-library/jest-dom"
import { MemoryRouter } from "react-router-dom";
import HomePage from "../../components/homepage/index"

describe("home", () => {
    test("renders content", () => {
      render(
        <MemoryRouter>
          <HomePage />
        </ MemoryRouter>
      )

    test
    })
})