console.log('BusServ Authentication System Loaded');

// Toggle password visibility
function togglePassword(inputId) {
  const input = document.getElementById(inputId);
  const icon = event.target;
  if (input.type === 'password') {
    input.type = 'text';
    icon.classList.remove('fa-eye');
    icon.classList.add('fa-eye-slash');
  } else {
    input.type = 'password';
    icon.classList.remove('fa-eye-slash');
    icon.classList.add('fa-eye');
  }
}

// Email validation
function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

// Phone validation
function validatePhone(phone) {
  const re = /^[\d\s\-\+\(\)]{10,}$/;
  return re.test(phone.replace(/\s/g, ''));
}

// Password strength checker
function checkPasswordStrength(password) {
  let strength = 'Weak';
  if (password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password)) {
    strength = 'Strong';
  } else if (password.length >= 8) {
    strength = 'Medium';
  }
  return strength;
}

// show or hide dashboard section
function showDashboard(open = true) {
  const dash = document.getElementById('dashboardSection');
  const hero = document.querySelector('.hero');
  const services = document.getElementById('services');

  if (!dash) return;

  if (open) {
    // ensure user logged in
    const logged = localStorage.getItem('busservLoggedInUser');
    if (!logged) {
      window.location.href = 'login.html';
      return;
    }

    // hide hero & services, show dashboard
    if (hero) hero.style.display = 'none';
    if (services) services.style.display = 'none';
    dash.style.display = 'block';
    dash.scrollIntoView({ behavior: 'smooth' });
  } else {
    // hide dashboard and show home
    dash.style.display = 'none';
    if (hero) hero.style.display = 'block';
    if (services) services.style.display = 'block';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

// safe helpers and defensive guards + performance improvements
(function () {
  'use strict';

  // Helpers
  function $id(id) { return document.getElementById(id); }
  function qAll(sel) { return Array.from(document.querySelectorAll(sel)); }
  function safeJSON(str, fallback = {}) { try { return JSON.parse(str || '{}'); } catch(e){ return fallback; } }
  function hasLogged() { return !!localStorage.getItem('busservLoggedInUser'); }
  function getUser() { return safeJSON(localStorage.getItem('busservLoggedInUser')); }

  // Map role -> dashboard file (no generic 'user' dashboard)
  function getDashboardForRole(role) {
    const map = { admin: 'admin-dashboard.html', technician: 'technician-dashboard.html', driver: 'driver-dashboard.html' };
    return map[(role || '').toLowerCase()] || 'index.html';
  }

  // Navigation toggles (no fragile innerHTML)"
  function updateNavigation() {
    const logged = hasLogged();
    const navDashboardWrap = $id('navDashboardWrap');
    const navGreetingWrap = $id('navGreetingWrap');
    const navLogoutWrap = $id('navLogoutWrap');
    const navLogin = $id('navLogin');
    const navRegister = $id('navRegister');
    const heroDashboard = $id('heroDashboard');
    const heroLogin = $id('heroLogin');
    const heroRegister = $id('heroRegister');
    const navGreeting = $id('navGreeting');

    if (logged) {
      if (navDashboardWrap) navDashboardWrap.classList.remove('hidden');
      if (navGreetingWrap) navGreetingWrap.classList.remove('hidden');
      if (navLogoutWrap) navLogoutWrap.classList.remove('hidden');
      if (navLogin) navLogin.classList.add('hidden');
      if (navRegister) navRegister.classList.add('hidden');
      if (heroDashboard) heroDashboard.classList.remove('hidden');
      if (heroLogin) heroLogin.classList.add('hidden');
      if (heroRegister) heroRegister.classList.add('hidden');

      const user = getUser();
      if (navGreeting) {
        const name = (user.fullname || user.name || user.email || '').split(' ')[0] || 'User';
        navGreeting.textContent = `Hello, ${name}!`;
      }

      // ensure Dashboard link points to role-specific dashboard
      try {
        const dashHref = getDashboardForRole(user.role);
        const navDash = $id('navDashboard');
        if (navDash) navDash.setAttribute('href', dashHref);
        if (heroDashboard) heroDashboard.setAttribute('href', dashHref);
      } catch (e) {
        console.error('Error setting dashboard link for role', e);
      }
    } else {
      if (navDashboardWrap) navDashboardWrap.classList.add('hidden');
      if (navGreetingWrap) navGreetingWrap.classList.add('hidden');
      if (navLogoutWrap) navLogoutWrap.classList.add('hidden');
      if (navLogin) navLogin.classList.remove('hidden');
      if (navRegister) navRegister.classList.remove('hidden');
      if (heroDashboard) heroDashboard.classList.add('hidden');
      if (heroLogin) heroLogin.classList.remove('hidden');
      if (heroRegister) heroRegister.classList.remove('hidden');
    }
  }

  // Attach service handlers (navigate to dashboard.html or login)
  function attachServiceHandlers() {
    qAll('.service-card').forEach(c => {
      c.addEventListener('click', function () {
        const svc = c.dataset.service || '';
        if (hasLogged()) {
          const user = getUser();
          const roleDash = getDashboardForRole(user.role);
          window.location.href = roleDash + (svc ? `?service=${encodeURIComponent(svc)}` : '');
        } else {
          sessionStorage.setItem('openDashboard', '1');
          if (svc) sessionStorage.setItem('openService', svc);
          window.location.href = 'login.html';
        }
      }, { passive: true });
    });
  }

  // Logout
  function attachLogoutHandler() {
    const logout = $id('navLogout');
    if (!logout) return;
    logout.addEventListener('click', function (e) {
      e.preventDefault();
      localStorage.removeItem('busservLoggedInUser');
      localStorage.removeItem('busservRememberMe');
      sessionStorage.removeItem('openDashboard');
      sessionStorage.removeItem('openService');
      updateNavigation();
      window.location.href = 'index.html';
    });
  }

  // Registration handling
  (function initRegister() {
    const form = $id('registerForm');
    if (!form) return;
    const fullname = $id('fullname');
    const regrole = $id('regrole');
    const regemail = $id('regemail');
    const regphone = $id('regphone');
    const regpassword = $id('regpassword');
    const regconfirm = $id('regconfirm');
    const registerBtn = $id('registerBtn');
    const successEl = $id('registerSuccess');

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      // clear errors
      qAll('.error-msg').forEach(el => el.textContent = '');

      const fullnameVal = (fullname && fullname.value || '').trim();
      const roleVal = (regrole && regrole.value) || 'driver';
      const emailVal = (regemail && regemail.value || '').trim();
      const phoneVal = (regphone && regphone.value || '').trim();
      const passwordVal = (regpassword && regpassword.value) || '';
      const confirmVal = (regconfirm && regconfirm.value) || '';
      let isValid = true;

      if (!fullnameVal || fullnameVal.length < 3) { $id('fullnameError').textContent = 'Full name must be at least 3 characters'; isValid = false; }
      if (!emailVal || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal)) { $id('regemailError').textContent = 'Valid email required'; isValid = false; }
      if (!phoneVal || !/^[\d\s\-\+\(\)]{7,}$/.test(phoneVal)) { $id('regphoneError').textContent = 'Valid phone required'; isValid = false; }
      if (!passwordVal || passwordVal.length < 8) { $id('regpasswordError').textContent = 'Password must be at least 8 characters'; isValid = false; }
      if (passwordVal !== confirmVal) { $id('regconfirmError').textContent = 'Passwords do not match'; isValid = false; }

      const existingUsers = JSON.parse(localStorage.getItem('busservUsers') || '[]');
      if (existingUsers.some(u => u.email === emailVal)) { $id('regemailError').textContent = 'Email already registered'; isValid = false; }

      if (!isValid) return;

      const newUser = {
        id: Date.now(),
        fullname: fullnameVal,
        role: roleVal,
        email: emailVal,
        phone: phoneVal,
        password: btoa(passwordVal),
        createdAt: new Date().toISOString()
      };

      existingUsers.push(newUser);
      localStorage.setItem('busservUsers', JSON.stringify(existingUsers));

      if (successEl) {
        successEl.style.display = 'flex';
        registerBtn.disabled = true;
      }

      setTimeout(() => {
        window.location.href = 'login.html';
      }, 1200);
    });
  })();

  // Login handling
  (function initLogin() {
    const form = $id('loginForm');
    if (!form) return;
    const loginemail = $id('loginemail');
    const loginpassword = $id('loginpassword');
    const loginBtn = $id('loginBtn');

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      $id('loginemailError').textContent = '';
      $id('loginpasswordError').textContent = '';
      const emailVal = (loginemail && loginemail.value || '').trim();
      const passwordVal = (loginpassword && loginpassword.value) || '';

      if (!emailVal || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal)) { $id('loginemailError').textContent = 'Please enter a valid email address'; return; }
      const users = JSON.parse(localStorage.getItem('busservUsers') || '[]');
      const user = users.find(u => u.email === emailVal && u.password === btoa(passwordVal));
      if (user) {
        localStorage.setItem('busservLoggedInUser', JSON.stringify({
          id: user.id,
          fullname: user.fullname,
          email: user.email,
          phone: user.phone,
          role: user.role || 'driver'
        }));

        if ($id('remember') && $id('remember').checked) {
          localStorage.setItem('busservRememberMe', emailVal);
        } else {
          localStorage.removeItem('busservRememberMe');
        }

        $id('loginSuccess').style.display = 'flex';
        loginBtn.disabled = true;

        setTimeout(() => {
          const svc = sessionStorage.getItem('openService');

          // clear intent flags
          sessionStorage.removeItem('openDashboard');
          sessionStorage.removeItem('openService');

          // go to the user's dashboard
          const userObj = getUser();
          const roleDash = getDashboardForRole(userObj.role);
          const destination = roleDash + (svc ? `?service=${encodeURIComponent(svc)}` : '');

          if (!window.location.pathname.endsWith(roleDash)) {
            window.location.href = destination;
          }
        }, 900);
      } else {
        $id('loginError').textContent = '❌ Invalid email or password.';
        $id('loginError').style.display = 'block';
      }
    });

    // autofill remembered
    window.addEventListener('load', function() {
      const remembered = localStorage.getItem('busservRememberMe');
      if ($id('loginemail') && remembered) $id('loginemail').value = remembered;
    });
  })();

  // Google sign-in / sign-up
  (function initGoogle() {
    const googleSignIn = $id('googleSignIn');
    const googleSignUp = $id('googleSignUp');

    function doGoogleLogin(user) {
      localStorage.setItem('busservLoggedInUser', JSON.stringify(user));
      // go to role-specific dashboard
      const roleDash = getDashboardForRole(user.role);
      window.location.href = roleDash;
    }

    if (googleSignUp) {
      googleSignUp.addEventListener('click', function () {
        const googleUser = {
          id: Date.now(),
          fullname: 'Google User ' + Math.floor(Math.random() * 10000),
          email: 'googleuser' + Date.now() + '@gmail.com',
          phone: '+1 (000) 000-0000',
          provider: 'google',
          role: 'driver', // default role for Google sign-up
          createdAt: new Date().toISOString()
        };
        doGoogleLogin(googleUser);
      });
    }

    if (googleSignIn) {
      googleSignIn.addEventListener('click', function () {
        const googleUser = {
          id: Date.now(),
          fullname: 'Google User',
          email: 'googleuser@gmail.com',
          phone: '+1 (000) 000-0000',
          provider: 'google',
          role: 'driver' // default to driver for Google sign-in
        };
        doGoogleLogin(googleUser);
      });
    }
  })();

  // Forgot password handling (if on that page)
  (function initForgot() {
    const form = $id('forgotForm');
    if (!form) return;
    const emailEl = $id('forgotEmail');
    const info = $id('forgotInfo');
    const error = $id('forgotError');

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (info) info.style.display = 'none';
      if (error) error.style.display = 'none';
      const email = (emailEl && emailEl.value || '').trim();
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        if (error) { error.textContent = 'Please enter a valid email address'; error.style.display = 'block'; }
        return;
      }

      const users = JSON.parse(localStorage.getItem('busservUsers') || '[]');
      const user = users.find(u => u.email === email);
      if (user) {
        if (info) { info.textContent = 'If this email exists, a reset link has been sent (simulation).'; info.style.display = 'block'; }
        // simulate token + reset flow (no actual email)
      } else {
        if (error) { error.textContent = 'No account found with this email'; error.style.display = 'block'; }
      }
    });
  })();

  // Init on DOMContentLoaded
  document.addEventListener('DOMContentLoaded', function () {
    try {
      updateNavigation();
      attachServiceHandlers();
      attachLogoutHandler();

      const openFlag = sessionStorage.getItem('openDashboard') === '1';
      if (openFlag && window.location.pathname.endsWith('index.html')) {
        const svc = sessionStorage.getItem('openService') || '';
        // clear flags immediately to avoid loops
        sessionStorage.removeItem('openDashboard');
        sessionStorage.removeItem('openService');

        const userObj = getUser();
        const targetBase = getDashboardForRole(userObj.role);
        const target = targetBase + (svc ? `?service=${encodeURIComponent(svc)}` : '');
        // only navigate if not already on target
        if (!window.location.pathname.endsWith(targetBase)) {
          console.log('[busserv] Redirecting to', target);
          window.location.href = target;
        }
      }
    } catch (err) {
      console.error('Init error:', err);
    }
  });

  // expose for other pages (call after login/register if needed)
  window.busserv = window.busserv || {};
  window.busserv.updateNavigation = updateNavigation;

})(); 

