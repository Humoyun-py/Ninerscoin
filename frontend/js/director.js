const DirectorModule = {
    async initDashboard() {
        try {
            const data = await api.get('/director/analytics');
            if (data) {
                this.renderTopTeachers(data.top_teachers);
            }
        } catch (e) {
            console.error("Director analytics load error:", e);
        }
    },

    renderTopTeachers(teachers) {
        const container = document.getElementById('topTeachers');
        if (!container) return;

        if (!teachers || teachers.length === 0) {
            container.innerHTML = '<p class="text-muted">Ma\'lumot topilmadi.</p>';
            return;
        }

        container.innerHTML = teachers.map(t => `
            <div style="display:flex; justify-content:space-between; padding:12px; border-bottom:1px solid var(--border-light);">
                <span style="font-weight:600;">${t.name} <span style="font-weight:400; color:var(--text-muted);">(${t.subject})</span></span>
                <span style="color:#F1C40F; font-weight:700;">★ ${t.rating}</span>
            </div>
        `).join('');
    }
};

window.DirectorModule = DirectorModule;
