import "./Friends.css";

function FriendDetails({ friend, onBack }) {
    if (!friend) {
        return null;
    }

    const sharedEvents = [
        { title: "Inception", date: "Today, 08:00 PM", poster: "poster-inception" },
        { title: "The Batman", date: "Tomorrow, 07:00 PM", poster: "poster-batman" },
    ];

    return (
        <main className="dashboard-shell">
            <section className="dashboard-phone friend-detail-phone" aria-label={`${friend.name} details`}>
                <div className="dashboard-topbar">
                    <span className="time">9:41</span>
                    <div className="status-icons" aria-label="Device status">
                        <span>◔</span>
                        <span>📡</span>
                        <span>◉</span>
                    </div>
                </div>

                <header className="friends-header">
                    <button className="friends-back" type="button" onClick={onBack} aria-label="Back to friends">←</button>
                    <h1>Friends</h1>
                    <button className="friends-more" type="button" aria-label="More options">⋮</button>
                </header>

                <div className="friend-profile-card">
                    <div className="friend-profile-hero">
                        <div className={`friend-avatar large avatar-${friend.accent}`} aria-label={`${friend.name} avatar`}>{friend.initials}</div>
                    </div>

                    <div className="friend-profile-header">
                        <div>
                            <h2>{friend.name}</h2>
                            <p className="friend-online-status">● {friend.status || "Friend"}</p>
                        </div>
                    </div>

                    <div className="friend-action-row">
                        <button type="button" className="primary-action">Send Message</button>
                        <button type="button" className="secondary-action" disabled>Friends</button>
                    </div>

                    <div className="friend-info-list">
                        <div className="info-row"><span className="info-label">Email</span><span>{friend.email}</span></div>
                        <div className="info-row"><span className="info-label">Gender</span><span>{friend.gender}</span></div>
                        <div className="info-row"><span className="info-label">Location</span><span>{friend.location || "Not specified"}</span></div>
                        <div className="info-row"><span className="info-label">Joined</span><span>{friend.joined}</span></div>
                    </div>

                    <div className="friend-about">
                        <h3>About</h3>
                        <p>Movie lover | Coffee addict | Good vibes only ✨</p>
                    </div>

                    <div className="friend-shared-events">
                        <div className="shared-events-header">
                            <h3>Shared Events (3)</h3>
                            <button type="button" className="see-all-link">See All</button>
                        </div>

                        <div className="shared-events-grid">
                            {sharedEvents.map((event) => (
                                <div className="shared-event-card" key={event.title}>
                                    <div className={`mini-poster ${event.poster}`} aria-label={`${event.title} poster`} />
                                    <div className="shared-event-copy">
                                        <strong>{event.title}</strong>
                                        <span>{event.date}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>
        </main>
    );
}

export default FriendDetails;
