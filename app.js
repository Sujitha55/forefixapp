/**
 * ForeFix - App Logic
 */

// --- Authentication Module ---
const Auth = {
    // Key for storing users array in localStorage
    USERS_KEY: 'forefix_users',
    // Key for storing the currently logged-in user in localStorage
    SESSION_KEY: 'forefix_session',

    /**
     * Get all registered users
     * @returns {Array} List of users
     */
    getUsers() {
        const users = localStorage.getItem(this.USERS_KEY);
        return users ? JSON.parse(users) : [];
    },

    /**
     * Register a new user
     * @param {string} name 
     * @param {string} email 
     * @param {string} password 
     * @returns {boolean} True if successful, false if email exists
     */
    signup(name, email, password) {
        const users = this.getUsers();
        if (users.find(u => u.email === email)) {
            return false; // Email already exists
        }

        const newUser = {
            id: Date.now().toString(),
            name,
            email,
            password, // In a real app, hash this!
            role: 'user', // Default role
            joinedAt: new Date().toISOString()
        };

        users.push(newUser);
        localStorage.setItem(this.USERS_KEY, JSON.stringify(users));
        return true;
    },

    /**
     * Authenticate user
     * @param {string} email 
     * @param {string} password 
     * @returns {boolean} True if login successful
     */
    login(email, password) {
        const users = this.getUsers();
        const user = users.find(u => u.email === email && u.password === password);

        if (user) {
            // Create session (exclude password from session)
            const sessionUser = { ...user };
            delete sessionUser.password;
            localStorage.setItem(this.SESSION_KEY, JSON.stringify(sessionUser));
            return true;
        }
        return false;
    },

    /**
     * Logout user
     */
    logout() {
        localStorage.removeItem(this.SESSION_KEY);
        window.location.href = 'index.html';
    },

    /**
     * Check if user is logged in
     * @returns {object|null} User object if logged in, null otherwise
     */
    getCurrentUser() {
        const session = localStorage.getItem(this.SESSION_KEY);
        return session ? JSON.parse(session) : null;
    },

    /**
     * Check if session exists
     * @returns {boolean}
     */
    isAuthenticated() {
        return !!localStorage.getItem(this.SESSION_KEY);
    }
};

// --- Global UI Helpers ---
const UI = {
    toggleDarkMode() {
        const body = document.body;
        const currentTheme = body.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        body.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
    },

    initTheme() {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) {
            document.body.setAttribute('data-theme', savedTheme);
        } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            document.body.setAttribute('data-theme', 'dark');
        }
    }
};

