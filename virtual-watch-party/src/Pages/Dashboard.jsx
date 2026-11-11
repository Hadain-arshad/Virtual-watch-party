import { useEffect, useState } from "react";
import { getDashboardData } from "../api";

function Dashboard({ user, onSignOut, onNotifications, onSettings, onCreateEvent, onOpenEvent, onFriends }) {
    const [data, setData] = useState({ myEvents: [], joinedEvents: [] });
    const [loading, setLoading] = useState(true);
    const [expandedSection, setExpandedSection] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem("watch-party-token");

        if (!token) {
            onSignOut();
            return;
        }

        getDashboardData(token)
            .then((dashboardData) => {
                setData({
                    myEvents: dashboardData.my_events || [],
                    joinedEvents: dashboardData.joined_events || [],
                });
            })
            .catch(() => setData({ myEvents: [], joinedEvents: [] }))
            .finally(() => setLoading(false));
    }, [onSignOut]);

    const initials = (user?.full_name || "User").charAt(0).toUpperCase();
    const myEvents = data.myEvents;
    const joinedEvents = data.joinedEvents;
    const visibleMyEvents = myEvents.slice(0, 2);
    const visibleJoinedEvents = joinedEvents.slice(0, 2);

    function openEventFromKeyboard(event, selectedEvent) {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onOpenEvent(selectedEvent);
        }
    }

    function renderEventCard(event, fallbackPosterClass) {
        const posterClass = event.posterClass || event.poster_class || (event.videoUrl ? "" : fallbackPosterClass);
        return (
            <article className="event-card" key={event.id} role="button" tabIndex={0} aria-label={`View ${event.title} event details`} onClick={() => onOpenEvent(event)} onKeyDown={(keyboardEvent) => openEventFromKeyboard(keyboardEvent, event)}>
                <div className={`poster ${posterClass || ""}`} style={event.posterUrl ? { backgroundImage: `url("${event.posterUrl}")` } : undefined} aria-label={`${event.title} poster`} />
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
        );
    }

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

                    <div className="header-actions">
                        <button className="user-badge secondary" type="button" aria-label="Notifications" onClick={onNotifications}>🔔</button>
                        <button className="user-badge secondary settings-button" type="button" aria-label="Settings" onClick={onSettings}>⚙</button>
                    </div>
                </header>

                <div className="dashboard-toolbar">
                    <button className="toolbar-button" type="button" onClick={onCreateEvent}>
                        <span>＋ Create Event</span>
                    </button>
                </div>

                {expandedSection ? (
                    <section>
                        <div className="section-header">
                            <h2><span className="section-icon">◔</span> {expandedSection === "my" ? "My Events" : "Joined Events"}</h2>
                            <button className="see-all" type="button" onClick={() => setExpandedSection(null)}>Back</button>
                        </div>
                        <div className="event-list">
                            {loading ? <p>Loading events...</p> : expandedSection === "my"
                                ? myEvents.length ? myEvents.map((event) => renderEventCard(event, "poster-inception")) : <p>No events created yet.</p>
                                : joinedEvents.length ? joinedEvents.map((event) => renderEventCard(event, "poster-batman")) : <p>No joined events yet.</p>}
                        </div>
                    </section>
                ) : (
                    <>
                        <section>
                            <div className="section-header">
                                <h2><span className="section-icon">◔</span> My Events</h2>
                                {myEvents.length > 2 && <button className="see-all" type="button" onClick={() => setExpandedSection("my")}>See All</button>}
                            </div>
                            <div className="event-list">
                                {loading ? <p>Loading events...</p> : myEvents.length ? visibleMyEvents.map((event) => renderEventCard(event, "poster-inception")) : <p>No events created yet.</p>}
                            </div>
                        </section>

                        <section>
                            <div className="section-header">
                                <h2><span className="section-icon">◉</span> Joined Events</h2>
                                {joinedEvents.length > 2 && <button className="see-all" type="button" onClick={() => setExpandedSection("joined")}>See All</button>}
                            </div>
                            <div className="event-list">
                                {loading ? <p>Loading events...</p> : joinedEvents.length ? visibleJoinedEvents.map((event) => renderEventCard(event, "poster-batman")) : <p>No joined events yet.</p>}
                            </div>
                        </section>
                    </>
                )}

                <footer className="dashboard-footer">
                    <button className="nav-item active" type="button" onClick={onCreateEvent}>
                        <span className="nav-icon">⌂</span>
                        <span>Events</span>
                    </button>
                    <button className="nav-item" type="button" aria-label="Activity log">
                        <span className="nav-icon">▣</span>
                        <span>Log</span>
                    </button>
                    <button className="nav-item" type="button" onClick={onFriends}>
                        <span className="nav-icon">◍</span>
                        <span>Friends</span>
                    </button>
                </footer>
            </div>
        </div>
    );
}

export default Dashboard;
