import "./Settings.css";

const settingsOptions = [
    { title: "Account", description: "Manage your profile and login details", icon: "◔" },
    { title: "Privacy", description: "Control who can view your activity", icon: "◉" },
    { title: "Notifications", description: "Customize event and friend alerts", icon: "🔔" },
    { title: "Help & Support", description: "Get help and contact support", icon: "?" },
];

function Settings({ onBack, onSignOut }) {
    return (
        <main className="dashboard-shell">
            <section className="dashboard-phone settings-phone" aria-label="Settings">
                <div className="dashboard-topbar">
                    <span className="time">9:41</span>
                    <div className="status-icons" aria-label="Device status">
                        <span>◔</span>
                        <span>📡</span>
                        <span>◉</span>
                    </div>
                </div>

                <header className="settings-header">
                    <button className="settings-back" type="button" onClick={onBack} aria-label="Back to dashboard">‹</button>
                    <h1>Settings</h1>
                    <div className="settings-header-spacer" aria-hidden="true" />
                </header>

                <div className="settings-profile">
                    <div className="settings-avatar" aria-label="User avatar">U</div>
                    <div>
                        <p className="settings-name">User Profile</p>
                        <p className="settings-subtitle">Personal preferences</p>
                    </div>
                </div>

                <div className="settings-list">
                    {settingsOptions.map((option) => (
                        <button key={option.title} type="button" className="settings-item">
                            <span className="settings-icon" aria-hidden="true">{option.icon}</span>
                            <span className="settings-copy">
                                <strong>{option.title}</strong>
                                <small>{option.description}</small>
                            </span>
                            <span className="settings-arrow" aria-hidden="true">›</span>
                        </button>
                    ))}
                </div>

                <div className="settings-actions">
                    <button type="button" className="settings-primary">
                        Save Changes
                    </button>
                    <button type="button" className="settings-logout" onClick={onSignOut}>
                        <span aria-hidden="true">↪</span>
                        Log Out
                    </button>
                </div>
            </section>
        </main>
    );
}

export default Settings;
