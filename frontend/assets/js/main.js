import VoiceRecorder from './recorder.js';
import { sendToAI, login, signup, fetchHistory, getNextQuestion, saveSession } from './api.js';

const voice = new VoiceRecorder((text) => {
    document.getElementById('user-answer').value = text;
});

// Elements
const startBtn = document.getElementById('start-btn');
const finishBtn = document.getElementById('finish-btn');
const micBtn = document.getElementById('mic-btn');
const submitBtn = document.getElementById('submit-btn');
const answerArea = document.getElementById('user-answer');

// Handle Enter to submit
if (answerArea) {
    answerArea.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            submitBtn.click();
        }
    });
}
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

    loginBtn.disabled = true;
    loginBtn.innerHTML = `
        <div class="btn-loading">
            <span class="loading-ping"><span></span><span></span></span>
            <span class="loading-text">Authenticating...</span>
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
        loginBtn.disabled = false;
        loginBtn.innerText = isSignUpMode ? "Create Career Account" : "Sign In";
        lucide.createIcons();
    }
};

let userRole, userLevel, currentUserId, isRecording = false;
let sessionScores = { technical: [], relevance: [], communication: [], star: [] };
let sessionTranscript = []; 
let currentShuffledBank = [];
let radarChart = null; // Fix for ReferenceError

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
        const data = await getNextQuestion(userRole, userLevel, []);
        const questionText = typeof data.question === 'object' ? data.question.text || data.question.question : data.question;
        
        sessionAskedQuestions.push(questionText);
        
        const resultsPanel = document.getElementById('results-panel');
        if (resultsPanel) {
            resultsPanel.classList.add('hidden');
            document.body.appendChild(resultsPanel); // Safely store it before clearing
        }
        
        // CLEAR CHAT AND START
        chatContainer.innerHTML = '';
        addAIBubble(questionText);
        
        setupScreen.classList.add('hidden');
        interviewRoom.classList.remove('hidden');
    } catch (e) {
        alert("Failed to start session. Is backend running?");
    } finally {
        startBtn.innerHTML = `<span>Start Calibration</span> <i data-lucide="rocket" class="w-4 h-4"></i>`;
        
        // INITIALIZE CHART
        const ctx = document.getElementById('cockpit-stats-chart');
        if (ctx && !radarChart) {
            radarChart = new Chart(ctx, {
                type: 'radar',
                data: {
                    labels: ["Knowledge", "Role Fit", "Soft Skills", "Structure"],
                    datasets: [{
                        label: 'Real-time Metrics',
                        data: [0, 0, 0, 0],
                        backgroundColor: 'rgba(99, 102, 241, 0.1)',
                        borderColor: 'rgba(99, 102, 241, 1)',
                        borderWidth: 2
                    }]
                },
                options: { scales: { r: { beginAtZero: true, max: 100 } } }
            });
        }
        lucide.createIcons();
    }
};

// Mic Toggle
micBtn.onclick = () => {
    // 1. Initial State Toggle
    isRecording = !isRecording;
    
    // 2. SAFETY ENGINE CHECK
    if (!voice) return console.error("Voice Engine offline. Check recorder.js");

    // 3. UI FEEDBACK (Pulse)
    micBtn.classList.toggle('pulse-red', isRecording);
    
    if (isRecording) {
        voice.start();
        micBtn.innerHTML = `<i data-lucide="mic-off" class="w-6 h-6"></i>`;
    } else {
        voice.stop();
        micBtn.innerHTML = `<i data-lucide="mic" class="w-6 h-6"></i>`;
    }

    // 4. OPTIONAL VISUALIZER (Only if exists)
    const visualizer = document.getElementById('visualizer');
    if (visualizer) {
        visualizer.classList.toggle('active', isRecording);
        const bars = visualizer.querySelectorAll('.wave-bar');
        bars.forEach(b => b.classList.toggle('active', isRecording));
    }

    lucide.createIcons();
};

// Analyze Answer (Submits and turns off mic)
submitBtn.onclick = async () => {
    // 1. FORCIBLY STOP MIC IF ON
    if (isRecording) {
        voice.stop();
        isRecording = false;
        micBtn.classList.remove('pulse-red');
        micBtn.innerHTML = `<i data-lucide="mic" class="w-6 h-6"></i>`;
    }

    const answer = answerArea.value.trim();
    if (!answer) return alert("Please provide an answer.");

    // EXPLICIT CLEAR (Instant feedback)
    answerArea.value = "";
    voice.reset();

    addUserBubble(answer);
    
    // Last Question Text (for Evaluation) should be the last AI bubble
    const currentQ = sessionAskedQuestions[sessionAskedQuestions.length - 1];
    
    // Add Dynamic Thinking Bubble
    const thinking = document.createElement('div');
    thinking.id = "ai-thinking-bubble";
    thinking.className = "flex items-center gap-2 text-indigo-400 text-sm mt-2 font-medium bg-indigo-50/50 p-4 rounded-2xl w-fit";
    thinking.innerHTML = `<i data-lucide="loader-2" class="animate-spin w-4 h-4"></i> PrepPilot is evaluating...`;
    chatContainer.appendChild(thinking);
    scrollToBottom();

    try {
        // Clear Input immediately
        answerArea.value = "";
        voice.reset();
        
        // Disable Send to prevent spam
        submitBtn.disabled = true;
        submitBtn.classList.add('opacity-50');

        const data = await sendToAI(userRole, userLevel, currentQ, answer, currentUserId);
        
        // Hide Thinking Bubble
        thinking.remove();
        submitBtn.disabled = false;
        submitBtn.classList.remove('opacity-50');

        sessionTranscript.push({ question: currentQ, answer: answer, feedback: data.feedback, scores: data });

        // Update Session Aggregates (Crucial for Summary Chart)
        sessionScores.technical.push(data.technical);
        sessionScores.relevance.push(data.relevance);
        sessionScores.communication.push(data.communication);
        sessionScores.star.push(data.star_method);

        // Update Live Cockpit Stats (Only if exists)
        if (radarChart) {
            radarChart.data.datasets[0].data = [
                data.technical, 
                data.relevance, 
                data.communication, 
                data.star_method
            ];
            radarChart.update();
        }
        
        renderResults(data);
    } catch (e) {
        console.error("Evaluation Error:", e);
        alert(`Error: ${e.message || "The AI is currently processing. Please try again."}`);
        
        // Remove thinking bubble on failure
        const thinkingBubble = document.getElementById('ai-thinking-bubble');
        if (thinkingBubble) thinkingBubble.remove();
        
        submitBtn.disabled = false;
        submitBtn.innerHTML = `<span>Analyze Answer</span> <i data-lucide="send" class="w-4 h-4"></i>`;
        lucide.createIcons();
    }
};

let sessionAskedQuestions = [];

// Next Question logic
const nextBtn = document.getElementById('next-question-btn');
if (nextBtn) {
    nextBtn.onclick = async () => {
        answerArea.value = "";
        voice.reset();
        // Reset thinking and hidden panels
        const resultsPanel = document.getElementById('results-panel');
        if (resultsPanel) resultsPanel.classList.add('hidden');
        
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

        const data = await getNextQuestion(userRole, userLevel, sessionAskedQuestions);
        const questionText = typeof data.question === 'object' ? data.question.text || data.question.question : data.question;
        
        sessionAskedQuestions.push(questionText);
        addAIBubble(questionText);
    } catch (e) {
        alert("Session interrupted. Check connection.");
        } finally {
            nextBtn.innerHTML = `<span>Next Question</span> <i data-lucide="skip-forward" class="w-4 h-4 text-white"></i>`;
            lucide.createIcons();
        }
    };
}

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

    // Save metadata for history tracking
    saveSession(currentUserId, userRole, userLevel, {
        technical: techAvg,
        relevance: relAvg,
        communication: commAvg,
        star_method: starAvg
    });

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
    document.getElementById('rank-label').innerText = "Current Ranking";
    
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
            scales: { 
                r: { 
                    min: 0, 
                    max: 100, 
                    stepSize: 20, 
                    grid: { color: 'rgba(71, 85, 105, 0.1)' }, // Better contrast for light bg
                    angleLines: { color: 'rgba(71, 85, 105, 0.1)' },
                    pointLabels: { 
                        color: '#475569', 
                        font: { size: 10, weight: '900' },
                        padding: 15
                    }, 
                    ticks: { display: false } 
                } 
            }
        }
    });

    // Learning Topics Rendering
    const allTopics = sessionTranscript.flatMap(t => t.scores.learning_topics || []);
    const uniqueTopics = [...new Set(allTopics)].slice(0, 4);
    
    document.getElementById('learning-topics-list').innerHTML = uniqueTopics.map(t => `
        <div class="flex items-center gap-3 text-xs text-slate-600">
            <i data-lucide="check-circle-2" class="w-3 h-3 text-blue-600"></i>
            <span class="font-medium">${t}</span>
        </div>
    `).join('') || `<p class="text-xs text-slate-400 italic">No specific gaps identified. Excellent work!</p>`;

    // Navigation Wiring (Persistent Session - Null Safe)
    const returnToBase = () => {
        reportScreen.classList.add('hidden');
        setupScreen.classList.remove('hidden');
        loadDashboard(); 
    };

    const closeBtn = document.getElementById('close-report-final');
    if (closeBtn) closeBtn.onclick = returnToBase;
    
    const dashBtn = document.getElementById('dashboard-btn');
    if (dashBtn) dashBtn.onclick = returnToBase;

    const restartBtn = document.getElementById('restart-btn');
    if (restartBtn) restartBtn.onclick = () => {
        answerArea.value = "";
        voice.reset();
        reportScreen.classList.add('hidden');
        startBtn.click();
    };

    lucide.createIcons();
};

const chatContainer = document.getElementById('chat-container');

// Helper: Add AI Question Bubble
function addAIBubble(text) {
    const bubble = document.createElement('div');
    bubble.className = "flex items-start gap-4 reveal mb-6";
    bubble.innerHTML = `
        <div class="w-10 h-10 rounded-xl bg-indigo-600 flex-shrink-0 flex items-center justify-center shadow-lg shadow-indigo-600/20">
            <i data-lucide="bot" class="w-5 h-5 text-indigo-100"></i>
        </div>
        <div class="glass p-6 rounded-[2rem] rounded-tl-none border-t border-t-indigo-500/20 max-w-[85%] text-slate-800 leading-relaxed shadow-sm">
            ${text}
        </div>
    `;
    chatContainer.appendChild(bubble);
    lucide.createIcons();
    scrollToBottom();
}

// Helper: Add User Answer Bubble
function addUserBubble(text) {
    const bubble = document.createElement('div');
    bubble.className = "flex flex-col items-end gap-2 mb-6 reveal self-end w-full";
    bubble.innerHTML = `
        <div class="flex items-center gap-2 mb-1 px-2">
             <span class="text-[10px] uppercase font-black text-indigo-400 tracking-widest">Your Response</span>
             <div class="w-6 h-6 rounded-lg bg-slate-900 flex items-center justify-center">
                 <i data-lucide="user" class="w-3 h-3 text-white"></i>
             </div>
        </div>
        <div class="bg-indigo-50 border border-indigo-100 p-5 rounded-[2rem] rounded-tr-none max-w-[75%] shadow-sm">
            <p class="text-sm italic text-indigo-900 leading-relaxed">${text}</p>
        </div>
    `;
    chatContainer.appendChild(bubble);
    lucide.createIcons();
    scrollToBottom();
}

function scrollToBottom() {
    if (chatContainer) {
        chatContainer.scrollTo({ top: chatContainer.scrollHeight, behavior: 'smooth' });
    }
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
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
        <div class="bg-white border-2 border-indigo-50 p-4 rounded-2xl shadow-sm">
            <p class="text-[10px] uppercase font-bold text-slate-400 mb-1 tracking-widest">${s.l}</p>
            <p class="text-2xl font-black ${s.c}">${Math.round(s.v)}%</p>
        </div>
    `).join('');

    // 4. DISPLAY FEEDBACK RIDICULOUSLY CLEARLY
    document.getElementById('feedback-text').innerHTML = `
        <div class="p-6 bg-indigo-50 border border-indigo-100 rounded-2xl italic text-slate-800 leading-relaxed shadow-sm">
            "${data.feedback}"
        </div>
    `;
    
    // Display Ideal Answer
    document.getElementById('ideal-answer-text').innerHTML = `
        <div class="p-6 bg-blue-50 border border-blue-100 rounded-2xl text-blue-900 leading-relaxed shadow-sm">
            <span class="text-[10px] uppercase font-black text-blue-400 mb-2 block tracking-widest">Mastery Benchmark</span>
            ${data.ideal_answer}
        </div>
    `;

    // 5. Populate Suggestions
    const suggestionsList = document.getElementById('suggestions-list');
    if (suggestionsList) {
        suggestionsList.innerHTML = (data.suggestions || []).map(s => `
            <div class="flex items-start gap-3 text-sm text-slate-600">
                <i data-lucide="check-circle-2" class="w-4 h-4 text-emerald-500 mt-1"></i>
                <span>${s}</span>
            </div>
        `).join('');
    }
    
    lucide.createIcons();
}