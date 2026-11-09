import { useState } from "react";
import "./Notifications.css";

const notifications = [
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
    {
        id: 4,
        type: "Social",
        name: "Hassan Malik",
        initials: "HM",
        avatar: "hassan",
        time: "2d ago",
        message: "sent you a friend request",
    },
];

function Notifications({ onBack }) {
    const [activeFilter, setActiveFilter] = useState("All");
    const [responses, setResponses] = useState({});

    const visibleNotifications = notifications.filter((notification) => (
        activeFilter === "All" || notification.type === activeFilter
    ));

    function respond(id, response) {
        setResponses((current) => ({ ...current, [id]: response }));
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
                    {visibleNotifications.map((notification) => (
                        <article className="notification-item" key={notification.id}>
                            <div className={`notification-avatar avatar-${notification.avatar}`} aria-hidden="true">
                                {notification.initials}
                            </div>
                            <div className="notification-content">
                                <div className="notification-copy">
                                    <p><strong>{notification.name}</strong> {notification.message}</p>
                                    <time>{notification.time}</time>
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
                                                    <button type="button" className="reject-button" onClick={() => respond(notification.id, "Invitation declined")}>Reject</button>
                                                    <button type="button" className="accept-button" onClick={() => respond(notification.id, "Invitation accepted")}>Accept</button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {notification.type === "Social" && (
                                    <div className="social-actions">
                                        {responses[notification.id] ? (
                                            <p className="invitation-response" role="status">{responses[notification.id]}</p>
                                        ) : (
                                            <>
                                                <button type="button" className="reject-button" onClick={() => respond(notification.id, "Request declined")}>Ignore</button>
                                                <button type="button" className="accept-button" onClick={() => respond(notification.id, "Friend request accepted")}>Accept</button>
                                            </>
                                        )}
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
                    <button type="button">
                        <span className="notification-nav-icon">♙</span>
                        Friends
                    </button>
                </footer>
            </section>
        </main>
    );
}

export default Notifications;