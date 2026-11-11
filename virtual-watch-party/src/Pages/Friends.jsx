import { useEffect, useState } from "react";
import { getFriends, searchUsers, sendFriendRequest } from "../api";
import "./Friends.css";

const avatarAccents = ["rose", "blue", "purple", "gold", "peach", "green", "cyan", "pink"];

function Friends({ onBack, onOpenFriend }) {
    const [friendsList, setFriendsList] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searching, setSearching] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    useEffect(() => {
        const token = localStorage.getItem("watch-party-token");
        getFriends(token)
            .then((data) => setFriendsList(data.friends || []))
            .catch((requestError) => setError(requestError.message))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        const query = searchQuery.trim();
        if (query.length < 2) {
            setSearchResults([]);
            setSearching(false);
            return undefined;
        }

        let active = true;
        setSearching(true);
        const timer = window.setTimeout(() => {
            const token = localStorage.getItem("watch-party-token");
            searchUsers(query, token)
                .then((data) => {
                    if (active) setSearchResults(data.users || []);
                })
                .catch((requestError) => {
                    if (active) setError(requestError.message);
                })
                .finally(() => {
                    if (active) setSearching(false);
                });
        }, 250);

        return () => {
            active = false;
            window.clearTimeout(timer);
        };
    }, [searchQuery]);

    async function addFriend(friend) {
        const token = localStorage.getItem("watch-party-token");
        setError("");
        setMessage("");
        try {
            await sendFriendRequest(friend.id, token);
            setSearchResults((current) => current.map((result) => (
                result.id === friend.id ? { ...result, relationship: "sent" } : result
            )));
            setMessage(`Friend request sent to ${friend.name}.`);
        } catch (requestError) {
            setError(requestError.message);
        }
    }

    return (
        <main className="dashboard-shell">
            <section className="dashboard-phone friends-phone" aria-label="Friends">
                <div className="dashboard-topbar">
                    <span className="time">9:41</span>
                    <div className="status-icons" aria-label="Device status">
                        <span>◔</span>
                        <span>📡</span>
                        <span>◉</span>
                    </div>
                </div>

                <header className="friends-header">
                    <button className="friends-back" type="button" onClick={onBack} aria-label="Back to dashboard">←</button>
                    <h1>Friends</h1>
                    <button className="friends-more" type="button" aria-label="More options">☰</button>
                </header>

                <div className="friends-search" role="search">
                    <span aria-hidden="true">⌕</span>
                    <input
                        type="search"
                        value={searchQuery}
                        onChange={(event) => {
                            setSearchQuery(event.target.value);
                            setMessage("");
                            setError("");
                        }}
                        placeholder="Find people by name or email"
                        aria-label="Find people by name or email"
                    />
                </div>

                <div className="friends-toolbar">
                    <span>{searchQuery.trim().length >= 2 ? "People" : `All Friends (${friendsList.length})`}</span>
                    {searchQuery.trim().length < 2 && <span className="online-pill">Connected</span>}
                </div>

                <div className="friends-list">
                    {error && <p className="friends-feedback" role="alert">{error}</p>}
                    {message && <p className="friends-feedback" role="status">{message}</p>}
                    {searchQuery.trim().length >= 2 ? (
                        searching ? <p className="friends-feedback">Searching...</p>
                            : searchResults.length ? searchResults.map((friend, index) => (
                                <div key={friend.id} className="friend-row friend-search-row">
                                    <div className={`friend-avatar avatar-${avatarAccents[index % avatarAccents.length]}`} aria-hidden="true">{friend.initials}</div>
                                    <div className="friend-main">
                                        <span className="friend-name">{friend.name}</span>
                                        <span className="friend-status">{friend.email}</span>
                                    </div>
                                    <button
                                        type="button"
                                        className="friend-add-button"
                                        onClick={() => addFriend(friend)}
                                        disabled={friend.relationship !== "none"}
                                    >
                                        {friend.relationship === "friend" ? "Friends" : friend.relationship === "sent" ? "Sent" : friend.relationship === "received" ? "Check requests" : "Add"}
                                    </button>
                                </div>
                            ))
                                : <p className="friends-feedback">No users found.</p>
                    ) : loading ? <p className="friends-feedback">Loading friends...</p>
                        : friendsList.length ? friendsList.map((friend, index) => (
                            <button key={friend.id} type="button" className="friend-row" onClick={() => onOpenFriend({ ...friend, accent: avatarAccents[index % avatarAccents.length] })}>
                                <div className={`friend-avatar avatar-${avatarAccents[index % avatarAccents.length]}`} aria-label={`${friend.name} avatar`}>{friend.initials}</div>
                                <div className="friend-main">
                                    <span className="friend-name">{friend.name}</span>
                                    <span className="friend-status">{friend.status}</span>
                                </div>
                                <span className="friend-arrow" aria-hidden="true">›</span>
                            </button>
                        ))
                            : <p className="friends-feedback">You have no friends yet.</p>}
                </div>
            </section>
        </main>
    );
}

export default Friends;
