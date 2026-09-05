import { supabase } from '../../js_modules/supabase-crud.js'

const usernameEntry     = document.querySelector('#usernameEntry');
const passwordEntry     = document.querySelector('#passwordEntry');

const form = document.getElementById('signup-form');
const message = document.getElementById('message');

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  message.textContent = 'Creating account…';

  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    message.textContent = error.message;
    return;
  }

  // At this point:
  // - User is created in auth.users
  // - Your trigger inserts into public.profiles
  // - role defaults to 'user'

  if (data.user && !data.session) {
    message.textContent =
      'Account created! Please check your email to confirm your account.';
  } else {
    message.textContent = 'Account created and logged in!';
  }
});