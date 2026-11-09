import { useState } from "react";
import FriendPickerDialog from "../components/FriendPickerDialog";
import { friends } from "../components/friends";
import "./EventDetails.css";

function EventDetails({ event, onBack, onWatchMovie }) {
    const [joinMessage, setJoinMessage] = useState("");
    const [shareMessage, setShareMessage] = useState("");
    const [selectedFriends, setSelectedFriends] = useState([]);
    const [showFriends, setShowFriends] = useState(false);
    const posterClass = event.posterClass || event.poster_class || "poster-inception";
    const participantCount = Number.parseInt(event.participants || "", 10) || 0;

    async function shareEvent() {
        const shareData = {
            title: `${event.title} Watch Party`,
            text: `${event.title} watch party: ${event.date || "Date to be confirmed"}`,
        };

        try {
            if (navigator.share) {
                await navigator.share(shareData);
            } else if (navigator.clipboard) {
                await navigator.clipboard.writeText(shareData.text);
                setShareMessage("Event details copied to clipboard.");
            } else {
                setShareMessage("Sharing is not available in this browser.");
            }
        } catch (error) {
            if (error.name !== "AbortError") {
                setShareMessage("Could not share this event.");
            }
        }
    }

    return (
        <main className="dashboard-shell">
            <section className="dashboard-phone event-details-phone" aria-label={`${event.title} event details`}>
                <div className="dashboard-topbar">
                    <span className="time">9:41</span>
                    <div className="status-icons" aria-label="Device status">
                        <span>◔</span>
                        <span>📡</span>
                        <span>◉</span>
                    </div>
                </div>

                <header className="event-details-header">
                    <button className="event-details-back" type="button" onClick={onBack} aria-label="Back to events">‹</button>
                    <h1>{event.title}</h1>
                    <button className="event-share-button" type="button" onClick={shareEvent} aria-label="Share event" title="Share event">
                        <span aria-hidden="true">↗</span>
                    </button>
                </header>

                <div className="event-details-content">
                    <div className={`event-hero-poster ${posterClass}`} role="img" aria-label={`${event.title} movie poster`} />

                    <section className="event-summary">
                        <div className="event-summary-title">
                            <div>
                                <h2>{event.title}</h2>
                                <p>Movie Night</p>
                            </div>
                        </div>
                        <div className="event-summary-meta">
                            <div className="event-date-row">
                                <p><span aria-hidden="true">▦</span>{event.date || "Date to be confirmed"}</p>
                                <span className="event-details-status">{event.status || "Upcoming"}</span>
                            </div>
                            <p><span aria-hidden="true">♧</span>{event.participants || `${participantCount} Participants`}</p>
                        </div>
                    </section>

                    <section className="event-host-card" aria-label="Event host">
                        <span className="event-host-avatar">{(event.host || "Hosted by You").replace("Hosted by ", "").slice(0, 1).toUpperCase()}</span>
                        <span>{event.host || "Hosted by You"}</span>
                        <span className="detail-chevron" aria-hidden="true">›</span>
                    </section>

                    <details className="event-participants-section" open>
                        <summary className="event-section-title">
                            <h3>Participants ({participantCount}/{event.capacity || 6})</h3>
                            <span aria-hidden="true">›</span>
                        </summary>
                        {selectedFriends.length > 0 && (
                            <p className="selected-participants-names">
                                {friends.filter((friend) => selectedFriends.includes(friend.id)).map((friend) => friend.name).join(", ")}
                            </p>
                        )}
                        <button className="invite-participants-button" type="button" onClick={() => setShowFriends(true)} aria-haspopup="dialog">
                            <span aria-hidden="true">＋</span> Invite Friends
                        </button>
                    </details>

                    {shareMessage && <p className="event-details-feedback" role="status">{shareMessage}</p>}
                    {joinMessage && <p className="event-details-feedback" role="status">{joinMessage}</p>}

                </div>

                <button
                    className="join-event-button"
                    type="button"
                    onClick={() => {
                        if (onWatchMovie) {
                            onWatchMovie();
                            return;
                        }
                        setJoinMessage("Joining events is not connected to the server yet.");
                    }}
                >
                    Join Event
                </button>

                {showFriends && (
                    <FriendPickerDialog
                        selectedIds={selectedFriends}
                        onCancel={() => setShowFriends(false)}
                        onApply={(friendIds) => {
                            setSelectedFriends(friendIds);
                            setShowFriends(false);
                        }}
                    />
                )}
            </section>
        </main>
    );
}

export default EventDetails;