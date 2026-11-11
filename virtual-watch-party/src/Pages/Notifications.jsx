import { useEffect, useState } from "react";
import { getNotifications, respondFriendRequest } from "../api";
import "./Notifications.css";

const eventNotifications = [
    {
        id: 1,
        type: "Event",
        name: "Sarah Khan",
        initials: "SK",
        avatar: "sarah",
        time: "2h ago",
        message: "invited you to Inception Watch Party",
        movie: "Inception",
        date: "Today, 08:00 PM",
        participants: "4 Participants",
        poster: "poster-inception",
    },
    {
        id: 2,
        type: "Event",
        name: "Ahmed Raza",
        initials: "AR",
        avatar: "ahmed",
        time: "5h ago",
        message: "invited you to The Batman Watch Party",
        movie: "The Batman",
        date: "Tomorrow, 07:00 PM",
        participants: "4 Participants",
        poster: "poster-batman",
    },
    {
        id: 3,
        type: "Event",
        name: "Maya Ali",
        initials: "MA",
        avatar: "maya",
        time: "1d ago",
        message: "invited you to Interstellar Watch Party",
        movie: "Interstellar",
        date: "20 Apr, 09:30 PM",
        participants: "3 Participants",
        poster: "poster-interstellar",
    },
];

function formatTime(createdAt) {
    const elapsedMinutes = Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000);
    if (elapsedMinutes < 1) return "Just now";
    if (elapsedMinutes < 60) return `${elapsedMinutes}m ago`;
    const elapsedHours = Math.floor(elapsedMinutes / 60);
    if (elapsedHours < 24) return `${elapsedHours}h ago`;
    return `${Math.floor(elapsedHours / 24)}d ago`;
}

function Notifications({ onBack, onFriends }) {
    const [activeFilter, setActiveFilter] = useState("All");
    const [responses, setResponses] = useState({});
    const [friendNotifications, setFriendNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const token = localStorage.getItem("watch-party-token");
        getNotifications(token)
            .then((data) => setFriendNotifications(data.notifications || []))
            .catch((requestError) => setError(requestError.message))
            .finally(() => setLoading(false));
    }, []);

    const visibleNotifications = [...friendNotifications, ...eventNotifications].filter((notification) => (
        activeFilter === "All" || notification.type === activeFilter
    ));

    async function respond(notification, response) {
        if (notification.type === "Social") {
            setError("");
            try {
                const action = response === "Friend request accepted" ? "accept" : "decline";
                const token = localStorage.getItem("watch-party-token");
                await respondFriendRequest(notification.request_id, action, token);
            } catch (requestError) {
                setError(requestError.message);
                return;
            }
        }
        setResponses((current) => ({ ...current, [notification.id]: response }));
    }

    return (
        <main className="dashboard-shell">
            <section className="dashboard-phone notifications-phone" aria-label="Notifications">
                <div className="dashboard-topbar">
                    <span className="time">9:41</span>
                    <div className="status-icons" aria-label="Device status">
                        <span>◔</span>
                        <span>📡</span>
                        <span>◉</span>
                    </div>
                </div>

                <header className="notifications-header">
                    <button className="notifications-back" type="button" onClick={onBack} aria-label="Back to dashboard">‹</button>
                    <h1>Notifications</h1>
                </header>

                <div className="notification-filters" role="tablist" aria-label="Notification filters">
                    {["All", "Event", "Social"].map((filter) => (
                        <button
                            className={activeFilter === filter ? "active" : ""}
                            key={filter}
                            type="button"
                            role="tab"
                            aria-selected={activeFilter === filter}
                            onClick={() => setActiveFilter(filter)}
                        >
                            {filter}
                        </button>
                    ))}
                </div>

                <div className="notifications-list">
                    {error && <p className="invitation-response" role="alert">{error}</p>}
                    {loading && activeFilter !== "Event" && <p className="invitation-response">Loading notifications...</p>}
                    {visibleNotifications.map((notification) => (
                        <article className="notification-item" key={notification.id}>
                            <div className={`notification-avatar avatar-${notification.avatar}`} aria-hidden="true">
                                {notification.initials}
                            </div>
                            <div className="notification-content">
                                <div className="notification-copy">
                                    <p><strong>{notification.name}</strong> {notification.message}</p>
                                    <time>{notification.created_at ? formatTime(notification.created_at) : notification.time}</time>
                                </div>

                                {notification.type === "Event" && (
                                    <div className="invitation-card">
                                        <div className={`invitation-poster ${notification.poster}`} role="img" aria-label={`${notification.movie} poster`} />
                                        <div className="invitation-details">
                                            <h2>{notification.movie}</h2>
                                            <p><span aria-hidden="true">◷</span>{notification.date}</p>
                                            <p><span aria-hidden="true">♧</span>{notification.participants}</p>
                                            {responses[notification.id] ? (
                                                <p className="invitation-response" role="status">{responses[notification.id]}</p>
                                            ) : (
                                                <div className="invitation-actions">
                                                    <button type="button" className="reject-button" onClick={() => respond(notification, "Invitation declined")}>Reject</button>
                                                    <button type="button" className="accept-button" onClick={() => respond(notification, "Invitation accepted")}>Accept</button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {notification.type === "Social" && (
                                    <div className="social-actions">
                                        {notification.kind === "friend_request" && notification.request_status === "pending" && !responses[notification.id] ? (
                                            <>
                                                <button type="button" className="reject-button" onClick={() => respond(notification, "Request declined")}>Ignore</button>
                                                <button type="button" className="accept-button" onClick={() => respond(notification, "Friend request accepted")}>Accept</button>
                                            </>
                                        ) : <p className="invitation-response" role="status">{responses[notification.id] || (notification.kind === "friend_request_accepted" || notification.request_status === "accepted" ? "Friend request accepted" : "Request declined")}</p>}
                                    </div>
                                )}
                            </div>
                        </article>
                    ))}
                </div>

                <footer className="notifications-footer">
                    <button type="button" onClick={onBack}>
                        <span className="notification-nav-icon">⌂</span>
                        Events
                    </button>
                    <button className="active" type="button" aria-current="page">
                        <span className="notification-nav-icon">♧</span>
                        Logs
                    </button>
                    <button type="button" onClick={onFriends}>
                        <span className="notification-nav-icon">♙</span>
                        Friends
                    </button>
                </footer>
            </section>
        </main>
    );
}

export default Notifications;