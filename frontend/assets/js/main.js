import { VoiceHandler } from './recorder.js';
import { sendToAI, login, signup, fetchHistory, getNextQuestion } from './api.js';

// Elements
const startBtn = document.getElementById('start-btn');
const finishBtn = document.getElementById('finish-btn');
const micBtn = document.getElementById('mic-btn');
const submitBtn = document.getElementById('submit-btn');
const answerArea = document.getElementById('user-answer');
const authScreen = document.getElementById('auth-screen');
const setupScreen = document.getElementById('setup-screen');
const interviewRoom = document.getElementById('interview-room');
const reportScreen = document.getElementById('report-screen');

// Landing & Auth Logic
const loginBtn = document.getElementById('login-btn');
const getStartedBtn = document.getElementById('get-started-btn');
const showLoginBtn = document.getElementById('show-login-btn');
const backToLanding = document.getElementById('back-to-landing');
const landingPage = document.getElementById('landing-page');
const landingBlobs = document.getElementById('landing-blobs');
const appVisuals = document.getElementById('app-visuals');

getStartedBtn.onclick = () => {
    isSignUpMode = true;
    toggleAuth(true);
};

showLoginBtn.onclick = () => {
    isSignUpMode = false;
    toggleAuth(true);
};

backToLanding.onclick = () => toggleAuth(false);

function toggleAuth(show) {
    landingPage.classList.toggle('hidden', show);
    authScreen.classList.toggle('hidden', !show);
    loginBtn.innerText = isSignUpMode ? "Create Career Account" : "Sign In";
    document.querySelector('#auth-screen h2').innerText = isSignUpMode ? "Join the Fleet" : "Welcome Back";
}

const signUpToggle = document.getElementById('signup-toggle');
let isSignUpMode = false;

signUpToggle.onclick = () => {
    isSignUpMode = !isSignUpMode;
    loginBtn.innerText = isSignUpMode ? "Create Career Account" : "Sign In";
    signUpToggle.innerText = isSignUpMode ? "Already a pilot? Sign in" : "New here? Create a professional account";
    document.querySelector('#auth-screen p').innerText = isSignUpMode ? "Join 10k+ users preparing for top roles" : "Sign in to track your interview progress";
};

loginBtn.onclick = async () => {
    const email = document.getElementById('email-input').value;
    const pass = document.getElementById('password-input').value;
    if (!email || !pass) return alert("Enter your credentials to continue");

    loginBtn.innerHTML = `
        <div class="btn-loading">
            <span class="loading-ping"><span></span><span></span></span>
            <span class="loading-text">Auth Stream...</span>
        </div>`;
    lucide.createIcons();

    try {
        if (isSignUpMode) {
            await signup(email, pass);
            alert("Account created successfully! Please sign in.");
            isSignUpMode = false;
            signUpToggle.click(); // Switch back to login mode
        } else {
            const data = await login(email, pass);
            currentUserId = data.user_id; 
            
            landingPage.classList.add('hidden');
            authScreen.classList.add('hidden');
            setupScreen.classList.remove('hidden');
            loadDashboard(); 
        }
    } catch (e) {
        alert(e.message);
    } finally {
        loginBtn.innerText = isSignUpMode ? "Create Career Account" : "Sign In";
        lucide.createIcons();
    }
};

let userRole, userLevel, currentUserId, isRecording = false;
let sessionScores = { technical: [], relevance: [], communication: [], star: [] };
let sessionTranscript = []; 
let currentShuffledBank = [];

// Custom Dropdown Logic
function setupCustomDropdown(triggerId, listId, labelId, selectId) {
    const trigger = document.getElementById(triggerId);
    const list = document.getElementById(listId);
    const label = document.getElementById(labelId);
    const select = document.getElementById(selectId);
    const options = list.querySelectorAll('.custom-option');

    trigger.onclick = (e) => {
        e.stopPropagation();
        const isOpen = !list.classList.contains('hidden');
        closeAllDropdowns();
        if (!isOpen) {
            list.classList.remove('hidden');
            trigger.classList.add('trigger-active');
        }
    };

    options.forEach(opt => {
        opt.onclick = () => {
            const val = opt.getAttribute('data-value');
            label.innerText = val;
            select.value = val;
            options.forEach(o => o.classList.remove('selected'));
            opt.classList.add('selected');
            list.classList.add('hidden');
            trigger.classList.remove('trigger-active');
        };
    });
}

