import ReactDOM from "react-dom/client"
import "bootstrap/dist/css/bootstrap.min.css"
import { BrowserRouter as Router } from "react-router-dom"

import App from "./client/App"

ReactDOM.createRoot(document.getElementById("root")).render(
  <Router>
    <App />
  </Router>
)
