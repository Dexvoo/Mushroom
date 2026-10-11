// Ovx dashboard front-end: routing, account bar and start-up.
// Pages live in picker.js (server picker) and serverPage.js (sidebar + sections).
import { el, api } from './ui.js';
import { confirmLeave } from './forms.js';
import { renderPicker, renderPickerSkeleton } from './picker.js';
import { renderServerPage, clearServerCache } from './serverPage.js';

const app = document.getElementById('app');
const banner = document.getElementById('banner');

const LOGIN_MESSAGES = {
    cancelled: 'Login was cancelled.',
    expired: 'That login link expired. Please try again.',
    failed: 'Discord login failed. Please try again.',
};

/** @type {{ user: any, guilds: any[] } | null} */
let me = null;
/** Cleanup for the section currently shown (stops its unsaved-changes guard) */
let cleanup = () => {};
let currentPath = location.pathname;

// ---------- Navigation ----------

function navigate(path) {
    if (path === location.pathname) return;
    if (!confirmLeave()) return;
    history.pushState(null, '', path);
    render();
}

document.addEventListener('click', (event) => {
    const link = /** @type {Element} */ (event.target).closest('a[data-link]');
    if (!link || event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
    event.preventDefault();
    navigate(link.getAttribute('href'));
});

window.addEventListener('popstate', () => {
    // Back/forward can't be cancelled, so undo it if the user wants to stay
    if (!confirmLeave()) {
        history.pushState(null, '', currentPath);
        return;
    }
    render();
});

// ---------- Account ----------

async function loadMe() {
    const { status, data } = await api('/api/me');
    me = status === 200 ? data : null;
    renderAccount();
    return me;
}

function renderAccount() {
    const account = document.getElementById('account');
    account.hidden = !me;
    if (!me) return;

    const avatar = /** @type {HTMLImageElement} */ (document.getElementById('account-avatar'));
    // Sessions from before default avatars were added may not have one
    avatar.hidden = !me.user.avatar;
    if (me.user.avatar) avatar.src = me.user.avatar;
    document.getElementById('account-name').textContent = me.user.displayName;
}

document.getElementById('logout').addEventListener('click', async () => {
    if (!confirmLeave()) return;
    cleanup();
    cleanup = () => {};
    await fetch('/auth/logout', { method: 'POST' });
    me = null;
    clearServerCache();
    renderAccount();
    history.pushState(null, '', '/');
    render();
});

// ---------- Pages ----------

function renderLoggedOut() {
    app.replaceChildren(
        el('section', { className: 'hero' }, [
            el('div', { className: 'hero-mark', 'aria-hidden': 'true' }),
            el('h1', { textContent: 'Ovx Dashboard' }),
            el('p', { textContent: 'Log in with Discord to manage Ovx in your servers.' }),
            el('a', {
                className: 'button button-primary button-large',
                href: '/auth/login',
                textContent: 'Log in with Discord',
            }),
        ])
    );
}

async function render() {
    cleanup();
    cleanup = () => {};
    currentPath = location.pathname;

    const route = location.pathname.match(/^\/servers\/(\d{17,20})(?:\/([\w-]+))?\/?$/);
    app.classList.toggle('page-wide', Boolean(route));

    if (!me) {
        if (!route) renderPickerSkeleton(app);
        await loadMe();
    }
    if (!me) return renderLoggedOut();

    if (route) {
        cleanup = await renderServerPage(app, route[1], route[2] ?? '', () => {
            me = null;
            renderAccount();
            renderLoggedOut();
        });
        return;
    }

    renderPicker(app, me, {
        refresh: loadMe,
        onInvited: (guildId) => navigate(`/servers/${guildId}`),
    });
}

// ---------- Start ----------

// Show login errors once, then tidy the address bar
const loginResult = new URLSearchParams(location.search).get('login');
if (loginResult) {
    banner.textContent = LOGIN_MESSAGES[loginResult] ?? '';
    banner.hidden = !banner.textContent;
    history.replaceState(null, '', location.pathname);
}

render().catch(() => {
    app.replaceChildren(
        el('p', { className: 'empty', textContent: 'Could not reach the dashboard. Is the bot running?' })
    );
});
