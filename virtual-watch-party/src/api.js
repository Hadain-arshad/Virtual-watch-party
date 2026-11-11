const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

async function request(path, options = {}) {
    const response = await fetch(`${API_URL}${path}`, options);
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.detail || "Something went wrong. Please try again.");
    return data;
}

export function loginUser(credentials) {
    return request("/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(credentials) });
}

export function signupUser(formData) {
    return request("/auth/signup", { method: "POST", body: formData });
}

export function getCurrentUser(token) {
    return request("/auth/me", { headers: { Authorization: `Bearer ${token}` } });
}

export function getDashboardData(token) {
    return request("/dashboard", { headers: { Authorization: `Bearer ${token}` } });
}

export function createWatchEvent(formData, token) {
    return request("/events", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
    });
}

export function joinWatchEvent(eventId, token) {
    return request(`/events/${encodeURIComponent(eventId)}/join`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
    });
}

export function getFriends(token) {
    return request("/friends", { headers: { Authorization: `Bearer ${token}` } });
}

export function searchUsers(query, token) {
    return request(`/users/search?q=${encodeURIComponent(query)}`, {
        headers: { Authorization: `Bearer ${token}` },
    });
}

export function sendFriendRequest(recipientId, token) {
    return request("/friends/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ recipient_id: recipientId }),
    });
}

export function getNotifications(token) {
    return request("/notifications", { headers: { Authorization: `Bearer ${token}` } });
}

export function respondFriendRequest(requestId, action, token) {
    return request(`/friends/requests/${encodeURIComponent(requestId)}/${action}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
    });
}

export { API_URL };