// LOGOUT FUNCTION
function logout() {
  localStorage.removeItem('busservLoggedInUser');
  localStorage.removeItem('busservRememberMe');
  alert('You have been logged out successfully!');
  window.location.href = 'index.html';
}

// HIDE HERO SECTION AND SHOW DASHBOARD IF LOGGED IN
function updateDashboard() {
  const heroSection = document.querySelector('.hero');
  const aboutSection = document.querySelector('.about-section');
  const loggedInUser = localStorage.getItem('busservLoggedInUser');

  if (loggedInUser) {
    const user = JSON.parse(loggedInUser);
    
    // Hide hero section
    if (heroSection) {
      heroSection.style.display = 'none';
    }
    
    // Show dashboard in about section
    if (aboutSection) {
      aboutSection.innerHTML = `
        <div class="container">
          <div class="dashboard-container">
            <div class="dashboard-header">
              <h1>Welcome, ${user.fullname}!</h1>
              <p>You are successfully logged in to BusServ</p>
            </div>

            <div class="dashboard-content">
              <div class="about-content">
                <h2>About BusServ</h2>
                <p class="abstract-text">
                  BusServ is a web-based application designed to manage, monitor, and streamline bus maintenance and service operations by replacing traditional manual methods with a digital, efficient, and centralized platform.
                </p>
                <p class="abstract-text">
                  The system provides structured modules for fault reporting, service scheduling, technician assignment, and comprehensive maintenance history tracking to ensure buses remain in optimal working condition.
                </p>
              </div>

              <div class="dashboard-features">
                <h3>Key Features</h3>
                <div class="features-grid">
                  <div class="feature-card">
                    <i class="fas fa-tools"></i>
                    <h4>Maintenance Tracking</h4>
                    <p>Track all maintenance records and service history</p>
                  </div>
                  <div class="feature-card">
                    <i class="fas fa-calendar-alt"></i>
                    <h4>Service Scheduling</h4>
                    <p>Schedule preventive maintenance based on time or mileage</p>
                  </div>
                  <div class="feature-card">
                    <i class="fas fa-users"></i>
                    <h4>Technician Assignment</h4>
                    <p>Assign technicians to service tasks efficiently</p>
                  </div>
                  <div class="feature-card">
                    <i class="fas fa-exclamation-circle"></i>
                    <h4>Fault Reporting</h4>
                    <p>Instant reporting of mechanical and electrical issues</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
    }
  } else {
    // Show normal home page if not logged in
    if (heroSection) {
      heroSection.style.display = 'block';
    }
    if (aboutSection) {
      aboutSection.innerHTML = `
        <div class="container">
          <div class="about-content">
            <h2>About BusServ</h2>
            <p>
              BusServ is a web-based application designed to manage, monitor, and streamline bus maintenance and service operations. The primary objective of this system is to replace traditional manual maintenance methods with a digital, efficient, and centralized platform. BusServ ensures that transportation operators can maintain buses in optimal working condition by providing structured modules for fault reporting, service scheduling, technician assignment, and maintenance history.
            </p>
            <p>
              The system utilizes a simple and user-friendly frontend built with HTML, CSS, and JavaScript, enabling easy navigation and clear presentation of data. On the backend, PHP handles server-side processing and communication with the MySQL database, which stores all critical information such as bus details, service logs, repair records, spare parts usage, and technician information. This technology stack ensures reliability, scalability, and ease of deployment in academic or small-scale environments.
            </p>
            <p>
              BusServ allows drivers or staff to instantly report issues such as mechanical faults, electrical problems, or body damage. These reports are recorded in the database and displayed to the maintenance team for quick action. The system also supports preventive maintenance scheduling based on time intervals or mileage, helping reduce unexpected breakdowns and extending the lifespan of fleet vehicles. Every service or repair performed is logged, enabling administrators to track each bus's history, identify repeated failures, and make informed decisions.
            </p>
          </div>
        </div>
      `;
    }
  }
}

// REGISTRATION FORM
const registerForm = document.getElementById('registerForm');
if (registerForm) {
  const fullname = document.getElementById('fullname');
  const regrole = document.getElementById('regrole'); // <-- added
  const regemail = document.getElementById('regemail');
  const regphone = document.getElementById('regphone');
  const regpassword = document.getElementById('regpassword');
  const regconfirm = document.getElementById('regconfirm');
  const registerBtn = document.getElementById('registerBtn');

  // Real-time email validation
  regemail.addEventListener('blur', function() {
    if (validateEmail(this.value)) {
      document.getElementById('regemailError').textContent = '';
      document.getElementById('emailSuccess').textContent = '✓ Email looks good';
    } else if (this.value) {
      document.getElementById('regemailError').textContent = 'Please enter a valid email address';
    }
  });

  // Password strength indicator
  regpassword.addEventListener('input', function() {
    const strength = checkPasswordStrength(this.value);
    const strengthText = document.getElementById('strengthText');
    strengthText.textContent = strength;
    strengthText.style.color = strength === 'Strong' ? 'green' : strength === 'Medium' ? 'orange' : 'red';
  });

  // Form submission
  registerForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const fullnameVal = fullname.value.trim();
    const roleVal = regrole ? regrole.value : 'user'; // <-- capture role
    const emailVal = regemail.value.trim();
    const phoneVal = regphone.value.trim();
    const passwordVal = regpassword.value;
    const confirmVal = regconfirm.value;
    const termsChecked = document.getElementById('terms').checked;

    let isValid = true;

    // Clear previous errors
    document.getElementById('fullnameError').textContent = '';
    if (document.getElementById('regroleError')) document.getElementById('regroleError').textContent = '';
    document.getElementById('regemailError').textContent = '';
    document.getElementById('regphoneError').textContent = '';
    document.getElementById('regpasswordError').textContent = '';
    document.getElementById('regconfirmError').textContent = '';

    // Validate full name
    if (!fullnameVal || fullnameVal.length < 3) {
      document.getElementById('fullnameError').textContent = 'Full name must be at least 3 characters';
      isValid = false;
    }

    // Validate role (should always be present, but check)
    if (!roleVal) {
      if (document.getElementById('regroleError')) document.getElementById('regroleError').textContent = 'Please select a role';
      isValid = false;
    }

    // Validate email
    if (!validateEmail(emailVal)) {
      document.getElementById('regemailError').textContent = 'Please enter a valid email address';
      isValid = false;
    }

    // Check if email already exists
    const existingUsers = JSON.parse(localStorage.getItem('busservUsers') || '[]');
    if (existingUsers.some(u => u.email === emailVal)) {
      document.getElementById('regemailError').textContent = 'Email already registered. Try logging in.';
      isValid = false;
    }

    // Validate phone
    if (!validatePhone(phoneVal)) {
      document.getElementById('regphoneError').textContent = 'Please enter a valid phone number';
      isValid = false;
    }

    // Validate password
    if (passwordVal.length < 8) {
      document.getElementById('regpasswordError').textContent = 'Password must be at least 8 characters';
      isValid = false;
    }

    // Validate passwords match
    if (passwordVal !== confirmVal) {
      document.getElementById('regconfirmError').textContent = 'Passwords do not match';
      isValid = false;
    }

    // Validate terms
    if (!termsChecked) {
      alert('You must agree to the Terms & Conditions');
      isValid = false;
    }

    if (isValid) {
      // Save user
      const newUser = {
        id: Date.now(),
        fullname: fullnameVal,
        role: roleVal, // <-- store role
        email: emailVal,
        phone: phoneVal,
        password: btoa(passwordVal),
        createdAt: new Date().toISOString()
      };

      existingUsers.push(newUser);
      localStorage.setItem('busservUsers', JSON.stringify(existingUsers));

      // Show success message
      document.getElementById('registerSuccess').style.display = 'flex';
      registerBtn.disabled = true;

      setTimeout(() => {
        window.location.href = 'login.html';
      }, 2000);
    }
  });
}

// LOGIN FORM
const loginForm = document.getElementById('loginForm');
if (loginForm) {
  const loginemail = document.getElementById('loginemail');
  const loginpassword = document.getElementById('loginpassword');
  const loginBtn = document.getElementById('loginBtn');

  loginForm.addEventListener('submit', function(e) {
    e.preventDefault();

    const emailVal = loginemail.value.trim();
    const passwordVal = loginpassword.value;
    const rememberMe = document.getElementById('remember').checked;

    // Clear previous errors
    document.getElementById('loginemailError').textContent = '';
    document.getElementById('loginpasswordError').textContent = '';
    document.getElementById('loginError').style.display = 'none';

    let isValid = true;

    // Validate email
    if (!validateEmail(emailVal)) {
      document.getElementById('loginemailError').textContent = 'Please enter a valid email address';
      isValid = false;
    }

    if (!isValid) return;

    // Check credentials
    const users = JSON.parse(localStorage.getItem('busservUsers') || '[]');
    const user = users.find(u => u.email === emailVal && u.password === btoa(passwordVal));

    if (user) {
      // Login successful
      localStorage.setItem('busservLoggedInUser', JSON.stringify({
        id: user.id,
        fullname: user.fullname,
        email: user.email,
        phone: user.phone,
        role: user.role || 'driver'
      }));

      if (rememberMe) {
        localStorage.setItem('busservRememberMe', emailVal);
      }

      document.getElementById('loginSuccess').style.display = 'flex';
      loginBtn.disabled = true;

      setTimeout(() => {
        // honor intent to open dashboard
        const svc = sessionStorage.getItem('openService');

        // clear intent flags
        sessionStorage.removeItem('openDashboard');
        sessionStorage.removeItem('openService');

        // go to the user's dashboard
        const userObj = getUser();
        const roleDash = getDashboardForRole(userObj.role);
        const destination = roleDash + (svc ? `?service=${encodeURIComponent(svc)}` : '');

        if (!window.location.pathname.endsWith(roleDash)) {
          window.location.href = destination;
        }
      }, 1500);
    } else {
      document.getElementById('loginError').textContent = '❌ Invalid email or password. Please try again.';
      document.getElementById('loginError').style.display = 'block';
    }
  });

  // Auto-fill remembered email
  window.addEventListener('load', function() {
    const remembered = localStorage.getItem('busservRememberMe');
    if (remembered) {
      loginemail.value = remembered;
    }
  });
}

// GOOGLE SIGN-UP
const googleSignUp = document.getElementById('googleSignUp');
if (googleSignUp) {
  googleSignUp.addEventListener('click', function() {
    const googleUser = {
      id: Date.now(),
      fullname: 'Google User ' + Math.floor(Math.random() * 10000),
      email: 'googleuser' + Date.now() + '@gmail.com',
      phone: '+1 (000) 000-0000',
      provider: 'google',
      role: 'driver', // default role
      createdAt: new Date().toISOString()
    };

    localStorage.setItem('busservLoggedInUser', JSON.stringify(googleUser));
    // open role-specific dashboard directly for google sign-up
    (function(){ const roleDash = getDashboardForRole(googleUser.role); window.location.href = roleDash; })();
  });
}

// GOOGLE SIGN-IN
const googleSignIn = document.getElementById('googleSignIn');
if (googleSignIn) {
  googleSignIn.addEventListener('click', function() {
    const googleUser = {
      id: Date.now(),
      fullname: 'Google User',
      email: 'googleuser@gmail.com',
      phone: '+1 (000) 000-0000',
      provider: 'google',
      role: 'driver' // default role
    };

    localStorage.setItem('busservLoggedInUser', JSON.stringify(googleUser));
    // open role-specific dashboard directly for google sign-in
    (function(){ const roleDash = getDashboardForRole(googleUser.role); window.location.href = roleDash; })();
  });
}

// INITIALIZE ON PAGE LOAD
window.addEventListener('load', function() {
  updateNavigation();
  attachServiceHandlers();

  // If redirected to index after login with intent to open dashboard
  if (sessionStorage.getItem('openDashboard') === '1') {
    const svc = sessionStorage.getItem('openService') || '';
    sessionStorage.removeItem('openDashboard');
    sessionStorage.removeItem('openService');
    const userObj = getUser();
    const target = getDashboardForRole(userObj.role) + (svc ? `?service=${encodeURIComponent(svc)}` : '');
    if (!window.location.pathname.endsWith(getDashboardForRole(userObj.role))) {
      window.location.href = target;
    }
  }
});

// on page load: if intent to open dashboard, redirect once and clear flags
document.addEventListener('DOMContentLoaded', function () {
  try {
    updateNavigation();
    attachServiceHandlers();
    attachLogoutHandler();

    const openFlag = sessionStorage.getItem('openDashboard') === '1';
    if (openFlag && window.location.pathname.endsWith('index.html')) {
      const svc = sessionStorage.getItem('openService') || '';
      // clear flags immediately to avoid loops
      sessionStorage.removeItem('openDashboard');
      sessionStorage.removeItem('openService');

      const userObj = getUser();
      const targetBase = getDashboardForRole(userObj.role);
      const target = targetBase + (svc ? `?service=${encodeURIComponent(svc)}` : '');
      // only navigate if not already on target
      if (!window.location.pathname.endsWith(targetBase)) {
        console.log('[busserv] Redirecting to', target);
        window.location.href = target;
      }
    }
  } catch (err) {
    console.error('Init error:', err);
  }
});