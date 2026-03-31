import { VoiceHandler } from './recorder.js';
import { sendToAI } from './api.js';

// Elements
const startBtn = document.getElementById('start-btn');
const finishBtn = document.getElementById('finish-btn');
const micBtn = document.getElementById('mic-btn');
const submitBtn = document.getElementById('submit-btn');
const answerArea = document.getElementById('user-answer');
const setupScreen = document.getElementById('setup-screen');
const interviewRoom = document.getElementById('interview-room');
const reportScreen = document.getElementById('report-screen');

let userRole, userLevel, isRecording = false;
let sessionScores = { technical: [], relevance: [], communication: [], star: [] };

// Questions Object (Mocking the 30 questions requirement for demo)
const questions = {
    "Data Scientist": "Explain how you would handle imbalanced data in a classification project.",
    "ML Engineer": "What are the primary differences between L1 and L2 regularization?",
    "Data Analyst": "Describe a time you used data to influence a business decision."
};

const voice = new VoiceHandler((text) => { answerArea.value = text; });

// Start Session
startBtn.onclick = () => {
    userRole = document.getElementById('role-select').value;
    userLevel = document.getElementById('level-select').value;
    document.getElementById('current-role-display').innerText = `${userRole} • ${userLevel}`;
    document.getElementById('question-text').innerText = questions[userRole] || "Tell me about a technical project.";
    setupScreen.classList.add('hidden');
    interviewRoom.classList.remove('hidden');
};

// Mic Toggle
micBtn.onclick = () => {
    if (!isRecording) {
        voice.start();
        micBtn.classList.add('pulse-red');
    } else {
        voice.stop();
        micBtn.classList.remove('pulse-red');
    }
    isRecording = !isRecording;
};

// Analyze Answer
submitBtn.onclick = async () => {
    const answer = answerArea.value;
    if (!answer) return alert("Please provide an answer.");
    
    submitBtn.innerHTML = `<i data-lucide="loader-2" class="animate-spin"></i>`;
    lucide.createIcons();

    try {
        const data = await sendToAI(answer, document.getElementById('question-text').innerText, userRole, userLevel);
        
        // Track scores for Radar Chart
        sessionScores.technical.push(data.technical);
        sessionScores.relevance.push(data.relevance);
        sessionScores.communication.push(data.communication);
        sessionScores.star.push(data.star_method);

        renderResults(data);
    } catch (e) {
        alert("Check if Backend is on Port 8001");
    } finally {
        submitBtn.innerHTML = `<span>Analyze</span> <i data-lucide="arrow-right" class="w-4 h-4"></i>`;
        lucide.createIcons();
    }
};

// End Session & Show Radar Chart
finishBtn.onclick = () => {
    interviewRoom.classList.add('hidden');
    reportScreen.classList.remove('hidden');
    
    const avg = (arr) => arr.length ? (arr.reduce((a,b) => a+b)/arr.length).toFixed(0) : 0;
    
    const ctx = document.getElementById('performanceChart').getContext('2d');
    new Chart(ctx, {
        type: 'radar',
        data: {
            labels: ['Technical', 'Relevance', 'Communication', 'STAR Method'],
            datasets: [{
                label: 'Session Average %',
                data: [avg(sessionScores.technical), avg(sessionScores.relevance), avg(sessionScores.communication), avg(sessionScores.star)],
                backgroundColor: 'rgba(37, 99, 235, 0.2)',
                borderColor: '#2563eb',
                pointBackgroundColor: '#2563eb'
            }]
        },
        options: {
            scales: { r: { beginAtZero: true, max: 100, ticks: { display: false }, grid: { color: '#334155' } } }
        }
    });

    document.getElementById('strong-area').innerText = "Communication Clarity"; // Logic could be added to find max
    document.getElementById('weak-area').innerText = "STAR Method Structure";
};

function renderResults(data) {
    document.getElementById('placeholder').classList.add('hidden');
    document.getElementById('results-panel').classList.remove('hidden');
    
    const stats = [
        { l: "Technical", v: data.technical, c: "text-blue-400" },
        { l: "Relevance", v: data.relevance, c: "text-emerald-400" },
        { l: "Comm.", v: data.communication, c: "text-purple-400" },
        { l: "STAR", v: data.star_method, c: "text-orange-400" }
    ];

    document.getElementById('scores-container').innerHTML = stats.map(s => `
        <div class="bg-slate-900/50 p-4 rounded-2xl border border-slate-800">
            <p class="text-[9px] uppercase font-bold text-slate-500 mb-1">${s.l}</p>
            <p class="text-xl font-black ${s.c}">${s.v}%</p>
        </div>
    `).join('');

    document.getElementById('feedback-text').innerText = data.feedback;
    document.getElementById('suggestions-list').innerHTML = data.suggestions.map(s => `
        <div class="flex items-center gap-3 text-xs text-slate-400">
            <div class="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> <span>${s}</span>
        </div>
    `).join('');
}