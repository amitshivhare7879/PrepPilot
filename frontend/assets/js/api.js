const API_URL = 'http://127.0.0.1:8001/api';

export async function login(email, password) {
    const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Authentication Failed");
    }
    return response.json();
}

export async function signup(email, password) {
    const response = await fetch(`${API_URL}/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Signup Failed");
    }
    return response.json();
}

export async function fetchHistory(userId) {
    const response = await fetch(`${API_URL}/history?user_id=${userId}`);
    return response.json();
}

export async function getNextQuestion(role, difficulty, history) {
    const response = await fetch(`${API_URL}/generate-question?role=${encodeURIComponent(role)}&difficulty=${encodeURIComponent(difficulty)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(history)
    });
    if (!response.ok) throw new Error("AI Question Engine Offline");
    return response.json();
}

export async function sendToAI(role, difficulty, question, answer, userId) {
    try {
        const response = await fetch(`${API_URL}/evaluate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ role, difficulty, question, user_answer: answer, user_id: userId })
        });
        
        if (!response.ok) {
            const data = await response.json();
            throw new Error(`Server Error: ${data.detail || "Evaluation Failed"}`);
        }
        
        return response.json();
    } catch (e) {
        console.error("Fetch Exception:", e);
        throw new Error(e.message || "Failed to communicate with the Evaluation Engine. Please ensure the Backend is running on Port 8001.");
    }
}

export async function saveSession(userId, role, difficulty, metadata) {
    const response = await fetch(`${API_URL}/save-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, role, difficulty, evaluation_metadata: metadata })
    });
    return response.json();
}