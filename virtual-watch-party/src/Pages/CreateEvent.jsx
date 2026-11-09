import { useState } from "react";
import FriendPickerDialog from "../components/FriendPickerDialog";
import { friends } from "../components/friends";
import "./CreateEvent.css";

function CreateEvent({ onBack }) {
    const [poster, setPoster] = useState(null);
    const [posterPreview, setPosterPreview] = useState("");
    const [selectedFriends, setSelectedFriends] = useState([]);
    const [showFriends, setShowFriends] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    function handlePosterChange(event) {
        const file = event.target.files?.[0];
        if (!file) {
            setPoster(null);
            setPosterPreview("");
            return;
        }

        setPoster(file);
        const reader = new FileReader();
        reader.onload = () => setPosterPreview(reader.result);
        reader.readAsDataURL(file);
    }

    function handleSubmit(event) {
        event.preventDefault();
        setSubmitted(true);
    }

    return (
        <main className="dashboard-shell">
            <section className="dashboard-phone create-event-phone" aria-label="Create event">
                <div className="dashboard-topbar">
                    <span className="time">9:41</span>
                    <div className="status-icons" aria-label="Device status">
                        <span>◔</span>
                        <span>📡</span>
                        <span>◉</span>
                    </div>
                </div>

                <header className="create-event-header">
                    <button className="create-event-back" type="button" onClick={onBack} aria-label="Back to events">‹</button>
                    <h1>Create Event</h1>
                </header>

                <form className="create-event-form" onSubmit={handleSubmit}>
                    <label className="poster-upload" htmlFor="event-poster">
                        <span className="poster-preview" style={posterPreview ? { backgroundImage: `url(${posterPreview})` } : undefined} aria-hidden="true">
                            {!posterPreview && <span>＋</span>}
                        </span>
                        <span className="poster-upload-copy">
                            <strong>{poster ? poster.name : "Add Movie Poster"}</strong>
                            <small>Optional</small>
                        </span>
                        <span className="poster-edit-icon" aria-hidden="true">↗</span>
                        <input id="event-poster" type="file" accept="image/*" onChange={handlePosterChange} />
                    </label>

                    <label className="create-field">
                        <span>Event Name</span>
                        <input name="eventName" type="text" placeholder="Movie Night" required />
                    </label>

                    <label className="create-field">
                        <span>Select Movie</span>
                        <span className="file-picker">
                            <span className="field-icon" aria-hidden="true">▣</span>
                            <span className="file-picker-text">Choose from device</span>
                            <span className="field-chevron" aria-hidden="true">›</span>
                            <input name="movie" type="file" accept="video/*" required />
                        </span>
                    </label>

                    <label className="create-field">
                        <span>Watch Date</span>
                        <span className="date-time-input">
                            <span className="field-icon" aria-hidden="true">▦</span>
                            <input name="date" type="date" required />
                        </span>
                    </label>

                    <label className="create-field">
                        <span>Watch Time</span>
                        <span className="date-time-input">
                            <span className="field-icon" aria-hidden="true">◷</span>
                            <input name="time" type="time" required />
                        </span>
                    </label>

                    <div className="create-field participant-field">
                        <span>Select Participants</span>
                        <div className="participant-row">
                            <button className="invite-friends-button" type="button" onClick={() => setShowFriends(true)} aria-haspopup="dialog">
                                ＋ Invite Friends
                            </button>
                        </div>
                        {selectedFriends.length > 0 && (
                            <p className="selected-friends-summary">Invited: {friends.filter((friend) => selectedFriends.includes(friend.id)).map((friend) => friend.name).join(", ")}</p>
                        )}
                    </div>

                    <label className="create-field description-field">
                        <span>Event Details (Optional)</span>
                        <textarea name="description" placeholder="Add a short description..." rows="2" />
                    </label>

                    {submitted && <p className="create-event-status" role="status">Your event details are ready. Event creation is not connected to the server yet.</p>}

                    <div className="create-event-actions">
                        <button className="cancel-event-button" type="button" onClick={onBack}>Cancel</button>
                        <button className="submit-event-button" type="submit">Create Event</button>
                    </div>
                </form>

                <footer className="create-event-footer">
                    <button className="active" type="button" onClick={onBack}>
                        <span className="create-nav-icon" aria-hidden="true">⌂</span>
                        Events
                    </button>
                    <button type="button">
                        <span className="create-nav-icon" aria-hidden="true">◍</span>
                        Friends
                    </button>
                </footer>

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

export default CreateEvent;