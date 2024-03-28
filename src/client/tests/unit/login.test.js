import React from "react"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import "@testing-library/jest-dom"
import { LoginForm } from "../../components/navbar/Login"

describe("Login", () => {
	test("renders content", () => {
		const onSubmit = jest.fn()
		render(<LoginForm onSubmit={onSubmit} />)
		expect(screen.getByText("Username")).toBeDefined()
		expect(screen.getByText("Password")).toBeDefined()
		expect(screen.getByText("Log in")).toBeDefined()
	})

	it("submits the form with provided values", async () => {
		const onSubmit = jest.fn()
		const { getByLabelText, getByText } = render(
			<LoginForm onSubmit={onSubmit} />
		)

		fireEvent.change(getByLabelText("Username"), {
			target: { value: "testuser" },
		})
		fireEvent.change(getByLabelText("Password"), {
			target: { value: "testpassword" },
		})

		fireEvent.submit(getByText("Log in"))

		await waitFor(() => {
			expect(onSubmit).toHaveBeenCalledTimes(1)
			expect(onSubmit).toHaveBeenCalledWith({
				username: "testuser",
				password: "testpassword",
			})
		})
	})
	test("error message when username or password is empty", async () => {
		const onSubmit = jest.fn()
		const { getByLabelText, getByText } = render(
			<LoginForm onSubmit={onSubmit} />
		)

		fireEvent.change(getByLabelText("Username"), {
			target: { value: "" },
		})
		fireEvent.change(getByLabelText("Password"), {
			target: { value: "" },
		})

		fireEvent.submit(getByText("Log in"))
		await waitFor(() => {
			expect(screen.getByText("Username and password required")).toBeDefined()
		})
	})

	test("error message when username is empty", async () => {
		const onSubmit = jest.fn()
		const { getByLabelText, getByText } = render(
			<LoginForm onSubmit={onSubmit} />
		)

		fireEvent.change(getByLabelText("Username"), {
			target: { value: "" },
		})
		fireEvent.change(getByLabelText("Password"), {
			target: { value: "testpassword" },
		})

		fireEvent.submit(getByText("Log in"))
		await waitFor(() => {
			expect(screen.getByText("Username and password required")).toBeDefined()
		})
	})

	test("error message when password is empty", async () => {
		const onSubmit = jest.fn()
		const { getByLabelText, getByText } = render(
			<LoginForm onSubmit={onSubmit} />
		)

		fireEvent.change(getByLabelText("Username"), {
			target: { value: "testuser" },
		})
		fireEvent.change(getByLabelText("Password"), {
			target: { value: "" },
		})

		fireEvent.submit(getByText("Log in"))
		await waitFor(() => {
			expect(screen.getByText("Password is required")).toBeDefined()
		})
	})
})
