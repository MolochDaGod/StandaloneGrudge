/**
 * GRUDGE STUDIO SDK v1.0
 * Integration script for grudgewarlords.com
 *
 * Copy and paste this entire script into a <script> tag on
 * https://grudgewarlords.com/dungeon (or any page) to connect
 * with the Grudge Warlords RPG backend.
 *
 * USAGE:
 *   <script src="https://YOUR_DEPLOYED_URL/grudge-studio-sdk.js"></script>
 *   -- OR --
 *   Copy everything below into a <script> tag directly.
 *
 * Then use window.GrudgeStudio in your code.
 */
(function (global) {
  'use strict';

  var API_BASE = 'https://grudgewarlords.com';

  var SESSION_KEY = 'grudge_studio_session';
  var USER_KEY = 'grudge_studio_user';

  function getStoredSession() {
    try {
      return localStorage.getItem(SESSION_KEY) || null;
    } catch (e) {
      return null;
    }
  }

  function storeSession(token, user) {
    try {
      localStorage.setItem(SESSION_KEY, token);
      if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
    } catch (e) {}
  }

  function clearSession() {
    try {
      localStorage.removeItem(SESSION_KEY);
      localStorage.removeItem(USER_KEY);
    } catch (e) {}
  }

  function getStoredUser() {
    try {
      var raw = localStorage.getItem(USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function apiRequest(method, path, body, sessionToken) {
    var url = API_BASE + path;
    var headers = { 'Content-Type': 'application/json' };
    if (sessionToken) {
      headers['X-Session-Token'] = sessionToken;
    }
    var opts = { method: method, headers: headers, mode: 'cors' };
    if (body && method !== 'GET') {
      opts.body = JSON.stringify(body);
    }
    return fetch(url, opts).then(function (res) {
      if (!res.ok) {
        return res.json().then(function (err) {
          throw new Error(err.error || 'Request failed: ' + res.status);
        });
      }
      return res.json();
    });
  }


  var GrudgeStudio = {

    version: '1.0.0',
    apiBase: API_BASE,
    _sessionToken: getStoredSession(),
    _user: getStoredUser(),
    _listeners: {},

    /**
     * Configure the SDK (call before other methods if needed)
     * @param {Object} opts - { apiBase: 'https://...' }
     */
    configure: function (opts) {
      if (opts.apiBase) {
        API_BASE = opts.apiBase;
        GrudgeStudio.apiBase = opts.apiBase;
      }
    },

    /**
     * Start Discord OAuth login flow.
     * Opens a popup that redirects through our server to Discord.
     * The server handles the entire OAuth exchange and posts the
     * session token back via postMessage when complete.
     */
    login: function () {
      var self = this;
      var returnUrl = window.location.href;
      var loginUrl = API_BASE + '/api/external/login?returnUrl=' + encodeURIComponent(returnUrl);

      return new Promise(function (resolve, reject) {
        var popup = window.open(loginUrl, 'grudge_discord_login',
          'width=500,height=700,scrollbars=yes');

        if (!popup) {
          reject(new Error('Popup blocked. Please allow popups for this site.'));
          return;
        }

        function onMessage(event) {
          if (!event.data || event.data.type !== 'grudge_login') return;
          var apiOrigin;
          try { apiOrigin = new URL(API_BASE).origin; } catch(e) { return; }
          if (event.origin !== apiOrigin) return;
          window.removeEventListener('message', onMessage);
          clearInterval(closedCheck);

          var data = event.data.data;
          if (data && data.sessionToken) {
            self._sessionToken = data.sessionToken;
            self._user = data.user;
            storeSession(data.sessionToken, data.user);
            self._emit('login', self._user);
            resolve(self._user);
          } else {
            reject(new Error('Login failed'));
          }
        }

        window.addEventListener('message', onMessage);

        var closedCheck = setInterval(function () {
          if (popup.closed) {
            clearInterval(closedCheck);
            window.removeEventListener('message', onMessage);
            var token = getStoredSession();
            var user = getStoredUser();
            if (token && !self._sessionToken) {
              self._sessionToken = token;
              self._user = user;
              self._emit('login', self._user);
              resolve(self._user);
            } else if (!self._sessionToken) {
              reject(new Error('Login window was closed'));
            }
          }
        }, 500);

        setTimeout(function () {
          clearInterval(closedCheck);
          window.removeEventListener('message', onMessage);
          if (popup && !popup.closed) popup.close();
          if (!self._sessionToken) reject(new Error('Login timed out'));
        }, 120000);
      });
    },

    /**
     * Logout - clears stored session
     */
    logout: function () {
      this._sessionToken = null;
      this._user = null;
      clearSession();
      this._emit('logout');
    },

    /**
     * Check if user is logged in
     * @returns {boolean}
     */
    isLoggedIn: function () {
      return !!this._sessionToken;
    },

    /**
     * Get the current user info (from cache)
     * @returns {Object|null}
     */
    getUser: function () {
      return this._user;
    },

    /**
     * Verify the current session is still valid with the server
     * @returns {Promise<Object>}
     */
    verifySession: function () {
      var self = this;
      if (!this._sessionToken) {
        return Promise.reject(new Error('Not logged in'));
      }
      return apiRequest('POST', '/api/auth/verify', {
        sessionToken: this._sessionToken
      }).then(function (result) {
        if (result.valid) {
          self._user = {
            discordId: result.discordId,
            username: result.username
          };
          storeSession(self._sessionToken, self._user);
          return result;
        }
        self.logout();
        throw new Error('Session invalid');
      }).catch(function (err) {
        self.logout();
        throw err;
      });
    },


    /**
     * Get the player's full profile (account + heroes)
     * @returns {Promise<Object>}
     */
    getProfile: function () {
      if (!this._sessionToken) {
        return Promise.reject(new Error('Not logged in'));
      }
      return apiRequest('GET', '/api/public/profile', null, this._sessionToken);
    },

    /**
     * Get full game data sync (account, heroes with inventory, island)
     * @returns {Promise<Object>}
     */
    syncGameData: function () {
      if (!this._sessionToken) {
        return Promise.reject(new Error('Not logged in'));
      }
      return apiRequest('POST', '/api/public/sync', {}, this._sessionToken);
    },

    /**
     * Get the arena leaderboard (public, no auth needed)
     * @returns {Promise<Object>}
     */
    getLeaderboard: function () {
      return apiRequest('GET', '/api/public/leaderboard');
    },

    /**
     * Get server stats (public, no auth needed)
     * @returns {Promise<Object>}
     */
    getStats: function () {
      return apiRequest('GET', '/api/public/stats');
    },

    /**
     * Check server health
     * @returns {Promise<Object>}
     */
    healthCheck: function () {
      return apiRequest('GET', '/api/health');
    },

    /**
     * Get Discord invite link
     * @returns {string}
     */
    getDiscordInvite: function () {
      return 'https://discord.gg/KmAC5aXs84';
    },


    /**
     * Register an event listener
     * @param {string} event - 'login', 'logout', 'sync', 'error'
     * @param {Function} callback
     */
    on: function (event, callback) {
      if (!this._listeners[event]) this._listeners[event] = [];
      this._listeners[event].push(callback);
    },

    /**
     * Remove an event listener
     * @param {string} event
     * @param {Function} callback
     */
    off: function (event, callback) {
      if (!this._listeners[event]) return;
      this._listeners[event] = this._listeners[event].filter(function (cb) {
        return cb !== callback;
      });
    },

    _emit: function (event, data) {
      var cbs = this._listeners[event];
      if (cbs) {
        cbs.forEach(function (cb) {
          try { cb(data); } catch (e) { console.error('[GrudgeStudio] Event error:', e); }
        });
      }
    },


    /**
     * Embed the Grudge Warlords game in an iframe
     * @param {string|HTMLElement} container - CSS selector or DOM element
     * @param {Object} opts - { width, height, path }
     */
    embed: function (container, opts) {
      opts = opts || {};
      var el = typeof container === 'string'
        ? document.querySelector(container)
        : container;
      if (!el) throw new Error('Container not found: ' + container);

      var iframe = document.createElement('iframe');
      iframe.src = API_BASE.replace('/api', '') + (opts.path || '/');
      iframe.style.width = opts.width || '100%';
      iframe.style.height = opts.height || '600px';
      iframe.style.border = 'none';
      iframe.style.borderRadius = '8px';
      iframe.allow = 'autoplay; fullscreen';
      iframe.id = 'grudge-studio-frame';
      el.innerHTML = '';
      el.appendChild(iframe);
      return iframe;
    },

    /**
     * Render a quick stats widget into a container
     * @param {string|HTMLElement} container
     */
    renderStatsWidget: function (container) {
      var el = typeof container === 'string'
        ? document.querySelector(container)
        : container;
      if (!el) return;

      el.innerHTML = '<div style="padding:16px;background:#1a1a2e;border:1px solid #e94560;border-radius:8px;color:#eee;font-family:sans-serif;text-align:center;">Loading Grudge Stats...</div>';

      this.getStats().then(function (stats) {
        el.innerHTML = [
          '<div style="padding:16px;background:#1a1a2e;border:1px solid #e94560;border-radius:8px;color:#eee;font-family:sans-serif;">',
          '<h3 style="margin:0 0 12px;color:#e94560;font-size:18px;">Grudge Warlords</h3>',
          '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">',
          '<div style="background:#16213e;padding:8px;border-radius:4px;"><div style="font-size:20px;color:#e94560;">' + stats.totalPlayers + '</div><div style="font-size:11px;opacity:0.7;">Players</div></div>',
          '<div style="background:#16213e;padding:8px;border-radius:4px;"><div style="font-size:20px;color:#e94560;">' + stats.totalHeroes + '</div><div style="font-size:11px;opacity:0.7;">Heroes</div></div>',
          '<div style="background:#16213e;padding:8px;border-radius:4px;"><div style="font-size:20px;color:#e94560;">' + stats.arenaTeams + '</div><div style="font-size:11px;opacity:0.7;">Arena Teams</div></div>',
          '<div style="background:#16213e;padding:8px;border-radius:4px;"><div style="font-size:20px;color:#e94560;">' + stats.arenaBattles + '</div><div style="font-size:11px;opacity:0.7;">Battles</div></div>',
          '</div></div>'
        ].join('');
      }).catch(function () {
        el.innerHTML = '<div style="padding:16px;background:#1a1a2e;border:1px solid #e94560;border-radius:8px;color:#e94560;">Failed to load stats</div>';
      });
    },

    /**
     * Render a leaderboard widget
     * @param {string|HTMLElement} container
     * @param {Object} opts - { limit: 10 }
     */
    renderLeaderboard: function (container, opts) {
      opts = opts || {};
      var limit = opts.limit || 10;
      var el = typeof container === 'string'
        ? document.querySelector(container)
        : container;
      if (!el) return;

      el.innerHTML = '<div style="padding:16px;background:#1a1a2e;border:1px solid #e94560;border-radius:8px;color:#eee;">Loading leaderboard...</div>';

      this.getLeaderboard().then(function (data) {
        var rows = (data.leaderboard || []).slice(0, limit).map(function (entry, i) {
          var medal = i === 0 ? '&#x1F947;' : i === 1 ? '&#x1F948;' : i === 2 ? '&#x1F949;' : '#' + (i + 1);
          return '<tr style="border-bottom:1px solid #333;">' +
            '<td style="padding:6px 8px;">' + medal + '</td>' +
            '<td style="padding:6px 8px;">' + entry.ownerName + '</td>' +
            '<td style="padding:6px 8px;text-align:center;">' + entry.wins + 'W / ' + entry.losses + 'L</td>' +
            '<td style="padding:6px 8px;text-align:center;">' + entry.rank + '</td></tr>';
        }).join('');

        el.innerHTML = [
          '<div style="padding:16px;background:#1a1a2e;border:1px solid #e94560;border-radius:8px;color:#eee;font-family:sans-serif;">',
          '<h3 style="margin:0 0 12px;color:#e94560;">GRUDA Arena Leaderboard</h3>',
          '<table style="width:100%;border-collapse:collapse;font-size:13px;">',
          '<thead><tr style="border-bottom:2px solid #e94560;"><th style="padding:6px 8px;text-align:left;"></th><th style="padding:6px 8px;text-align:left;">Warlord</th><th style="padding:6px 8px;text-align:center;">Record</th><th style="padding:6px 8px;text-align:center;">Rank</th></tr></thead>',
          '<tbody>' + (rows || '<tr><td colspan="4" style="padding:12px;text-align:center;opacity:0.5;">No arena data yet</td></tr>') + '</tbody>',
          '</table></div>'
        ].join('');
      }).catch(function () {
        el.innerHTML = '<div style="padding:16px;background:#1a1a2e;border:1px solid #e94560;border-radius:8px;color:#e94560;">Failed to load leaderboard</div>';
      });
    },

    /**
     * Render a login button
     * @param {string|HTMLElement} container
     * @param {Object} opts - { onLogin, onError, buttonText }
     */
    renderLoginButton: function (container, opts) {
      opts = opts || {};
      var self = this;
      var el = typeof container === 'string'
        ? document.querySelector(container)
        : container;
      if (!el) return;

      function render() {
        if (self.isLoggedIn() && self._user) {
          el.innerHTML = [
            '<div style="display:flex;align-items:center;gap:10px;padding:10px 16px;background:#1a1a2e;border:1px solid #e94560;border-radius:8px;color:#eee;font-family:sans-serif;">',
            '<span style="color:#e94560;font-weight:bold;">' + self._user.username + '</span>',
            '<button id="grudge-logout-btn" style="padding:4px 12px;background:#e94560;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:12px;">Logout</button>',
            '</div>'
          ].join('');
          document.getElementById('grudge-logout-btn').onclick = function () {
            self.logout();
            render();
          };
        } else {
          el.innerHTML = [
            '<button id="grudge-login-btn" style="padding:10px 20px;background:#5865F2;color:#fff;border:none;border-radius:8px;cursor:pointer;font-family:sans-serif;font-size:14px;font-weight:bold;display:flex;align-items:center;gap:8px;">',
            '<svg width="20" height="15" viewBox="0 0 71 55" fill="white"><path d="M60.1 4.9A58.5 58.5 0 0 0 45.4.2a.2.2 0 0 0-.2.1 40.8 40.8 0 0 0-1.8 3.7 54 54 0 0 0-16.2 0A37.4 37.4 0 0 0 25.4.3a.2.2 0 0 0-.2-.1A58.4 58.4 0 0 0 10.5 5a.2.2 0 0 0-.1.1C1.5 18.7-.9 32 .3 45.1v.1a58.8 58.8 0 0 0 17.9 9 .2.2 0 0 0 .3-.1 42 42 0 0 0 3.6-5.9.2.2 0 0 0-.1-.3 38.8 38.8 0 0 1-5.5-2.6.2.2 0 0 1 0-.4l1.1-.9a.2.2 0 0 1 .2 0 42 42 0 0 0 35.6 0 .2.2 0 0 1 .2 0l1.1.9a.2.2 0 0 1 0 .3 36.4 36.4 0 0 1-5.5 2.7.2.2 0 0 0-.1.3 47.2 47.2 0 0 0 3.6 5.8.2.2 0 0 0 .3.1A58.6 58.6 0 0 0 71 45.2v-.1C72.4 30.1 68.4 17 60.2 5a.2.2 0 0 0-.1 0zM23.7 37a6.8 6.8 0 0 1-6.3-7 6.7 6.7 0 0 1 6.3-7c3.4 0 6.3 3.1 6.2 7a6.7 6.7 0 0 1-6.2 7zm23.2 0a6.8 6.8 0 0 1-6.3-7 6.7 6.7 0 0 1 6.3-7c3.4 0 6.4 3.1 6.3 7a6.8 6.8 0 0 1-6.3 7z"/></svg>',
            (opts.buttonText || 'Sign in with Discord'),
            '</button>'
          ].join('');
          document.getElementById('grudge-login-btn').onclick = function () {
            self.login().then(function (user) {
              render();
              if (opts.onLogin) opts.onLogin(user);
            }).catch(function (err) {
              if (opts.onError) opts.onError(err);
            });
          };
        }
      }

      render();
      self.on('login', render);
      self.on('logout', render);
    }
  };

  if (GrudgeStudio._sessionToken) {
    GrudgeStudio.verifySession().catch(function () {});
  }

  global.GrudgeStudio = GrudgeStudio;

  console.log('%c[GrudgeStudio SDK v1.0] Loaded', 'color: #e94560; font-weight: bold;');

})(typeof window !== 'undefined' ? window : this);
