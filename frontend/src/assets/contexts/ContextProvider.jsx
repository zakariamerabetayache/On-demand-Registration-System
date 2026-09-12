import { useContext } from "react";
import { createContext, useState } from "react";

const StateContext = createContext({
  user: null,

  token: null,
  notification: null,
  setUser: () => {},

  setToken: () => {},
  setNotification: () => [],
});

export const ContextProvider = ({ children }) => {
  const [user, setUser] = useState({});

  const [notification, _setNotification] = useState("");

  const [token, setTokenk] = useState(localStorage.getItem("ACCESS_TOKEN"));
  // const [token,_setToken]=useState(123);

  const setNotification = (message) => {
    _setNotification(message);
    setTimeout(() => {
      _setNotification("");
    }, 5000);
  };
  const setToken = (token) => {
    setTokenk(token);
    if (token) {
      localStorage.setItem("ACCESS_TOKEN", token);
    } else {
      localStorage.removeItem("ACCESS_TOKEN");
    }
  };
  return (
    <StateContext.Provider
      value={{
        user,

        token,
        setUser,

        setToken,
        notification,
        setNotification,
      }}
    >
      {children}
    </StateContext.Provider>
  );
};

export const useStateContext = () => useContext(StateContext);