// --- Dashboard Module ---
const Dashboard = {
    selectedSymptoms: new Map(), // Map<id, severity>
    currentTab: 'mobile',

    symptomsData: {
        mobile: [
            { id: 'heating', label: 'Phone Heating', icon: '🔥' },
            { id: 'battery', label: 'Battery Drain', icon: '🔋' },
            { id: 'storage', label: 'Storage Full', icon: '💾' },
            { id: 'slow', label: 'Slow Performance', icon: '🐢' },
            { id: 'ram', label: 'High RAM Usage', icon: '🧠' },
            { id: 'notifications', label: 'Frequent Notifications', icon: '🔔' },
            { id: 'network', label: 'Weak Signal', icon: '📶' },
            { id: 'restart', label: 'Random Restarts', icon: '🔄' }
        ],
        laptop: [
            { id: 'fan', label: 'Loud Fan Noise', icon: '🔊' },
            { id: 'blue_screen', label: 'Blue Screen errors', icon: '💻' },
            { id: 'slow_boot', label: 'Slow Boot Time', icon: '⏳' },
            { id: 'wifi', label: 'WiFi Disconnects', icon: '📡' }
        ],
        webapp: [
            { id: 'api_slow', label: 'Slow API Response', icon: '🐌' },
            { id: 'js_error', label: 'Console Errors', icon: '⚠️' },
            { id: 'layout', label: 'Broken Layout', icon: '🧩' }
        ]
    },

    init() {
        this.setupEventListeners();
        this.renderSymptoms();
    },

    setupEventListeners() {
        // Theme Toggle
        document.getElementById('themeToggle').addEventListener('click', () => {
            UI.toggleDarkMode();
        });

        // Logout
        document.getElementById('logoutBtn').addEventListener('click', () => {
            Auth.logout();
        });

        // History
        document.getElementById('historyBtn').addEventListener('click', () => {
            this.toggleHistory(true);
        });
        document.getElementById('closeHistory').addEventListener('click', () => {
            this.toggleHistory(false);
        });

        // Tabs
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });

        // Reset
        document.getElementById('resetBtn').addEventListener('click', () => {
            this.selectedSymptoms.clear();
            this.renderSymptoms();
            this.hideResults();
        });

        // Analyze
        document.getElementById('analyzeBtn').addEventListener('click', () => {
            this.analyze();
        });
    },

    switchTab(tabId) {
        this.currentTab = tabId;
        this.selectedSymptoms.clear();

        // Update UI
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabId);
        });

        this.renderSymptoms();
        this.hideResults();
    },

    renderSymptoms() {
        const grid = document.getElementById('symptomGrid');
        grid.innerHTML = '';

        const symptoms = this.symptomsData[this.currentTab] || [];

        symptoms.forEach(symptom => {
            const card = document.createElement('div');
            const severity = this.selectedSymptoms.get(symptom.id);
            const severityClass = severity ? `severity-${severity}` : '';
            const selectedClass = severity ? 'selected' : '';

            card.className = `symptom-card ${selectedClass} ${severityClass}`;

            let statusText = 'Select';
            if (severity === 'low') statusText = 'Low';
            if (severity === 'medium') statusText = 'Medium';
            if (severity === 'high') statusText = 'High';

            card.innerHTML = `
                <span class="symptom-icon">${symptom.icon}</span>
                <h4>${symptom.label}</h4>
                <div class="symptom-status">
                    <span class="severity-badge">${statusText}</span>
                </div>
            `;
            card.onclick = () => this.toggleSymptom(symptom.id);
            grid.appendChild(card);
        });
    },

    toggleSymptom(id) {
        // Cycle: None -> Low -> Medium -> High -> None
        const current = this.selectedSymptoms.get(id);
        let next = null;

        if (!current) next = 'low';
        else if (current === 'low') next = 'medium';
        else if (current === 'medium') next = 'high';
        else if (current === 'high') next = null;

        if (next) {
            this.selectedSymptoms.set(id, next);
        } else {
            this.selectedSymptoms.delete(id);
        }
        this.renderSymptoms();
    },

    hideResults() {
        document.getElementById('resultSection').classList.add('hidden');
        document.getElementById('predictionOutput').classList.add('hidden');
        document.getElementById('loader').classList.add('hidden');
    },

    analyze() {
        if (this.selectedSymptoms.size === 0) {
            alert('Please select at least one symptom');
            return;
        }

        this.hideResults();
        const loader = document.getElementById('loader');
        const resultSection = document.getElementById('resultSection');

        resultSection.classList.remove('hidden');
        loader.classList.remove('hidden');

        // Simulate AI Delay
        setTimeout(() => {
            loader.classList.add('hidden');
            this.showPrediction();
        }, 2000);
    },

    showPrediction() {
        const symptoms = Array.from(this.selectedSymptoms.keys());

        // Count-based Severity Logic
        const symptomCount = symptoms.length;
        let prediction = {};

        if (symptomCount >= 4) {
            // HIGH SEVERITY
            prediction = {
                title: "Critical System Risk",
                reason: `Detected ${symptomCount} critical symptoms indicating severe instability.`,
                risk: "HIGH",
                score: 35,
                actions: [
                    "Backup important data",
                    "Avoid heavy usage",
                    "Factory reset (if needed)",
                    "Visit service center"
                ]
            };
        } else if (symptomCount === 3) {
            // MEDIUM SEVERITY
            prediction = {
                title: "Performance Degraded",
                reason: "System performance is impacted by multiple active issues.",
                risk: "MEDIUM",
                score: 65,
                actions: [
                    "Clear cache",
                    "Uninstall unused apps",
                    "Limit background apps"
                ]
            };
        } else {
            // LOW SEVERITY (1-2 symptoms) or Default
            prediction = {
                title: "Minor Issues Detected",
                reason: "Routine maintenance recommended to improve efficiency.",
                risk: "LOW",
                score: 90,
                actions: [
                    "Clear cache",
                    "Restart device"
                ]
            };
        }

        // Render Prediction
        document.getElementById('predictionOutput').classList.remove('hidden');
        document.getElementById('predictionTitle').textContent = prediction.title;
        document.getElementById('predictionReason').textContent = prediction.reason;

        const riskEl = document.getElementById('riskLevel');
        riskEl.textContent = prediction.risk;
        riskEl.style.color = prediction.risk === 'HIGH' ? 'var(--alert)' : (prediction.risk === 'MEDIUM' ? 'var(--warning)' : 'var(--success)');

        document.getElementById('riskBar').style.width = prediction.risk === 'HIGH' ? '90%' : (prediction.risk === 'MEDIUM' ? '60%' : '25%');
        document.getElementById('riskBar').style.backgroundColor = riskEl.style.color;

        // Health Score
        document.getElementById('healthScore').textContent = prediction.score;
        const circle = document.getElementById('healthCircle');
        circle.setAttribute('stroke-dasharray', `${prediction.score}, 100`);
        circle.style.stroke = prediction.score > 80 ? 'var(--success)' : (prediction.score > 50 ? 'var(--warning)' : 'var(--alert)');

        // Actions
        const actionList = document.getElementById('actionList');
        actionList.innerHTML = prediction.actions.map(action => `<li>${action}</li>`).join('');

        // Save History
        this.saveHistory(prediction);
    },

    saveHistory(prediction) {
        const history = JSON.parse(localStorage.getItem('forefix_history') || '[]');
        history.unshift({
            date: new Date().toISOString(),
            input: Array.from(this.selectedSymptoms.entries()),
            result: prediction
        });
        localStorage.setItem('forefix_history', JSON.stringify(history));
    },

    toggleHistory(show) {
        const modal = document.getElementById('historyModal');
        if (show) {
            modal.classList.add('open');
            this.renderHistory();
        } else {
            modal.classList.remove('open');
        }
    },

    renderHistory() {
        const list = document.getElementById('historyList');
        const history = JSON.parse(localStorage.getItem('forefix_history') || '[]');

        if (history.length === 0) {
            list.innerHTML = '<p>No history found.</p>';
            return;
        }

        list.innerHTML = history.map(item => `
            <div class="history-item">
                <div class="history-date">${new Date(item.date).toLocaleString()}</div>
                <div class="history-title">${item.result.title}</div>
                <div class="history-risk" style="color: ${item.result.risk === 'HIGH' ? 'var(--alert)' : (item.result.risk === 'MEDIUM' ? 'var(--warning)' : 'var(--success)')}">
                    Risk: ${item.result.risk}
                </div>
            </div>
        `).join('');
    }
};

// Initialize theme on load
document.addEventListener('DOMContentLoaded', () => {
    UI.initTheme();
});
