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

export { API_URL };