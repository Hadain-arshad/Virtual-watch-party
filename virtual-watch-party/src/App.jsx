import { useEffect, useState } from "react";
import Login from "./Pages/Login";
import Signup from "./Pages/Signup";
import Dashboard from "./Pages/Dashboard";
import { getCurrentUser } from "./api";
import "./App.css";

function App() {
    const [screen, setScreen] = useState("login");
    const [user, setUser] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem("watch-party-token");
        if (!token) return;

        getCurrentUser(token)
            .then(({ user: currentUser }) => {
                setUser(currentUser);
                setScreen("dashboard");
            })
            .catch(() => {
                localStorage.removeItem("watch-party-token");
                setScreen("login");
            });
    }, []);

    function handleAuthenticated(result) {
        localStorage.setItem("watch-party-token", result.token);
        setUser(result.user);
        setScreen("dashboard");
    }

    function signOut() {
        localStorage.removeItem("watch-party-token");
        setUser(null);
        setScreen("login");
    }

    if (screen === "dashboard" && user) {
        return <Dashboard user={user} onSignOut={signOut} />;
    }

    if (screen === "signup") {
        return <Signup setScreen={setScreen} onAuthenticated={handleAuthenticated} />;
    }

    return <Login setScreen={setScreen} onAuthenticated={handleAuthenticated} />;
}

export default App;