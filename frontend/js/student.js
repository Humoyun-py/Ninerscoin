const StudentModule = {
    // Helper to get translation or fallback
    t: (key, params) => (window.t ? window.t(key, params) : key),

    initDashboard() {
        this.fetchDashboardData();
        this.loadTests();
        this.loadMyClassInfo();
        this.initializeWordOfTheDay();
        this.initializeMotivation();

        // Notification Polling
        this.checkNotifications();
        setInterval(() => this.checkNotifications(), 2000);
    },

    initializeMotivation() {
        const quotes = [
            { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
            { text: "The beautiful thing about learning is that no one can take it away from you.", author: "B.B. King" },
            { text: "Education is the most powerful weapon which you can use to change the world.", author: "Nelson Mandela" },
            { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
            { text: "Language is the blood of the soul into which thoughts run and out of which they grow.", author: "Oliver Wendell Holmes" }
        ];

        const dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24);
        const dailyQuote = quotes[dayOfYear % quotes.length];

        const quoteEl = document.getElementById('dailyQuote');
        const authorEl = document.getElementById('quoteAuthor');

        if (quoteEl) quoteEl.innerText = `"${dailyQuote.text}"`;
        if (authorEl) authorEl.innerText = `— ${dailyQuote.author}`;
    },

    updateRankProgress(rank, xp = 0) {
        const progressEl = document.getElementById('rankProgress');
        const rankText = document.getElementById('rankText');
        const nextRankText = document.getElementById('nextRankText');
        const xpLabel = document.querySelector('.xp-label-current');
        const xpMaxLabel = document.querySelector('.xp-label-max');

        const ranks = [
            { name: 'Newbie', min: 0, max: 1000 },
            { name: 'Intermediate', min: 1000, max: 2500 },
            { name: 'Advanced', min: 2500, max: 5000 },
            { name: 'Expert', min: 5000, max: 10000 }
        ];

        let currentRank = ranks.find(r => r.name === rank) || ranks[0];
        let nextRank = ranks[ranks.indexOf(currentRank) + 1] || currentRank;

        let progress = ((xp - currentRank.min) / (currentRank.max - currentRank.min)) * 100;
        progress = Math.max(0, Math.min(100, progress));

        if (progressEl) progressEl.style.width = `${progress}%`;
        if (rankText) rankText.innerText = rank;
        if (nextRankText) nextRankText.innerText = rank === 'Expert' ? 'Max Level Reached!' : `Next: ${nextRank.name} (${nextRank.min} XP)`;

        if (xpLabel) xpLabel.innerText = `${xp} XP`;
        if (xpMaxLabel) xpMaxLabel.innerText = `${currentRank.max} XP`;
    },

    initializeWordOfTheDay() {
        const words = [
            { word: "Persist", pronunciation: "/pəˈsɪst/", type: "verb", definition: "To continue firmly in an opinion or a course of action in spite of difficulty or opposition.", usage: "Keep persisting and you will earn more coins!" },
            { word: "Resilient", pronunciation: "/rɪˈzɪliənt/", type: "adj", definition: "Able to withstand or recover quickly from difficult conditions.", usage: "English learners must be resilient in their studies!" },
            { word: "Eloquence", pronunciation: "/ˈeləkwəns/", type: "noun", definition: "Fluent or persuasive speaking or writing.", usage: "Mastering vocabulary leads to great eloquence." }
        ];

        // Pick a word based on the date
        const dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24);
        const dailyWord = words[dayOfYear % words.length];

        const wordEl = document.getElementById('dailyWord');
        const pronEl = document.getElementById('dailyPron');
        const defEl = document.getElementById('dailyDef');
        const usageEl = document.getElementById('dailyUsage');

        if (wordEl) wordEl.innerText = dailyWord.word;
        if (pronEl) pronEl.innerText = `${dailyWord.pronunciation} • ${dailyWord.type}`;
        if (defEl) defEl.innerText = `"${dailyWord.definition}"`;
        if (usageEl) usageEl.innerHTML = `Usage: ${dailyWord.usage}`;
    },

    async initShop() {
        this.fetchDashboardData(); // Sync balance
        try {
            const items = await api.get('/student/shop/items');
            const container = document.getElementById('shopContainer');

            if (!container) return; // fail safe if not on shop page

            if (items.length === 0) {
                container.innerHTML = `<p style="text-align:center; grid-column: 1/-1;">${this.t('shop_empty')}</p>`;
                return;
            }

            container.innerHTML = items.map(item => `
                <div class="shop-item">
                    <img src="${item.image_url || 'https://via.placeholder.com/150?text=Item'}" class="item-image" alt="${item.name}">
                    <h4>${item.name}</h4>
                    <div class="item-price">${item.price} 🟡</div>
                    <p style="font-size: 0.8rem; color: #666;">${item.stock === -1 ? this.t('unlimited') : item.stock + ' ' + this.t('stock_left')}</p>
                    <button class="btn btn-primary" style="width: 100%; margin-top: 10px;" 
                        onclick="StudentModule.buyItem(${item.id}, '${item.name}', ${item.price})">${this.t('buy_action')}</button>
                </div>
            `).join('');
        } catch (e) {
            console.error(e);
            const c = document.getElementById('shopContainer');
            if (c) c.innerHTML = `<p>${this.t('loading_error')}</p>`;
        }
    },

    buyItem(itemId, name, price) {
        if (!confirm(this.t('confirm_purchase_query', { name: name, price: price }))) return;

        api.post('/student/shop/buy', { item_id: itemId })
            .then(res => {
                this.showNotification(this.t('purchase_success_title'), res.msg);
                this.initShop();
            })
            .catch(err => {
                this.showNotification(this.t('error_title'), err.message, 'error');
            });
    },

    async fetchDashboardData() {
        try {
            const data = await api.get('/student/dashboard');
            if (data && !data.msg) {
                this.updateStats(data);
                if (document.getElementById('activityList')) {
                    this.updateActivity(data.recent_activity);
                }

                // Keep track for polling
                if (!localStorage.getItem('lastCoinBalance')) {
                    localStorage.setItem('lastCoinBalance', data.balance);
                }
            }
        } catch (e) { console.error("Dashboard fetch error:", e); }
    },

    isPolling: false,

    async checkNotifications() {
        if (this.isPolling) return;
        this.isPolling = true;

        try {
            const notifications = await api.get('/student/notifications');
            if (notifications) {
                // Filter unread
                const unread = notifications.filter(n => !n.is_read);

                for (const n of unread) {
                    // Show notification
                    this.showNotification(n.title, n.message);

                    // Mark as read immediately
                    await api.post(`/student/notifications/${n.id}/read`, {});
                }
            }
        } catch (e) {
            console.error("Notification poll error", e);
            // Optional: uncomment to see errors on screen
            // this.showNotification('Error', e.message, 'error');
        }
        finally { this.isPolling = false; }
    },

    async checkForCoinUpdates() {
        try {
            // Just sync balance silently
            const data = await api.get('/student/dashboard');
            const currentBalance = data.balance;

            // Update UI if changed
            const lastBalance = parseFloat(localStorage.getItem('lastCoinBalance') || 0);
            if (currentBalance !== lastBalance) {
                this.updateStats(data);
                this.fetchDashboardData(); // Refresh activity log too
            }
            localStorage.setItem('lastCoinBalance', currentBalance);
        } catch (e) { console.error("Polling error", e); }
    },

    showNotification(title, message, type = 'success') {
        const existing = document.querySelector('.modal-overlay');
        if (existing) existing.remove();

        const emoji = type === 'success' ? '✨' : '⚠️';
        const titleColor = type === 'success' ? 'var(--primary)' : '#e74c3c';

        const modalHTML = `
            <div class="modal-overlay active">
                <div class="modal-box" style="text-align: center; border-top: 5px solid ${titleColor}">
                    <div style="font-size: 4rem; margin-bottom: 10px;">${emoji}</div>
                    <div class="modal-title" style="margin-bottom: 10px; color: ${titleColor};">${title}</div>
                    <p>${message}</p>
                    <button class="btn btn-primary" style="margin-top: 20px; background: ${titleColor}; border: none;" onclick="this.closest('.modal-overlay').remove()">OK</button>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    },

    updateStats(data) {
        const balance = parseFloat(data.balance).toFixed(2);
        const total = parseFloat(data.total_earned).toFixed(2);

        if (document.getElementById('coinBalance')) document.getElementById('coinBalance').innerText = `${balance} 🟡`;
        if (document.getElementById('userBalance')) document.getElementById('userBalance').innerText = `${balance} 🟡`; // For shop page
        if (document.getElementById('totalCoins')) document.getElementById('totalCoins').innerText = total;
        if (document.getElementById('rank')) document.getElementById('rank').innerText = data.rank;
        if (document.getElementById('streakCount')) document.getElementById('streakCount').innerText = `${data.streak} Day`;

        // Update new premium components
        this.updateRankProgress(data.rank, data.xp);
    },

    updateActivity(activity) {
        const container = document.getElementById('activityList');
        if (!container) return;

        if (activity.length === 0) {
            container.innerHTML = `<p class="text-muted">${this.t('no_activity')}</p>`;
            return;
        }
        container.innerHTML = activity.map(item => `
            <div style="padding: 12px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between;">
                <span>${item.source}</span>
                <b style="color: ${item.type === 'earn' ? '#2ecc71' : '#e74c3c'}">
                    ${item.amount > 0 ? '+' : ''}${item.amount} 🟡
                </b>
            </div>
        `).join('');
    },

    async loadTests() {
        const container = document.getElementById('testList');
        if (!container) return;

        try {
            const tests = await api.get('/game/tests');
            if (tests && tests.length > 0) {
                container.innerHTML = tests.map(t => `
                    <div class="card" style="padding: 20px; background: white; margin-bottom: 12px; border-left: 5px solid var(--primary);">
                        <div style="display:flex; justify-content:space-between;">
                            <h4>${t.title}</h4>
                            <span class="coin-badge">${t.reward} 🟡</span>
                        </div>
                        <p style="font-size: 0.8rem; color: #666;">${this.t('teacher_prefix')}: ${t.teacher}</p>
                        <button class="btn btn-secondary" style="margin-top: 10px;" onclick="StudentModule.startTest(${t.id})">${this.t('start_test')}</button>
                    </div>
                `).join('');
            }
        } catch (e) { console.error("Load tests error:", e); }
    },

    async startTest(testId) {
        const score = prompt(this.t('enter_test_score'));
        if (score === null) return;
        const res = await api.post(`/game/tests/${testId}/submit`, { score: parseInt(score) });
        alert(res.msg);
        this.loadTests();
    },

    async loadMyClassInfo() {
        const container = document.getElementById('myClassContainer');
        if (!container) return; // Only if element exists (I will add it to dashboard HTML)

        try {
            const topics = await api.get('/student/my-group/topics');

            container.innerHTML = `
                <div class="card" style="background: linear-gradient(135deg, #6c5ce7, #a29bfe); color: white; padding: 24px; border-radius: var(--radius-lg);">
                    <h3>${this.t('my_group_topics_title')}</h3>
                    <p>${this.t('my_group_topics_desc')}</p>
                    <button class="btn" style="background: white; color: var(--primary); border: none; margin-top: 15px;" 
                        onclick="StudentModule.openTopicsModal()">${this.t('view_topics')}</button>
                </div>
            `;

            this._cachedTopics = topics;

        } catch (e) {
            container.innerHTML = `
                <div class="card" style="padding: 24px; border-radius: var(--radius-lg); border: 1px dashed #ccc; text-align: center;">
                    <p class="text-muted">${this.t('not_in_group')}</p>
                </div>
            `;
        }
    },

    openTopicsModal() {
        const topics = this._cachedTopics || [];

        const topicsList = topics.length ? topics.map(t => `
            <div style="border-bottom: 1px solid #eee; padding: 15px 0;">
                <h4 style="margin-bottom: 5px;">${t.title}</h4>
                <div style="font-size: 0.9rem; color: #555;">${t.content}</div>
                <div style="font-size: 0.75rem; color: #999; margin-top: 5px;">${t.date}</div>
            </div>
        `).join('') : `<p>${this.t('no_topics_yet')}</p>`;

        const modalHTML = `
            <div class="modal-overlay active">
                <div class="modal-box" style="width: 600px; max-width: 95%;">
                    <div class="modal-header">
                        <div class="modal-title">${this.t('group_topics_modal_title')}</div>
                        <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">×</button>
                    </div>
                    <div class="modal-body" style="max-height: 60vh; overflow-y: auto;">
                        ${topicsList}
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    },

    testNotification() {
        api.post('/student/test-notification', {})
            .then(res => console.log(res.msg))
            .catch(err => alert("Error: " + err.message));
    }
};  
