export async function login(email, password) {
    const response = await fetch('http://127.0.0.1:8001/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });
    if (!response.ok) throw new Error("Invalid credentials");
    return await response.json();
}

export async function signup(email, password) {
    const response = await fetch('http://127.0.0.1:8001/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });
    if (!response.ok) throw new Error("Email already registered");
    return await response.json();
}

export async function fetchHistory(userId) {
    const response = await fetch(`http://127.0.0.1:8001/api/history?user_id=${userId}`);
    if (!response.ok) throw new Error("Failed to fetch history");
    return await response.json();
}

export async function getNextQuestion(role, difficulty, history = []) {
    const response = await fetch(`http://127.0.0.1:8001/api/generate-question?role=${role}&difficulty=${difficulty}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(history)
    });
    if (!response.ok) return { question: "Tell me about yourself." };
    return await response.json();
}

export async function sendToAI(answer, question, role, level, userId) {
    const payload = {
        user_id: userId,
        role: role,
        difficulty: level,
        question: question,
        user_answer: answer
    };

    try {
        const response = await fetch('http://127.0.0.1:8001/api/evaluate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) throw new Error("Backend Offline");
        return await response.json();
    } catch (error) {
        console.error("API Error:", error);
        throw error;
    }
}