function closeAllDropdowns() {
    document.querySelectorAll('.custom-dropdown-list').forEach(l => l.classList.add('hidden'));
    document.querySelectorAll('[id$="-trigger"]').forEach(t => t.classList.remove('trigger-active'));
}

document.addEventListener('click', closeAllDropdowns);

setupCustomDropdown('role-trigger', 'role-list', 'role-label', 'role-select');
setupCustomDropdown('level-trigger', 'level-list', 'level-label', 'level-select');

async function loadDashboard() {
    if (!currentUserId) return;
    const historyContainer = document.getElementById('history-container');
    try {
        const history = await fetchHistory(currentUserId);
        if (!history.length) return historyContainer.innerHTML = `<p class='text-xs opacity-40 text-center py-10'>No sessions recorded yet</p>`;
        
        historyContainer.innerHTML = history.slice(0, 5).map(s => {
            const meta = s.evaluation_metadata;
            const avg = (meta.technical + meta.relevance + meta.communication + meta.star_method) / 4;
            const trend = avg > 70 ? 'text-emerald-500' : (avg > 50 ? 'text-blue-500' : 'text-orange-500');
            return `
                <div class="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex justify-between items-center group hover:border-blue-500/30 transition-all">
                    <div>
                        <p class="text-white text-sm font-bold">${s.role}</p>
                        <p class="text-[9px] text-slate-500 uppercase tracking-widest">${new Date(s.timestamp).toLocaleDateString()}</p>
                    </div>
                    <div class="text-right">
                        <p class="text-lg font-black ${trend}">${Math.round(avg)}%</p>
                        <p class="text-[8px] text-slate-500 uppercase">Growth Status</p>
                    </div>
                </div>
            `;
        }).join('');
    } catch (e) { console.error("History fetch failed:", e); }
}

// Questions Object (Mocking the 30 questions requirement for demo)
const questions = {
    "Data Scientist": "Explain how you would handle imbalanced data in a classification project.",
    "ML Engineer": "What are the primary differences between L1 and L2 regularization?",
    "Data Analyst": "Describe a time you used data to influence a business decision."
};

const voice = new VoiceHandler((text) => { answerArea.value = text; });

// Start Session
startBtn.onclick = async () => {
    userRole = document.getElementById('role-select').value;
    userLevel = document.getElementById('level-select').value;
    document.getElementById('current-role-display').innerText = `${userRole} • ${userLevel}`;
    
    startBtn.innerHTML = `
        <div class="btn-loading">
            <span class="loading-ping"><span></span><span></span></span>
             <span class="loading-text">Calibrating AI...</span>
        </div>`;
    lucide.createIcons();

    sessionAskedQuestions = [];
    sessionTranscript = [];
    sessionScores = { technical: [], relevance: [], communication: [], star: [] };

    try {
        const { question } = await getNextQuestion(userRole, userLevel, []);
        sessionAskedQuestions.push(question);
        document.getElementById('question-text').innerText = question;
        setupScreen.classList.add('hidden');
        interviewRoom.classList.remove('hidden');
    } catch (e) {
        alert("Failed to start session. Is backend running?");
    } finally {
        startBtn.innerHTML = `<span>Start Calibration</span> <i data-lucide="rocket" class="w-4 h-4"></i>`;
        lucide.createIcons();
    }
};

// Mic Toggle
micBtn.onclick = () => {
    const visualizer = document.getElementById('visualizer');
    const bars = visualizer.querySelectorAll('.wave-bar');

    if (!isRecording) {
        voice.start();
        micBtn.classList.add('pulse-red');
        visualizer.classList.add('active');
        bars.forEach(b => b.classList.add('active'));
        document.getElementById('favicon').href = "https://cdn-icons-png.flaticon.com/512/3294/3294242.png"; // Active Listening mode
    } else {
        voice.stop();
        micBtn.classList.remove('pulse-red');
        visualizer.classList.remove('active');
        bars.forEach(b => b.classList.remove('active'));
        document.getElementById('favicon').href = "https://cdn-icons-png.flaticon.com/512/2103/2103823.png"; // Idle mode
    }
    isRecording = !isRecording;
};

