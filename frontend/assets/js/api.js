export async function sendToAI(answer, question, role, level) {
    const payload = {
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