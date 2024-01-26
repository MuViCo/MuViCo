import Login from "./components/Login";
import loginService from "./services/login";

const App = () => {
  const handleLogin = async (username, password) => {
    try {
      const user = await loginService.login({ username, password });
      console.log(user);
    } catch (e) {
      console.log(e);
    }
  };

  return (
    <div>
      <Login handleLogin={handleLogin} />
    </div>
  );
};

export default App;
