import { render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import "@testing-library/jest-dom"
import React from "react"
import NavBar from "../../components/navbar/index"

describe("logout", () => {
	test("render content", () => {
		const setUser = jest.fn()
		const navigate = jest.fn()
		render(
			<MemoryRouter>
				<NavBar user={{ username: "testuser" }} setUser={setUser} />
			</MemoryRouter>
		)
		expect(screen.getByText("Logout")).toBeDefined()
	})
})
