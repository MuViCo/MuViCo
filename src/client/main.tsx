import ReactDOM from "react-dom/client"
import { BrowserRouter as Router } from "react-router-dom"
import { Provider } from "react-redux"
import store from "./redux/store"
import "../../styles.css"

import App from "./App"
import { setupAxiosAuthInterceptor } from "./utils/axiosAuthInterceptor"

setupAxiosAuthInterceptor()

// Non-null assertion: index.html always ships the #root div, and the app
// already fails at this exact line today if it is ever missing.
ReactDOM.createRoot(document.getElementById("root")!).render(
  <Provider store={store}>
    <Router>
      <App />
    </Router>
  </Provider>
)