// Analyze Answer
submitBtn.onclick = async () => {
    const answer = answerArea.value.trim();
    const currentQ = document.getElementById('question-text').innerText;
    if (!answer) return alert("Please provide an answer.");
    
    const chatContainer = document.getElementById('chat-container');
    const thinkingBubble = document.getElementById('thinking-bubble');

    try {
        // Show User Bubble in Chat
        const template = document.getElementById('user-bubble-template');
        const userBubble = template.cloneNode(true);
        userBubble.id = ""; 
        userBubble.classList.remove('hidden');
        userBubble.querySelector('.user-text').innerText = answer;
        chatContainer.appendChild(userBubble);
        scrollToBottom();

        // Clear Input immediately
        answerArea.value = "";
        
        // Show Thinking Bubble
        chatContainer.appendChild(thinkingBubble);
        thinkingBubble.classList.remove('hidden');
        scrollToBottom();

        // Disable Send to prevent spam
        submitBtn.disabled = true;
        submitBtn.classList.add('opacity-50');

        const data = await sendToAI(answer, currentQ, userRole, userLevel, currentUserId);
        
        // Hide Thinking Bubble
        thinkingBubble.classList.add('hidden');
        submitBtn.disabled = false;
        submitBtn.classList.remove('opacity-50');

        sessionTranscript.push({ question: currentQ, answer: answer, feedback: data.feedback, scores: data });

        // Update Radar and Render
        const scores = [data.technical, data.soft_skills, data.role_fit, data.structure];
        radarChart.data.datasets[0].data = scores;
        radarChart.update();
        renderResults(data);
    } catch (e) {
        alert("Check if Backend is on Port 8001");
    } finally {
        submitBtn.innerHTML = `<span>Analyze</span> <i data-lucide="arrow-right" class="w-4 h-4"></i>`;
        lucide.createIcons();
    }
};

let sessionAskedQuestions = [];

// Next Question logic
const nextBtn = document.getElementById('next-btn');
nextBtn.onclick = async () => {
    answerArea.value = "";
    document.getElementById('results-panel').classList.add('hidden');
    // Remove previous user bubbles to keep chat clean for next question or keep them for history?
    // Let's keep them and scroll.
    submitBtn.classList.remove('hidden');

    nextBtn.innerHTML = `<i data-lucide="loader-2" class="animate-spin w-4 h-4"></i>`;
    lucide.createIcons();

    try {
        // Limit to 10 questions per session to avoid infinite loops/cost
        if (sessionAskedQuestions.length >= 10) {
            alert("Goal achieved! High-intensity session complete.");
            finishBtn.click();
            return;
        }

        const { question } = await getNextQuestion(userRole, userLevel, sessionAskedQuestions);
        sessionAskedQuestions.push(question);
        document.getElementById('question-text').innerText = question;
        scrollToBottom();
    } catch (e) {
        alert("Session interrupted. Check connection.");
    } finally {
        nextBtn.innerHTML = `<span>Next Question</span> <i data-lucide="skip-forward" class="w-4 h-4 text-blue-500"></i>`;
        lucide.createIcons();
    }
};

