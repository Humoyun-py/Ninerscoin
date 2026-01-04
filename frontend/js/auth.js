document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    const errorEl = document.getElementById('loginError');
    if (errorEl) errorEl.style.display = 'none';

    try {
        const response = await api.post('/auth/login', { username, password });

        if (response.access_token) {
            localStorage.setItem('token', response.access_token);
            localStorage.setItem('role', response.role);
            localStorage.setItem('user_name', response.full_name);

            // Redirect based on role
            window.location.href = `pages/${response.role}/dashboard.html`;
        }
    } catch (error) {
        console.error('Error logging in:', error);
        if (errorEl) {
            errorEl.innerText = error.message;
            errorEl.style.display = 'block';
        } else {
            alert(error.message);
        }
    }
});

function logout() {
    localStorage.clear();
    window.location.href = '../../login.html';
}

function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token && !window.location.pathname.includes('login.html') && !window.location.pathname.includes('register.html') && window.location.pathname !== '/') {
        window.location.href = '/login.html';
    }
}
