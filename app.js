/**
 * ForeFix - Full Updated App Logic
 */

// --- Authentication Module ---
const Auth = {
    USERS_KEY: 'forefix_users',
    SESSION_KEY: 'forefix_session',

    getUsers() {
        const users = localStorage.getItem(this.USERS_KEY);
        return users ? JSON.parse(users) : [];
    },

    signup(name, email, password) {
        const users = this.getUsers();
        if (users.find(u => u.email === email)) return false;

        const newUser = {
            id: Date.now().toString(),
            name, email, password,
            role: 'user',
            joinedAt: new Date().toISOString()
        };
        users.push(newUser);
        localStorage.setItem(this.USERS_KEY, JSON.stringify(users));
        return true;
    },

    login(email, password) {
        const users = this.getUsers();
        const user = users.find(u => u.email === email && u.password === password);
        if (user) {
            const sessionUser = { ...user };
            delete sessionUser.password;
            localStorage.setItem(this.SESSION_KEY, JSON.stringify(sessionUser));
            return true;
        }
        return false;
    },

    logout() {
        localStorage.removeItem(this.SESSION_KEY);
        window.location.href = 'index.html';
    },

    getCurrentUser() {
        const session = localStorage.getItem(this.SESSION_KEY);
        return session ? JSON.parse(session) : null;
    },

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
        if (savedTheme) document.body.setAttribute('data-theme', savedTheme);
        else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches)
            document.body.setAttribute('data-theme', 'dark');
    }
};

