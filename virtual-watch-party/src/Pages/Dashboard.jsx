import { useEffect, useState } from "react";
import { getDashboardData } from "../api";

const defaultDashboard = {
    myEvents: [
        {
            id: "evt-1",
            title: "Inception",
            host: "Hosted by You",
            date: "Today, 08:00 PM",
            participants: "4/6 Participants",
            status: "Upcoming",
            posterClass: "poster-inception",
        },
        {
            id: "evt-2",
            title: "Interstellar",
            host: "Hosted by You",
            date: "Friday, 09:30 PM",
            participants: "3/5 Participants",
            status: "Soon",
            posterClass: "poster-interstellar",
        },
    ],

    joinedEvents: [
        {
            id: "join-1",
            title: "The Batman",
            host: "Hosted by Ahmed Raza",
            date: "Tomorrow, 07:00 PM",
            participants: "3/5 Participants",
            status: "Upcoming",
            posterClass: "poster-batman",
        },
        {
            id: "join-2",
            title: "Dune",
            host: "Hosted by Sarah Khan",
            date: "28 Apr, 09:30 PM",
            participants: "5/6 Participants",
            status: "Upcoming",
            posterClass: "poster-dune",
        },
    ],
};

function Dashboard({ user, onSignOut }) {
    const [data, setData] = useState(defaultDashboard);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem("watch-party-token");

        if (!token) {
            onSignOut();
            return;
        }

        getDashboardData(token)
            .then((dashboardData) => {
                if (dashboardData?.my_events?.length || dashboardData?.joined_events?.length) {
                    setData({
                        myEvents: dashboardData.my_events,
                        joinedEvents: dashboardData.joined_events,
                    });
                }
            })
            .catch(() => {
                setData(defaultDashboard);
            })
            .finally(() => setLoading(false));
    }, [onSignOut]);

    const initials = (user?.full_name || "User").charAt(0).toUpperCase();

    return (
        <div className="dashboard-shell">
            <div className="dashboard-phone">
                <div className="dashboard-topbar">
                    <span className="time">9:41</span>
                    <div className="status-icons" aria-label="Device status">
                        <span>◔</span>
                        <span>📡</span>
                        <span>◉</span>
                    </div>
                </div>

                <header className="dashboard-header">
                    <div className="user-badge" aria-label="User avatar">{initials}</div>

                    <div className="app-brand" aria-label="Virtual Watch Party logo">
                        <span className="brand-icon" aria-hidden="true" />
                        <h1>Virtual<br />Watch Party</h1>
                    </div>

                    <div className="user-badge secondary" aria-label="Notifications">🔔</div>
                </header>

                <div className="dashboard-toolbar">
                    <button className="toolbar-button" type="button">
                        <span>＋ Create Event</span>
                    </button>
                </div>

                <section>
                    <div className="section-header">
                        <h2><span className="section-icon">◔</span> My Events</h2>
                        <a href="#" className="see-all">See All</a>
                    </div>

                    <div className="event-list">
                        {(loading ? defaultDashboard.myEvents : data.myEvents).map((event) => (
                            <article className="event-card" key={event.id}>
                                <div className={`poster ${event.posterClass || event.poster_class || "poster-inception"}`} aria-label={`${event.title} poster`} />

                                <div className="event-info">
                                    <div className="event-title">{event.title}</div>
                                    <div className="event-host">{event.host}</div>
                                    <div className="event-meta">
                                        <span className="meta-icon">◌</span>
                                        <span className="meta-text">{event.date}</span>
                                    </div>
                                    <div className="event-meta">
                                        <span className="meta-icon">▣</span>
                                        <span className="meta-text">{event.participants}</span>
                                    </div>
                                </div>

                                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
                                    <span className="event-status">{event.status}</span>
                                    <span className="event-menu">⋮</span>
                                </div>
                            </article>
                        ))}
                    </div>
                </section>

                <section>
                    <div className="section-header">
                        <h2><span className="section-icon">◉</span> Joined Events</h2>
                        <a href="#" className="see-all">See All</a>
                    </div>

                    <div className="event-list">
                        {(loading ? defaultDashboard.joinedEvents : data.joinedEvents).map((event) => (
                            <article className="event-card" key={event.id}>
                                <div className={`poster ${event.posterClass || event.poster_class || "poster-batman"}`} aria-label={`${event.title} poster`} />

                                <div className="event-info">
                                    <div className="event-title">{event.title}</div>
                                    <div className="event-host">{event.host}</div>
                                    <div className="event-meta">
                                        <span className="meta-icon">◌</span>
                                        <span className="meta-text">{event.date}</span>
                                    </div>
                                    <div className="event-meta">
                                        <span className="meta-icon">▣</span>
                                        <span className="meta-text">{event.participants}</span>
                                    </div>
                                </div>

                                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
                                    <span className="event-status">{event.status}</span>
                                    <span className="event-menu">⋮</span>
                                </div>
                            </article>
                        ))}
                    </div>
                </section>

                <footer className="dashboard-footer">
                    <div className="nav-item active">
                        <span className="nav-icon">⌂</span>
                        <span>Events</span>
                    </div>
                    <div className="nav-item">
                        <span className="nav-icon">◍</span>
                        <span>Friends</span>
                    </div>
                </footer>
            </div>
        </div>
    );
}

export default Dashboard;
