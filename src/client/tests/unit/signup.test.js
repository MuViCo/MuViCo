import React from "react"
import { render, screen, fireEvent } from "@testing-library/react"
import "@testing-library/jest-dom"
import userEvent from "@testing-library/user-event"

import { SignUpForm } from "../../components/navbar/SignUp"

describe("SignUp", () => {
	test("renders content", () => {
		const onSubmit = jest.fn()
		render(<SignUpForm onSubmit={onSubmit} />)
		expect(screen.getByText("Username")).toBeDefined()
		expect(screen.getByText("Password")).toBeDefined()
		expect(screen.getByText("Confirm Password")).toBeDefined()
		expect(screen.getByText("Sign up")).toBeDefined()
	})
	test("submits the form with provided values", async () => {
		const onSubmit = jest.fn()
		render(<SignUpForm onSubmit={onSubmit} />)
		await userEvent.type(screen.getByLabelText("Username"), "testuser")
		await userEvent.type(screen.getByLabelText("Password"), "testpassword")
		await userEvent.type(
			screen.getByLabelText("Confirm Password"),
			"testpassword"
		)
		await userEvent.click(screen.getByText("Sign up"))
		expect(onSubmit).toHaveBeenCalledTimes(1)
		expect(onSubmit).toHaveBeenCalledWith({
			username: "testuser",
			password: "testpassword",
			password_confirmation: "testpassword",
		})
	})
	test("shows error message when username is too short", async () => {
		const onSubmit = jest.fn()
		render(<SignUpForm onSubmit={onSubmit} />)
		await userEvent.type(screen.getByLabelText("Username"), "te")
		await userEvent.click(screen.getByText("Sign up"))
		expect(
			screen.getByText("Username must be at least 3 characters")
		).toBeDefined()
	})
	test("shows error message when password is too short", async () => {
		const onSubmit = jest.fn()
		render(<SignUpForm onSubmit={onSubmit} />)
		await userEvent.type(screen.getByLabelText("Password"), "te")
		await userEvent.click(screen.getByText("Sign up"))
		expect(
			screen.getByText("Password must be at least 3 characters")
		).toBeDefined()
	})
	test("shows error message when password confirmation does not match", async () => {
		const onSubmit = jest.fn()
		render(<SignUpForm onSubmit={onSubmit} />)
		await userEvent.type(screen.getByLabelText("Password"), "testpassword")
		await userEvent.type(
			screen.getByLabelText("Confirm Password"),
			"testpassword2"
		)
		await userEvent.click(screen.getByText("Sign up"))
		expect(screen.getByText("Passwords must match")).toBeDefined()
	})

	test("handleKeyDown shifts focus correctly", () => {
		const onSubmit = jest.fn()
		const { getByLabelText, getByText } = render(
			<SignUpForm onSubmit={onSubmit} />
		)
		const usernameInput = getByLabelText("Username")
		const passwordInput = getByLabelText("Password")
		const passwordAgainInput = getByLabelText("Confirm Password")
		const termsCheckbox = getByText(/By clicking Sign up/i)
		const submitButton = getByText("Sign up")

		fireEvent.keyDown(usernameInput, { key: "Tab" })
		expect(document.activeElement).toBe(passwordInput)

		fireEvent.keyDown(passwordInput, { key: "Tab" })
		expect(document.activeElement).toBe(passwordAgainInput)
	})
})