// --- Dashboard Module ---
const Dashboard = {
    selectedSymptoms: new Map(),
    currentTab: 'mobile',

    symptomsData: {
        mobile: [
            { id: 'heating', label: 'Phone Overheating', icon: '🔥' },
            { id: 'battery', label: 'Battery Drain', icon: '🔋' },
            { id: 'storage', label: 'Storage Almost Full', icon: '💾' },
            { id: 'slow', label: 'Slow Performance', icon: '🐢' },
            { id: 'ram', label: 'Memory Hog Detected', icon: '🧠' },
            { id: 'notifications', label: 'Frequent Notifications', icon: '🔔' },
            { id: 'network', label: 'Weak Signal', icon: '📶' },
            { id: 'restart', label: 'Random Restarts', icon: '🔄' }
        ],
        laptop: [
            { id: 'fan', label: 'Loud Fan Noise', icon: '🔊' },
            { id: 'blue_screen', label: 'Blue Screen Errors', icon: '💻' },
            { id: 'slow_boot', label: 'Slow Boot Time', icon: '⏳' },
            { id: 'wifi', label: 'WiFi Disconnects', icon: '📡' },
            { id: 'overheat', label: 'Laptop Overheating', icon: '🔥' },
            { id: 'battery_laptop', label: 'Battery Drain', icon: '🔋' }
        ],
        webapp: [
            { id: 'layout', label: 'Broken Layout', icon: '🧩' },
            { id: 'login_fail', label: 'Login Failures', icon: '🔐' },
            { id: 'data_loss', label: 'Unsaved / Lost Data', icon: '💾' },
            { id: 'slow_render', label: 'Slow Page Rendering', icon: '⏳' },
            { id: 'session_timeout', label: 'Unexpected Session Timeout', icon: '⌛' },
            { id: 'payment_fail', label: 'Payment Failures', icon: '💰' },
            { id: 'error_500', label: 'Server Errors (500)', icon: '💥' },
            { id: 'api_throttle', label: 'API Throttling / Slow Response', icon: '🐌' }
        ]
    },

    symptomProblems: {
        // Mobile
        heating: { problem: 'Phone overheating', severity: 3, actions: ['Close heavy apps', 'Remove phone case', 'Avoid charging while using'] },
        battery: { problem: 'Battery drain', severity: 2, actions: ['Lower brightness', 'Limit background apps', 'Check battery health'] },
        storage: { problem: 'Storage almost full', severity: 1, actions: ['Clear cache', 'Delete unused files'] },
        slow: { problem: 'Slow performance', severity: 2, actions: ['Restart device', 'Close background apps'] },
        ram: { problem: 'High memory usage', severity: 2, actions: ['Close unused apps', 'Clear cache'] },
        notifications: { problem: 'Too many notifications', severity: 1, actions: ['Disable non-essential notifications'] },
        network: { problem: 'Weak signal', severity: 2, actions: ['Move to area with better coverage', 'Restart network'] },
        restart: { problem: 'Random restarts', severity: 3, actions: ['Update system', 'Check faulty apps', 'Factory reset if needed'] },

        // Laptop
        fan: { problem: 'Loud fan noise', severity: 2, actions: ['Clean vents', 'Check CPU load'] },
        blue_screen: { problem: 'Blue screen errors', severity: 3, actions: ['Update drivers', 'Check hardware'] },
        slow_boot: { problem: 'Slow boot time', severity: 2, actions: ['Disable startup apps', 'Upgrade SSD'] },
        wifi: { problem: 'WiFi disconnects', severity: 2, actions: ['Restart router', 'Update network drivers'] },
        overheat: { problem: 'Laptop overheating', severity: 3, actions: ['Check vents', 'Use cooling pad'] },
        battery_laptop: { problem: 'Battery drain', severity: 2, actions: ['Check battery health', 'Replace battery if needed'] },

        // WebApp
        layout: { problem: 'Broken UI/Layout', severity: 2, actions: ['Check CSS/HTML', 'Clear browser cache'] },
        login_fail: { problem: 'Login failures', severity: 3, actions: ['Check auth server', 'Reset passwords', 'Validate backend'] },
        data_loss: { problem: 'Unsaved or lost data', severity: 3, actions: ['Enable autosave', 'Check DB connection'] },
        slow_render: { problem: 'Slow page rendering', severity: 2, actions: ['Optimize images', 'Minify JS/CSS', 'Lazy load content'] },
        session_timeout: { problem: 'Unexpected session timeout', severity: 2, actions: ['Increase session expiry', 'Check server load'] },
        payment_fail: { problem: 'Payment failures', severity: 3, actions: ['Check payment gateway', 'Validate logs', 'Retry mechanism'] },
        error_500: { problem: 'Server 500 errors', severity: 3, actions: ['Check server logs', 'Restart services'] },
        api_throttle: { problem: 'API throttling / slow response', severity: 2, actions: ['Implement rate limiting', 'Optimize queries', 'Caching'] }
    },

    init() {
        this.setupEventListeners();
        this.renderSymptoms();
    },

    setupEventListeners() {
        document.getElementById('themeToggle').addEventListener('click', () => UI.toggleDarkMode());
        document.getElementById('logoutBtn').addEventListener('click', () => Auth.logout());
        document.getElementById('historyBtn').addEventListener('click', () => this.toggleHistory(true));
        document.getElementById('closeHistory').addEventListener('click', () => this.toggleHistory(false));
        document.querySelectorAll('.tab-btn').forEach(btn => btn.addEventListener('click', e => this.switchTab(e.target.dataset.tab)));
        document.getElementById('resetBtn').addEventListener('click', () => {
            this.selectedSymptoms.clear();
            this.renderSymptoms();
            this.hideResults();
        });
        document.getElementById('analyzeBtn').addEventListener('click', () => this.analyze());
    },

    switchTab(tabId) {
        this.currentTab = tabId;
        this.selectedSymptoms.clear();
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.tab === tabId));
        this.renderSymptoms();
        this.hideResults();
    },

    getCardLabel(symptomId, selectedSeverity) {
        if (this.currentTab === 'mobile') {
            if (!selectedSeverity) return 'Select';
            return { low: 'Low', medium: 'Medium', high: 'High' }[selectedSeverity];
        } else {
            return selectedSeverity ? 'Selected' : 'Select';
        }
    },

    renderSymptoms() {
        const grid = document.getElementById('symptomGrid');
        grid.innerHTML = '';
        const symptoms = this.symptomsData[this.currentTab] || [];

        symptoms.forEach(symptom => {
            const card = document.createElement('div');
            const severity = this.selectedSymptoms.get(symptom.id);
            const severityClass = severity && this.currentTab === 'mobile' ? `severity-${severity}` : '';
            const selectedClass = severity ? 'selected' : '';
            const statusText = this.getCardLabel(symptom.id, severity);

            card.className = `symptom-card ${selectedClass} ${severityClass}`;
            card.innerHTML = `
                <span class="symptom-icon">${symptom.icon}</span>
                <h4>${symptom.label}</h4>
                <div class="symptom-status"><span class="severity-badge">${statusText}</span></div>
            `;
            card.onclick = () => this.toggleSymptom(symptom.id);
            grid.appendChild(card);
        });
    },

    toggleSymptom(id) {
        const current = this.selectedSymptoms.get(id);
        let next = null;
        if (this.currentTab === 'mobile') {
            next = !current ? 'low' : current === 'low' ? 'medium' : current === 'medium' ? 'high' : null;
        } else {
            next = current ? null : 'selected';
        }
        if (next) this.selectedSymptoms.set(id, next);
        else this.selectedSymptoms.delete(id);
        this.renderSymptoms();
    },

    hideResults() {
        document.getElementById('resultSection').classList.add('hidden');
        document.getElementById('predictionOutput').classList.add('hidden');
        document.getElementById('loader').classList.add('hidden');
    },

    analyze() {
        if (this.selectedSymptoms.size === 0) return alert('Please select at least one symptom');
        this.hideResults();
        document.getElementById('resultSection').classList.remove('hidden');
        const loader = document.getElementById('loader');
        loader.classList.remove('hidden');

        setTimeout(() => {
            loader.classList.add('hidden');
            this.showPrediction();
        }, 1000);
    },

    showPrediction() {
        const selectedIds = Array.from(this.selectedSymptoms.keys());
        let problems = [];
        let actions = [];
        let totalSeverity = 0;

        selectedIds.forEach(id => {
            if (this.symptomProblems[id]) {
                problems.push(this.symptomProblems[id].problem);
                actions = actions.concat(this.symptomProblems[id].actions);
                totalSeverity += this.symptomProblems[id].severity;
            }
        });

        actions = [...new Set(actions)];
        const risk = totalSeverity >= 10 ? 'HIGH' : (totalSeverity >= 5 ? 'MEDIUM' : 'LOW');
        const score = Math.max(10, 100 - totalSeverity * 10);

        const prediction = {
            title: 'System Health Report',
            reason: 'Detected issues: ' + problems.join(', '),
            risk, score, actions
        };

        document.getElementById('predictionOutput').classList.remove('hidden');
        document.getElementById('predictionTitle').textContent = prediction.title;
        document.getElementById('predictionReason').textContent = prediction.reason;
        const riskEl = document.getElementById('riskLevel');
        riskEl.textContent = prediction.risk;
        riskEl.style.color = risk === 'HIGH' ? 'var(--alert)' : (risk === 'MEDIUM' ? 'var(--warning)' : 'var(--success)');
        document.getElementById('riskBar').style.width = risk === 'HIGH' ? '90%' : (risk === 'MEDIUM' ? '60%' : '25%');
        document.getElementById('riskBar').style.backgroundColor = riskEl.style.color;
        document.getElementById('healthScore').textContent = prediction.score;
        const circle = document.getElementById('healthCircle');
        circle.setAttribute('stroke-dasharray', `${prediction.score}, 100`);
        circle.style.stroke = prediction.score > 80 ? 'var(--success)' : (prediction.score > 50 ? 'var(--warning)' : 'var(--alert)');
        document.getElementById('actionList').innerHTML = prediction.actions.map(a => `<li>${a}</li>`).join('');

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
        } else modal.classList.remove('open');
    },

    renderHistory() {
        const list = document.getElementById('historyList');
        const history = JSON.parse(localStorage.getItem('forefix_history') || '[]');
        if (history.length === 0) return list.innerHTML = '<p>No history found.</p>';
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

// Initialize theme
document.addEventListener('DOMContentLoaded', () => UI.initTheme());
