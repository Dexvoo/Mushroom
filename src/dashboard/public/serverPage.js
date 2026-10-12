// A server's dashboard: sidebar of categories on the left, the chosen section on the right.
import { el, api, serverIcon } from './ui.js';
import { renderLevels } from './levels.js';
import { renderLogging } from './logging.js';
import { renderWebLogs } from './webLogs.js';
import { renderBotSettings } from './botSettings.js';
import { renderAutoRoles } from './autoRoles.js';
import { renderWelcome } from './welcome.js';

/**
 * Sidebar layout. Items with a `render` are live; the rest are planned and shown as "Soon".
 * @type {{ label: string, items: { slug: string, label: string, render?: Function }[] }[]}
 */
export const SECTIONS = [
    {
        label: 'Settings',
        items: [
            { slug: 'bot-settings', label: 'Bot Settings', render: renderBotSettings },
            { slug: 'commands', label: 'Commands' },
            { slug: 'web-logs', label: 'Web Logs', render: renderWebLogs },
        ],
    },
    {
        label: 'Moderation',
        items: [
            { slug: 'moderation', label: 'Moderation Settings' },
            { slug: 'logging', label: 'Logging', render: renderLogging },
        ],
    },
    {
        label: 'Roles',
        items: [
            { slug: 'reaction-roles', label: 'Reaction Roles' },
            { slug: 'auto-roles', label: 'Auto Roles', render: renderAutoRoles },
        ],
    },
    {
        label: 'Notifications',
        items: [
            { slug: 'twitch', label: 'Twitch' },
            { slug: 'youtube', label: 'YouTube' },
            { slug: 'kick', label: 'Kick' },
        ],
    },
    {
        label: 'Utility',
        items: [
            { slug: 'levels', label: 'Levels', render: renderLevels },
            { slug: 'welcome-messages', label: 'Welcome Messages', render: renderWelcome },
            { slug: 'custom-embeds', label: 'Custom Embeds' },
            { slug: 'starboard', label: 'Starboard' },
        ],
    },
];

export const DEFAULT_SECTION = 'levels';

const ITEMS = SECTIONS.flatMap((group) => group.items);

/** Overview for the server currently open, reused while switching sections */
let cached = null;

/**
 * @param {HTMLElement} app
 * @param {string} guildId
 * @param {string} slug
 * @param {() => void} onLoggedOut
 * @returns {Promise<() => void>} Cleanup for the section
 */
export async function renderServerPage(app, guildId, slug, onLoggedOut) {
    const item =
        ITEMS.find((entry) => entry.slug === slug && entry.render) ??
        ITEMS.find((entry) => entry.slug === DEFAULT_SECTION);

    if (cached?.guild.id !== guildId) {
        app.replaceChildren(el('p', { className: 'page-subtitle loading', textContent: 'Loading server…' }));
        const { status, data } = await api(`/api/guilds/${encodeURIComponent(guildId)}`);
        if (status === 401) {
            onLoggedOut();
            return () => {};
        }
        if (status !== 200) {
            cached = null;
            app.replaceChildren(
                el('a', { className: 'back-link', href: '/', dataset: { link: '' }, textContent: '← All servers' }),
                el('p', { className: 'empty', textContent: data?.error ?? 'Could not load this server.' })
            );
            return () => {};
        }
        cached = data;
    }

    const content = el('div', { className: 'server-content' });
    app.replaceChildren(el('div', { className: 'server-layout' }, [sidebar(cached.guild, item.slug), content]));

    // On phones the sidebar is a horizontal strip; bring the current section into view
    const nav = app.querySelector('.sidebar-nav');
    const active = /** @type {HTMLElement | null} */ (app.querySelector('.sidebar-link.active'));
    if (nav && active && nav.scrollWidth > nav.clientWidth) {
        nav.scrollLeft = active.offsetLeft - nav.clientWidth / 2 + active.offsetWidth / 2;
    }
    return item.render(content, cached) ?? (() => {});
}

/** Forget the cached server, e.g. after logging out */
export function clearServerCache() {
    cached = null;
}

function sidebar(guild, activeSlug) {
    return el('aside', { className: 'sidebar', 'aria-label': 'Server sections' }, [
        el('a', { className: 'back-link', href: '/', dataset: { link: '' }, textContent: '← All servers' }),
        el('div', { className: 'sidebar-server' }, [
            serverIcon(guild, 40),
            el('span', { className: 'sidebar-server-name', textContent: guild.name }),
        ]),
        el(
            'nav',
            { className: 'sidebar-nav' },
            SECTIONS.map((group) =>
                el('div', { className: 'sidebar-group' }, [
                    el('h2', { className: 'sidebar-heading', textContent: group.label }),
                    el(
                        'ul',
                        { className: 'sidebar-list' },
                        group.items.map((item) => el('li', {}, [sidebarItem(guild, item, item.slug === activeSlug)]))
                    ),
                ])
            )
        ),
    ]);
}

function sidebarItem(guild, item, active) {
    if (!item.render) {
        return el('span', { className: 'sidebar-link sidebar-link-soon', 'aria-disabled': 'true' }, [
            el('span', { textContent: item.label }),
            el('span', { className: 'soon-pill', textContent: 'Soon' }),
        ]);
    }
    return el('a', {
        className: `sidebar-link${active ? ' active' : ''}`,
        href: `/servers/${guild.id}/${item.slug}`,
        dataset: { link: '' },
        textContent: item.label,
        'aria-current': active ? 'page' : 'false',
    });
}
