import { ChakraProvider, Box, Container } from "@chakra-ui/react"
import { Routes, Route, Navigate, useNavigate } from "react-router-dom"
import { useState, useEffect } from "react"
import theme from "./lib/theme"
import Fonts from "./lib/fonts"

import NavBar from "./components/navbar"
import FrontPage from "./components/frontpage"
import HomePage from "./components/homepage"
import PresentationPage from "./components/presentation"
import presentationService from "./services/presentations"
import ConnectionPage from "./components/connectionpage"
import TermsPage from "./components/termspage"
import UserMedia from "./components/admin/UserMedia"
import UsersList from "./components/admin/UsersList"

const App = () => {
	const [user, setUser] = useState(null)
	const navigate = useNavigate()
	const [isInitialized, setIsInitialized] = useState(false)

	useEffect(() => {
		const loggedUserJSON = window.localStorage.getItem("user")
		const checkTokenExpiration = async () => {
			try {
				const response = await axios.post("/", {
					headers: {
						Authorization: `Bearer ${localStorage.getItem("userToken")}`,
					},
				})
				console.log(response.data.isValid)
				if (!response.data.isValid) {
					localStorage.removeItem("userToken")
				}
			} catch (error) {
				console.error("Error checking token validity:", error)
			}
		}
		if (loggedUserJSON) {
			const parsedUser = JSON.parse(loggedUserJSON)
			const isTokenExpired = checkTokenExpiration()
			console.log(isTokenExpired, "vanhwntunut")
			console.log(parsedUser)
			if (isTokenExpired) {
				// Token on vanhentunut, tee tarvittavat toimenpiteet
				// esim. kirjaa käyttäjä ulos
				window.localStorage.removeItem("user")
				navigate("/")
				console.log("true")
			} else {
				setUser(parsedUser)
			}
		}

		setIsInitialized(true)
	}, [setUser])

	if (!isInitialized) {
		return <div>Loading...</div>
	}

	return (
		<ChakraProvider theme={theme}>
			<Fonts />
			<Box>
				<NavBar user={user} setUser={setUser} />
				<Container pt={20} maxW="container.xl">
					<Routes>
						<Route path="/" element={<FrontPage />} />
						<Route
							path="/home"
							element={user ? <HomePage user={user} /> : <Navigate to="/" />}
						/>
						<Route
							path="/presentation/:id"
							element={
								user ? <PresentationPage userId={user.id} /> : <Navigate to="/" />
							}
						/>
						<Route
							path="/connections"
							element={user ? <ConnectionPage /> : <Navigate to="/" />}
						></Route>
						<Route
							path="/users"
							element={user && user.isAdmin ? <UsersList /> : <Navigate to="/" />}
						/>
						<Route
							path="/media"
							element={user && user.isAdmin ? <UserMedia /> : <Navigate to="/" />}
						/>
						<Route path="/terms" element={<TermsPage />} />
					</Routes>
				</Container>
			</Box>
		</ChakraProvider>
	)
}

export default App