async function downloadTranscript() {
    const textData = sessionTranscript.map((t, idx) => `
SESSION QUESTION ${idx + 1}:
${t.question}

YOUR RESPONSE:
${t.answer}

IDEAL BENCHMARK RESPONSE:
${t.scores.ideal_answer}

AI ASSESSMENT & FEEDBACK:
${t.feedback}

METRICS: Technical: ${t.scores.technical}% | Relevance: ${t.scores.relevance}% | Communication: ${t.scores.communication}% | STAR: ${t.scores.star_method}%
--------------------------------------------------------------------------------
`).join('\n');

    const header = `PREPPILOT CAREER TRANSCRIPT\nRole: ${userRole} | Level: ${userLevel}\nDate: ${new Date().toLocaleDateString()}\n================================================================================\n`;
    const blob = new Blob([header + textData], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `PrepPilot_Transcript_${userRole.replace(' ', '_')}.txt`;
    a.click();
}

window.downloadTranscript = downloadTranscript;

const questionBank = {
    "Data Scientist": [
        "How do you handle imbalanced datasets?",
        "Explain Gradient Descent in simple terms.",
        "What is the curse of dimensionality?",
        "Describe Random Forest vs XGBoost.",
        "How do you evaluate a regression model performance?"
    ],
    "ML Engineer": [
        "Differences between L1 and L2 regularization.",
        "How do you optimize a deep learning model for production?",
        "What is data leakage and how to prevent it?",
        "Explain the Transformers architecture basically.",
        "Describe a CI/CD pipeline for ML models."
    ],
    "Data Analyst": [
        "How do you use data to influence a business decision?",
        "Explain SQL joins and their use cases.",
        "What is the difference between data cleaning and data profiling?",
        "How do you communicate technical findings to non-technical stakeholders?",
        "Describe your experience with Tableau or PowerBI."
    ]
};

// End Session & Show Radar Chart
finishBtn.onclick = () => {
    interviewRoom.classList.add('hidden');
    reportScreen.classList.remove('hidden');
    
    const avg = (arr) => arr.length ? (arr.reduce((a,b) => a+b)/arr.length) : 0;
    
    const techAvg = avg(sessionScores.technical);
    const relAvg = avg(sessionScores.relevance);
    const commAvg = avg(sessionScores.communication);
    const starAvg = avg(sessionScores.star);

    const averages = [
        { name: "Knowledge Polish", value: techAvg },
        { name: "Role Suitability", value: relAvg },
        { name: "Speaking Clarity", value: commAvg },
        { name: "Storytelling Structure", value: starAvg }
    ];

    averages.sort((a,b) => b.value - a.value);

    document.getElementById('strong-area').innerText = averages[0].name;
    document.getElementById('weak-area').innerText = averages[averages.length - 1].name;
    document.getElementById('global-score').innerText = `${Math.round(avg([techAvg, relAvg, commAvg, starAvg]))}%`;
    const scoreVal = avg([techAvg, relAvg, commAvg, starAvg]);
    const rank = scoreVal > 85 ? "Expert Pilot" : (scoreVal > 65 ? "Steady Climber" : "New Recruit");
    document.getElementById('questions-done').innerText = rank;
    document.querySelector("[for='questions-done-label']").innerText = "Current Ranking";
    
    const ctx = document.getElementById('performanceChart').getContext('2d');
    new Chart(ctx, {
        type: 'radar',
        data: {
            labels: ['Knowledge', 'Suitability', 'Soft Skills', 'Storytelling'],
            datasets: [{
                label: 'Score Profile (0-100%)',
                data: [techAvg, relAvg, commAvg, starAvg],
                backgroundColor: 'rgba(59, 130, 246, 0.2)',
                borderColor: '#3b82f6',
                borderWidth: 2,
                pointBackgroundColor: '#3b82f6',
                pointRadius: 4
            }]
        },
        options: {
            plugins: { legend: { display: false } },
            scales: { r: { min: 0, max: 100, stepSize: 20, grid: { color: 'rgba(255,255,255,0.05)' }, angleLines: { color: 'rgba(255,255,255,0.05)' }, pointLabels: { color: '#94a3b8', font: { size: 10, weight: 'bold' } }, ticks: { display: false } } }
        }
    });

    lucide.createIcons();
};

function scrollToBottom() {
    const container = document.getElementById('chat-container');
    container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
}

function renderResults(data) {
    const resultsPanel = document.getElementById('results-panel');
    const chatContainer = document.getElementById('chat-container');
    
    // Move results panel to the end of the current chat
    chatContainer.appendChild(resultsPanel);
    resultsPanel.classList.remove('hidden');
    scrollToBottom();
    
    const stats = [
        { l: "Knowledge", v: data.technical, c: "text-blue-400" },
        { l: "Role Fit", v: data.relevance, c: "text-emerald-400" },
        { l: "Soft Skills", v: data.communication, c: "text-purple-400" },
        { l: "Structure", v: data.star_method, c: "text-orange-400" }
    ];

    document.getElementById('scores-container').innerHTML = stats.map(s => `
        <div class="bg-slate-900/50 p-4 rounded-2xl border border-slate-800">
            <p class="text-[9px] uppercase font-bold text-slate-500 mb-1">${s.l}</p>
            <p class="text-xl font-black ${s.c}">${Math.round(s.v)}%</p>
        </div>
    `).join('');

    document.getElementById('feedback-text').innerText = data.feedback;
    
    // Display Ideal Answer
    const idealBox = document.getElementById('ideal-answer-box');
    const idealText = document.getElementById('ideal-answer-text');
    if (data.ideal_answer) {
        idealBox.classList.remove('hidden');
        idealText.innerText = data.ideal_answer;
    }

    document.getElementById('suggestions-list').innerHTML = data.suggestions.map(s => `
        <div class="flex items-center gap-3 text-xs text-slate-400">
            <div class="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> <span>${s}</span>
        </div>
    `).join('');
    
    lucide.createIcons();
}