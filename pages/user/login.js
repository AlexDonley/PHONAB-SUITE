import { supabase } from '../../js_modules/supabase-crud.js'

const form = document.getElementById('login-form');
const message = document.getElementById('message');

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    message.textContent = 'Logging in…';

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error) {
        message.textContent = error.message;
        return;
    }

    message.textContent = 'Login successful! Here is the data: ' + data;

    // Redirect to a protected page
    // window.location.href = '/dashboard.html';
});

document.getElementById('logout').addEventListener('click', async () => {
    await supabase.auth.signOut();

    message.textContent = 'Logged out.'
    //window.location.href = '/login.html';
});