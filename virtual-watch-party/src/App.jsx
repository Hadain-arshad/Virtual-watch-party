import { useState } from "react";
import Login from "./Pages/Login";
import Signup from "./Pages/Signup";
import Dashboard from "./Pages/Dashboard";
import Notifications from "./Pages/Notifications";
import CreateEvent from "./Pages/CreateEvent";
import EventDetails from "./Pages/EventDetails";
import Settings from "./Pages/Settings";
import Friends from "./Pages/Friends";
import FriendDetails from "./Pages/FriendDetails";
import MoviePlayer from "./Pages/MoviePlayer";
import "./App.css";

function App() {
    const [screen, setScreen] = useState("login");
    const [user, setUser] = useState(null);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [selectedFriend, setSelectedFriend] = useState(null);

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

    function openEventDetails(event) {
        setSelectedEvent(event);
        setScreen("event-details");
    }

    function openFriendDetails(friend) {
        setSelectedFriend(friend);
        setScreen("friend-details");
    }

    if (screen === "dashboard" && user) {
        return <Dashboard user={user} onSignOut={signOut} onNotifications={() => setScreen("notifications")} onSettings={() => setScreen("settings")} onCreateEvent={() => setScreen("create-event")} onOpenEvent={openEventDetails} onFriends={() => setScreen("friends")} />;
    }

    if (screen === "notifications" && user) {
        return <Notifications onBack={() => setScreen("dashboard")} />;
    }

    if (screen === "settings" && user) {
        return <Settings onBack={() => setScreen("dashboard")} />;
    }

    if (screen === "friends" && user) {
        return <Friends onBack={() => setScreen("dashboard")} onOpenFriend={openFriendDetails} />;
    }

    if (screen === "friend-details" && user && selectedFriend) {
        return <FriendDetails friend={selectedFriend} onBack={() => setScreen("friends")} />;
    }

    if (screen === "create-event" && user) {
        return <CreateEvent onBack={() => setScreen("dashboard")} />;
    }

    if (screen === "event-details" && user && selectedEvent) {
        return <EventDetails event={selectedEvent} onBack={() => setScreen("dashboard")} onWatchMovie={() => setScreen("movie-player")} />;
    }

    if (screen === "movie-player" && user) {
        return <MoviePlayer event={selectedEvent} onBack={() => setScreen("dashboard")} />;
    }

    if (screen === "signup") {
        return <Signup setScreen={setScreen} onAuthenticated={handleAuthenticated} />;
    }

    return <Login setScreen={setScreen} onAuthenticated={handleAuthenticated} />;
}

export default App;