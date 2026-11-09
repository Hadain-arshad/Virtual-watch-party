import { useEffect, useState } from "react";
import { friends } from "./friends";
import "./FriendPickerDialog.css";

function FriendPickerDialog({ selectedIds, onCancel, onApply }) {
    const [draftIds, setDraftIds] = useState(selectedIds);

    useEffect(() => {
        function handleKeyDown(event) {
            if (event.key === "Escape") onCancel();
        }

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [onCancel]);

    function toggleFriend(friendId) {
        setDraftIds((current) => (
            current.includes(friendId)
                ? current.filter((id) => id !== friendId)
                : [...current, friendId]
        ));
    }

    return (
        <div className="friend-dialog-backdrop" role="presentation" onMouseDown={(event) => {
            if (event.target === event.currentTarget) onCancel();
        }}>
            <section className="friend-picker-dialog" role="dialog" aria-modal="true" aria-labelledby="friend-picker-title">
                <header className="friend-dialog-header">
                    <h2 id="friend-picker-title">Invite Friends</h2>
                    <button className="friend-dialog-close" type="button" onClick={onCancel} aria-label="Close friend picker">×</button>
                </header>

                <div className="friend-picker-list">
                    {friends.map((friend) => (
                        <label className="friend-picker-option" key={friend.id}>
                            <span>{friend.name}</span>
                            <input type="checkbox" checked={draftIds.includes(friend.id)} onChange={() => toggleFriend(friend.id)} />
                        </label>
                    ))}
                </div>

                <footer className="friend-dialog-actions">
                    <button className="friend-dialog-cancel" type="button" onClick={onCancel}>Cancel</button>
                    <button className="friend-dialog-apply" type="button" onClick={() => onApply(draftIds)}>Add selected</button>
                </footer>
            </section>
        </div>
    );
}

export default FriendPickerDialog;