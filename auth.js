(function () {
  'use strict';

  var TOKEN_KEY = 'google_auth_token';
  var USER_KEY = 'google_user';
  var REFERRER_KEY = 'sprocket_map_referrer';
  // Auth gateway lives on db01 (wgapi service). willgibson.com is a static
  // portal SPA whose /api/me returns a hardcoded 2-scope stub for
  // ALLOWED_DOMAINS — that loses scopes like 'fiber-map' / 'admin' that
  // live in the authorized_users table on db01. Point at the real gateway.
  // When sprocketnetworks.net DNS is fixed, migrate to that origin instead.
  var API_BASE = 'https://db01.tailfca0e2.ts.net';
  var GOOGLE_CLIENT_ID = '432178814016-q4hdj3rncd53n4tklia21g7b66k872t2.apps.googleusercontent.com';
  var GATE_ID = 'sprocket-auth-gate';
  var HOME_BAR_ID = 'sprocket-home-bar';

  // Hide page immediately while auth resolves — prevents map flash
  var rootStyle = document.documentElement.style;
  rootStyle.visibility = 'hidden';
  rootStyle.overflow = 'hidden';

  // Read token and referrer passed from willgibson.com via URL hash
  (function readHashToken() {
    var hash = window.location.hash;
    if (!hash || hash.indexOf('token=') === -1) return;
    try {
      var params = new URLSearchParams(hash.slice(1));
      var token = params.get('token');
      var ref = params.get('ref');
      if (token) {
        localStorage.setItem(TOKEN_KEY, token);
        if (ref) localStorage.setItem(REFERRER_KEY, ref);
        history.replaceState(null, '', window.location.pathname + window.location.search);
      }
    } catch (e) { /* best-effort */ }
  })();

  // Home bar removed — sprocketnetworks.net will replace willgibson.com soon.
  function injectHomeBar() { /* no-op */ }

  // App-specific scope. Admins bypass.
  var REQUIRED_SCOPE = 'fiber-map';
  function hasAccess(user) {
    if (!user || !Array.isArray(user.scopes)) return false;
    return user.scopes.indexOf(REQUIRED_SCOPE) !== -1 || user.scopes.indexOf('admin') !== -1;
  }

  function validateToken(token) {
    return fetch(API_BASE + '/api/me', {
      headers: { Authorization: 'Bearer ' + token },
    }).then(function (res) {
      if (!res.ok) return null;
      return res.json();
    }).catch(function () { return null; });
  }

  function showPage() {
    rootStyle.visibility = '';
    rootStyle.overflow = '';
    var gate = document.getElementById(GATE_ID);
    if (gate) gate.remove();
    if (!document.getElementById(HOME_BAR_ID)) injectHomeBar();
  }

  function showGate() {
    rootStyle.visibility = '';
    rootStyle.overflow = '';
    var gate = document.getElementById(GATE_ID);
    if (gate) gate.style.display = 'flex';
  }

  function setError(msg) {
    var el = document.getElementById('sprocket-auth-error');
    if (el) el.textContent = msg;
  }

  // Called by Google GSI after the user signs in
  window.sprocketHandleSignIn = function (response) {
    var credential = response.credential;
    setError('');
    var area = document.getElementById('sprocket-signin-area');
    if (area) area.innerHTML = '<p style="color:#94a3b8;font-size:13px;margin:0">Verifying…</p>';

    validateToken(credential).then(function (user) {
      if (user && hasAccess(user)) {
        localStorage.setItem(TOKEN_KEY, credential);
        localStorage.setItem(USER_KEY, JSON.stringify(user));
        showPage();
      } else {
        setError(user
          ? 'Your account does not have access to the Fiber Map. Ask an admin to grant the "fiber-map" scope.'
          : 'Your account is not authorized to access this app.');
        if (area) {
          area.innerHTML = buildSigninHTML();
          // Re-render the GSI button if the library is loaded
          if (window.google && window.google.accounts && window.google.accounts.id) {
            var btn = area.querySelector('.g_id_signin');
            if (btn) window.google.accounts.id.renderButton(btn, { theme: 'outline', size: 'large' });
          }
        }
      }
    });
  };

  function buildSigninHTML() {
    return '<div id="g_id_onload"' +
      ' data-client_id="' + GOOGLE_CLIENT_ID + '"' +
      ' data-callback="sprocketHandleSignIn"' +
      ' data-auto_select="false"></div>' +
      '<div class="g_id_signin"' +
      ' data-type="standard"' +
      ' data-size="large"' +
      ' data-theme="outline"' +
      ' data-text="signin_with"' +
      ' data-shape="rectangular"></div>';
  }

  function injectGate() {
    var gate = document.createElement('div');
    gate.id = GATE_ID;
    gate.setAttribute('style', [
      'position:fixed', 'top:0', 'left:0', 'right:0', 'bottom:0',
      'z-index:99999', 'background:#0f172a',
      'display:none', 'align-items:center', 'justify-content:center',
      'font-family:system-ui,-apple-system,sans-serif',
    ].join(';'));
    gate.innerHTML =
      '<div style="background:#1e293b;border:1px solid rgba(255,255,255,0.08);border-radius:16px;' +
      'padding:40px 48px;text-align:center;width:100%;max-width:380px;' +
      'box-shadow:0 25px 50px rgba(0,0,0,0.5)">' +
        '<div style="width:52px;height:52px;border-radius:12px;background:#0f172a;' +
        'display:flex;align-items:center;justify-content:center;margin:0 auto 20px;' +
        'border:1px solid rgba(255,255,255,0.1)">' +
          '<span style="color:white;font-size:18px;font-weight:700;letter-spacing:-0.5px">WG</span>' +
        '</div>' +
        '<h1 style="color:white;font-size:20px;font-weight:700;margin:0 0 6px;letter-spacing:-0.3px">' +
          'Sprocket Networks</h1>' +
        '<p style="color:#64748b;font-size:13px;margin:0 0 28px">Fiber Map — sign in to continue</p>' +
        '<div style="border-top:1px solid rgba(255,255,255,0.06);padding-top:24px">' +
          '<p id="sprocket-auth-error" style="color:#f87171;font-size:12px;margin:0 0 14px;min-height:16px"></p>' +
          '<div id="sprocket-signin-area" style="display:flex;justify-content:center">' +
            '<div id="g_id_onload"' +
              ' data-client_id="' + GOOGLE_CLIENT_ID + '"' +
              ' data-callback="sprocketHandleSignIn"' +
              ' data-auto_select="false"></div>' +
            '<div class="g_id_signin"' +
              ' data-type="standard"' +
              ' data-size="large"' +
              ' data-theme="outline"' +
              ' data-text="signin_with"' +
              ' data-shape="rectangular"></div>' +
          '</div>' +
        '</div>' +
        '<p style="color:#334155;font-size:11px;margin:20px 0 0">Access is restricted to authorized accounts.</p>' +
      '</div>';

    document.body.insertBefore(gate, document.body.firstChild);
  }

  function initAuth() {
    injectGate();

    var storedToken = localStorage.getItem(TOKEN_KEY);
    if (storedToken) {
      validateToken(storedToken).then(function (user) {
        if (user && hasAccess(user)) {
          localStorage.setItem(USER_KEY, JSON.stringify(user));
          showPage();
        } else {
          // Either token invalid or user lacks fiber-map scope.
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(USER_KEY);
          if (user) setError('Your account does not have access to the Fiber Map. Ask an admin to grant the "fiber-map" scope.');
          showGate();
        }
      });
    } else {
      showGate();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAuth);
  } else {
    initAuth();
  }
})();
