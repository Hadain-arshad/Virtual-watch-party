import { API_URL } from "../api";

function Confirmation({ user, onSignOut }) {
    const picture = user.profile_picture ? `${API_URL}/uploads/${user.profile_picture}` : null;
    return (
        <main className="confirmation-page">
            <section className="confirmation-card" aria-live="polite">
                {picture ? <img className="confirmation-picture" src={picture} alt="Profile" /> : <div className="confirmation-avatar">{user.full_name.charAt(0).toUpperCase()}</div>}
                <p className="eyebrow">Authentication complete</p>
                <h1>You are signed in</h1>
                <p className="confirmation-copy">Welcome back, {user.full_name}. Your Virtual Watch Party account is ready.</p>
                <p className="confirmation-email">{user.email}</p>
                <button className="auth-button" type="button" onClick={onSignOut}>Sign out</button>
            </section>
        </main>
    );
}

export default Confirmation;