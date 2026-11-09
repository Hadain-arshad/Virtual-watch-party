import "./MoviePlayer.css";

const participants = [
    { name: "You (Host)", status: "Online", initial: "Y" },
    { name: "Sarah Khan", status: "Online", initial: "S" },
    { name: "Ahmed Raza", status: "Online", initial: "A" },
    { name: "Hina Malik", status: "Online", initial: "H" },
    { name: "Usman Ali", status: "Online", initial: "U" },
];

const posterImages = {
    "poster-inception": "/images/inception.jpg",
    "poster-interstellar": "/images/interstellar.jpg",
    "poster-batman": "/images/batmanjpg.jpg",
    "poster-dune": "/images/dune.jpg",
};

function MoviePlayer({ event, onBack }) {
    const title = event?.title || "Watch Party";
    const posterClass = event?.posterClass || event?.poster_class;
    const posterImage = event?.posterUrl || event?.poster_url || posterImages[posterClass];

    return (
        <main className="dashboard-shell movie-shell">
            <section className="dashboard-phone movie-player-phone" aria-label={`${title} movie player`}>
                <header className="movie-header-row">
                    <div className="movie-header-label">
                        <button type="button" className="movie-back-button" onClick={onBack} aria-label="Back to events">‹</button>
                        <div>
                            <span className="movie-room-eyebrow">WATCH PARTY</span>
                            <h1>{title}</h1>
                        </div>
                    </div>
                    <div className="movie-header-actions">
                        <span className="room-live-indicator"><span /> Room is live</span>
                        <button type="button" className="end-room-button" onClick={onBack}>End Room</button>
                    </div>
                </header>

                <div className="movie-layout">
                    <section className="movie-main" aria-label="Movie playback">
                        <div
                            className="movie-video-panel"
                            role="img"
                            aria-label={`${title} movie preview`}
                            style={posterImage ? { backgroundImage: `url("${posterImage}")` } : undefined}
                        >
                            <div className="video-overlay" />
                            <button type="button" aria-label="Play" className="control-button play-button">▶</button>
                        </div>

                        <div className="movie-progress-row">
                            <span>42:16</span>
                            <div className="scrubber-track" aria-hidden="true">
                                <div className="scrubber-fill" />
                                <div className="scrubber-knob" />
                            </div>
                            <span>2:28:16</span>
                        </div>

                        <div className="movie-controls">
                            <button type="button" aria-label="Rewind" className="control-button small">⏮</button>
                            <button type="button" aria-label="Volume" className="control-button small">🔊</button>
                            <button type="button" aria-label="Settings" className="control-button small">⚙</button>
                            <button type="button" aria-label="Comments" className="control-button small">◌</button>
                        </div>
                    </section>

                    <aside className="movie-participants" aria-label="Room participants">
                        <div className="participants-heading">
                            <h2>In the room</h2>
                            <span>{participants.length}</span>
                        </div>
                        <div className="room-members">
                            {participants.map((person) => (
                                <div key={person.name} className="member-item">
                                    <div className="member-avatar">{person.initial}</div>
                                    <div className="member-text">
                                        <span>{person.name}</span>
                                        <small><i />{person.status}</small>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </aside>
                </div>
            </section>
        </main>
    );
}

export default MoviePlayer;
