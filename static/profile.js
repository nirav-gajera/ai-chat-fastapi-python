// ── Profile Screen Actions ────────────────────────────────────

function openProfile(updateHash = true) {
  if (!user) return;
  
  // Fill values
  document.getElementById('profile-name').value = user.name;
  document.getElementById('profile-email').value = user.email;
  
  // Reset password fields
  document.getElementById('profile-current-pass').value = '';
  document.getElementById('profile-new-pass').value = '';
  document.getElementById('profile-confirm-pass').value = '';
  
  // Clear notices
  clearNotices();
  
  // Toggle visibility
  document.getElementById('chat-area').style.display = 'none';
  document.getElementById('profile-area').style.display = 'flex';
  
  // Update hash
  if (updateHash) {
    window.location.hash = '/profile';
  }
  
  // Close mobile sidebar if open
  if (typeof closeSidebar === 'function') {
    closeSidebar();
  }
}

function closeProfile() {
  document.getElementById('profile-area').style.display = 'none';
  document.getElementById('chat-area').style.display = 'flex';
  
  // Restore routing hash
  if (activeConvId) {
    window.location.hash = `/c/${activeConvId}`;
  } else {
    window.location.hash = '/new';
  }
}

function clearNotices() {
  ['profile-details-err', 'profile-details-success', 'profile-password-err', 'profile-password-success'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      const txt = el.querySelector('.notice-text');
      if (txt) txt.textContent = '';
      el.style.display = 'none';
    }
  });
}

function showNotice(id, msg) {
  const el = document.getElementById(id);
  if (el) {
    const txt = el.querySelector('.notice-text');
    if (txt) txt.textContent = msg;
    el.style.display = 'flex';
  }
}

// ── Profile Updates ───────────────────────────────────────────

async function saveProfileDetails() {
  clearNotices();
  
  const nameInput = document.getElementById('profile-name');
  const emailInput = document.getElementById('profile-email');
  const btn = document.getElementById('btn-save-details');
  
  const name = nameInput.value.trim();
  const email = emailInput.value.trim();
  
  // Front-end validations
  if (!name) {
    showNotice('profile-details-err', 'Name is required.');
    return;
  }
  if (name.length < 2) {
    showNotice('profile-details-err', 'Name must be at least 2 characters.');
    return;
  }
  if (!email) {
    showNotice('profile-details-err', 'Email is required.');
    return;
  }
  if (!/^[^@]+@[^@]+\.[^@]+$/.test(email)) {
    showNotice('profile-details-err', 'Enter a valid email address.');
    return;
  }
  
  btn.disabled = true;
  btn.textContent = 'Saving…';
  
  try {
    const res = await authFetch('/auth/profile', 'PUT', { name, email });
    const data = await res.json();
    
    if (!res.ok) {
      showNotice('profile-details-err', parseErr(data));
      return;
    }
    
    // Update local state
    user.name = data.name;
    user.email = data.email;
    localStorage.setItem('user', JSON.stringify(user));
    
    // Update sidebar UI indicators
    document.getElementById('user-name-display').textContent = user.name;
    document.getElementById('user-email-display').textContent = user.email;
    document.getElementById('user-initial').textContent = user.name[0].toUpperCase();
    
    showNotice('profile-details-success', 'Profile details updated successfully!');
  } catch (err) {
    showNotice('profile-details-err', 'Network error. Failed to save changes.');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Save Changes';
  }
}

async function saveProfilePassword() {
  clearNotices();
  
  const currentPassInput = document.getElementById('profile-current-pass');
  const newPassInput = document.getElementById('profile-new-pass');
  const confirmPassInput = document.getElementById('profile-confirm-pass');
  const btn = document.getElementById('btn-save-password');
  
  const current_password = currentPassInput.value;
  const new_password = newPassInput.value;
  const confirm_password = confirmPassInput.value;
  
  // Front-end validations
  if (!current_password) {
    showNotice('profile-password-err', 'Current password is required.');
    return;
  }
  if (!new_password) {
    showNotice('profile-password-err', 'New password is required.');
    return;
  }
  if (new_password.length < 6) {
    showNotice('profile-password-err', 'New password must be at least 6 characters.');
    return;
  }
  if (new_password !== confirm_password) {
    showNotice('profile-password-err', 'Confirm password does not match new password.');
    return;
  }
  
  btn.disabled = true;
  btn.textContent = 'Updating Password…';
  
  try {
    const res = await authFetch('/auth/password', 'PUT', { current_password, new_password });
    const data = await res.json();
    
    if (!res.ok) {
      showNotice('profile-password-err', parseErr(data));
      return;
    }
    
    // Clear inputs on success
    currentPassInput.value = '';
    newPassInput.value = '';
    confirmPassInput.value = '';
    
    showNotice('profile-password-success', 'Password updated successfully!');
  } catch (err) {
    showNotice('profile-password-err', 'Network error. Failed to update password.');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Update Password';
  }
}
