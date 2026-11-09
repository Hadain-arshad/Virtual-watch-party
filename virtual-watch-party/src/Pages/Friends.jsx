import "./Friends.css";

const friendsList = [
    { id: 1, name: "Sarah Khan", status: "Online", initials: "SK", accent: "rose", email: "sarah.khan@gmail.com", gender: "Female", location: "Lahore, Pakistan", joined: "Jan 2025" },
    { id: 2, name: "Ahmed Raza", status: "Online", initials: "AR", accent: "blue", email: "ahmed.raza@gmail.com", gender: "Male", location: "Karachi, Pakistan", joined: "Feb 2025" },
    { id: 3, name: "Hina Malik", status: "Online", initials: "HM", accent: "purple", email: "hina.malik@gmail.com", gender: "Female", location: "Islamabad, Pakistan", joined: "Mar 2025" },
    { id: 4, name: "Usman Ali", status: "Offline", initials: "UA", accent: "gold", email: "usman.ali@gmail.com", gender: "Male", location: "Peshawar, Pakistan", joined: "Apr 2025" },
    { id: 5, name: "Ayesha Javed", status: "Online", initials: "AJ", accent: "peach", email: "ayesha.javed@gmail.com", gender: "Female", location: "Rawalpindi, Pakistan", joined: "May 2025" },
    { id: 6, name: "Fakhar Mehmood", status: "Offline", initials: "FM", accent: "green", email: "fakhar.mehmood@gmail.com", gender: "Male", location: "Multan, Pakistan", joined: "Jun 2025" },
    { id: 7, name: "Zain Ahmed", status: "Online", initials: "ZA", accent: "cyan", email: "zain.ahmed@gmail.com", gender: "Male", location: "Quetta, Pakistan", joined: "Jul 2025" },
    { id: 8, name: "Mariam Noor", status: "Offline", initials: "MN", accent: "pink", email: "mariam.noor@gmail.com", gender: "Female", location: "Sialkot, Pakistan", joined: "Aug 2025" },
];

function Friends({ onBack, onOpenFriend }) {
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
                    <input type="text" placeholder="Search friends..." aria-label="Search friends" />
                </div>

                <div className="friends-toolbar">
                    <span>All Friends ({friendsList.length})</span>
                    <span className="online-pill">Online ({friendsList.filter((friend) => friend.status === "Online").length})</span>
                </div>

                <div className="friends-list">
                    {friendsList.map((friend) => (
                        <button key={friend.id} type="button" className="friend-row" onClick={() => onOpenFriend(friend)}>
                            <div className={`friend-avatar avatar-${friend.accent}`} aria-label={`${friend.name} avatar`}>{friend.initials}</div>

                            <div className="friend-main">
                                <span className="friend-name">{friend.name}</span>
                                <span className="friend-status">{friend.status}</span>
                            </div>

                            <span className="friend-arrow" aria-hidden="true">›</span>
                        </button>
                    ))}
                </div>
            </section>
        </main>
    );
}

export default Friends;
