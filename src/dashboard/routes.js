import { Router } from 'express';
import { PermissionsBitField, PermissionFlagsBits, OAuth2Scopes } from 'discord.js';
import { requireLogin, requireDeveloper, validGuildId } from './middleware.js';
import { LogData } from '../shared/utils/logger.js';

const LEADERBOARD_TYPES = new Set(['level', 'totalMessages', 'totalVoice', 'totalCommands']);
const PUBLIC_CACHE_MS = 60_000;
const PUBLIC_CACHE_MAX = 500;

// What the bot needs for its features (levels, logs, rewards); used in "Add to server" links
const BOT_PERMISSIONS = new PermissionsBitField([
    PermissionFlagsBits.ViewChannel,
    PermissionFlagsBits.SendMessages,
    PermissionFlagsBits.EmbedLinks,
    PermissionFlagsBits.AttachFiles,
    PermissionFlagsBits.ReadMessageHistory,
    PermissionFlagsBits.ManageRoles,
    PermissionFlagsBits.ViewAuditLog,
]).bitfield.toString();

/**
 * JSON API for the dashboard UI.
 *
 * @param {{
 *   bridge: ReturnType<typeof import('./shardBridge.js').createShardBridge>,
 *   applicationId: string,
 *   developerIds: string[],
 *   auditStore: import('./auditStore.js').AuditStore,
 * }} options
 */
export function createApiRouter({ bridge, applicationId, developerIds, auditStore }) {
    const router = Router();
    const publicCache = new Map();

    /**
     * Writes a Web Logs entry after a successful save. A failure here is logged but doesn't undo
     * or fail the save, which has already been applied by the bot.
     */
    const recordAudit = async (req, action, changes) => {
        if (!changes?.length) return; // Nothing actually changed
        try {
            await auditStore.record({ guildId: req.params.guildId, user: req.session.user, action, changes });
        } catch (error) {
            LogData('Dashboard', `Could not write Web Logs entry for ${req.params.guildId}: ${error.message}`, 'error');
        }
    };

    /** Sends a shard result, or a 503 if the shard couldn't be reached (e.g. restarting). */
    const respond = async (res, run) => {
        let result;
        try {
            result = await run();
        } catch (error) {
            // Errors inside the shard come back as results (see shardHandlers.js), so this means it was unreachable
            LogData('Dashboard', `Could not reach the shard: ${error.message}`, 'warning');
            return res.status(503).json({ error: 'The bot is restarting, try again in a moment' });
        }
        if (!result.ok) return res.status(result.status).json({ error: result.error, details: result.details });
        res.json(result.data);
    };

    router.get('/me', requireLogin, async (req, res) => {
        const { user, guilds } = req.session;

        let botGuildIds = new Set();
        try {
            botGuildIds = await bridge.botGuildIds(guilds.map((guild) => guild.id));
        } catch (error) {
            LogData('Dashboard', `Could not check bot servers: ${error.message}`, 'warning');
        }

        res.json({
            user: { ...user, isDeveloper: developerIds.includes(user.id) },
            guilds: guilds.map((guild) => ({
                ...guild,
                botPresent: botGuildIds.has(guild.id),
                inviteUrl: botGuildIds.has(guild.id) ? null : inviteUrl(applicationId, guild.id),
            })),
        });
    });

    router.get('/guilds/:guildId', requireLogin, validGuildId, (req, res) =>
        respond(res, () => bridge.guild('guildOverview', req.params.guildId, { userId: req.session.user.id }))
    );

    router.put('/guilds/:guildId/levels', requireLogin, validGuildId, (req, res) =>
        respond(res, async () => {
            const result = await bridge.guild('saveLevelSettings', req.params.guildId, {
                userId: req.session.user.id,
                settings: req.body,
            });
            if (result.ok) {
                LogData(
                    'Dashboard',
                    `Level settings saved for ${req.params.guildId} by ${req.session.user.id}`,
                    'info'
                );
                await recordAudit(req, 'Updated level settings', result.changes);
                // Visibility may have changed, so drop any cached public copy
                for (const key of publicCache.keys()) if (key.startsWith(req.params.guildId)) publicCache.delete(key);
            }
            return result;
        })
    );

    router.put('/guilds/:guildId/bot', requireLogin, validGuildId, (req, res) =>
        respond(res, async () => {
            const result = await bridge.guild('saveBotSettings', req.params.guildId, {
                userId: req.session.user.id,
                settings: req.body,
            });
            if (result.ok && result.changes?.length) {
                LogData('Dashboard', `Bot settings saved for ${req.params.guildId} by ${req.session.user.id}`, 'info');
                await recordAudit(req, 'Updated bot settings', result.changes);
            }
            return result;
        })
    );

    router.put('/guilds/:guildId/auto-roles', requireLogin, validGuildId, (req, res) =>
        respond(res, async () => {
            const result = await bridge.guild('saveAutoRoleSettings', req.params.guildId, {
                userId: req.session.user.id,
                settings: req.body,
            });
            if (result.ok && result.changes?.length) {
                LogData('Dashboard', `Auto roles saved for ${req.params.guildId} by ${req.session.user.id}`, 'info');
                await recordAudit(req, 'Updated auto roles', result.changes);
            }
            return result;
        })
    );

    router.put('/guilds/:guildId/welcome', requireLogin, validGuildId, (req, res) =>
        respond(res, async () => {
            const result = await bridge.guild('saveWelcomeSettings', req.params.guildId, {
                userId: req.session.user.id,
                settings: req.body,
            });
            if (result.ok && result.changes?.length) {
                LogData(
                    'Dashboard',
                    `Welcome messages saved for ${req.params.guildId} by ${req.session.user.id}`,
                    'info'
                );
                await recordAudit(req, 'Updated welcome messages', result.changes);
            }
            return result;
        })
    );

    router.put('/guilds/:guildId/tickets', requireLogin, validGuildId, (req, res) =>
        respond(res, async () => {
            const result = await bridge.guild('saveTicketSettings', req.params.guildId, {
                userId: req.session.user.id,
                settings: req.body,
            });
            if (result.ok && result.changes?.length) {
                LogData(
                    'Dashboard',
                    `Ticket settings saved for ${req.params.guildId} by ${req.session.user.id}`,
                    'info'
                );
                await recordAudit(req, 'Updated ticket settings', result.changes);
            }
            return result;
        })
    );

    router.post('/guilds/:guildId/tickets/panel', requireLogin, validGuildId, (req, res) =>
        respond(res, async () => {
            const result = await bridge.guild('postTicketPanel', req.params.guildId, {
                userId: req.session.user.id,
                channelId: req.body?.channelId,
            });
            if (result.ok) await recordAudit(req, 'Updated ticket settings', result.changes);
            return result;
        })
    );

    const RESET_ACTIONS = {
        levels: 'Reset level settings',
        logging: 'Reset logging settings',
        bot: 'Reset bot settings',
        'auto-roles': 'Reset auto roles',
        welcome: 'Reset welcome messages',
        tickets: 'Reset ticket settings',
    };

    router.post('/guilds/:guildId/reset/:section', requireLogin, validGuildId, (req, res) => {
        const { guildId, section } = req.params;
        if (!Object.hasOwn(RESET_ACTIONS, section)) return res.status(404).json({ error: 'Not found' });

        return respond(res, async () => {
            const result = await bridge.guild('resetSettings', guildId, { userId: req.session.user.id, section });
            if (result.ok) {
                LogData('Dashboard', `${RESET_ACTIONS[section]} for ${guildId} by ${req.session.user.id}`, 'info');
                await recordAudit(req, RESET_ACTIONS[section], result.changes);
                // The public leaderboard is switched off by a levels reset
                if (section === 'levels') {
                    for (const key of publicCache.keys()) if (key.startsWith(guildId)) publicCache.delete(key);
                }
            }
            return result;
        });
    });

    router.put('/guilds/:guildId/logging', requireLogin, validGuildId, (req, res) =>
        respond(res, async () => {
            const result = await bridge.guild('saveLoggingSettings', req.params.guildId, {
                userId: req.session.user.id,
                settings: req.body,
            });
            if (result.ok) {
                LogData(
                    'Dashboard',
                    `Logging settings saved for ${req.params.guildId} by ${req.session.user.id}`,
                    'info'
                );
                await recordAudit(req, 'Updated logging settings', result.changes);
            }
            return result;
        })
    );

    // Web Logs: changes made through the dashboard. Manage Server is checked live on the shard first.
    router.get('/guilds/:guildId/audit-log', requireLogin, validGuildId, async (req, res) => {
        let access;
        try {
            access = await bridge.guild('access', req.params.guildId, { userId: req.session.user.id });
        } catch {
            return res.status(503).json({ error: 'The bot is restarting, try again in a moment' });
        }
        if (!access.ok) return res.status(access.status).json({ error: access.error });

        const { username, action, before } = req.query;
        res.json(
            await auditStore.list(req.params.guildId, {
                username: typeof username === 'string' ? username : undefined,
                action: typeof action === 'string' ? action : undefined,
                before: typeof before === 'string' ? before : undefined,
            })
        );
    });

    router.get('/guilds/:guildId/leaderboard', requireLogin, validGuildId, (req, res) => {
        const type = leaderboardType(req.query.type);
        respond(res, () =>
            bridge.guild('leaderboard', req.params.guildId, { type, limit: 100, viewerId: req.session.user.id })
        );
    });

    // Public: no login, only for servers that turned on publicLeaderboard. Cached to limit load.
    router.get('/public/leaderboard/:guildId', validGuildId, async (req, res) => {
        const type = leaderboardType(req.query.type);
        const key = `${req.params.guildId}:${type}`;
        const cached = publicCache.get(key);
        if (cached && Date.now() - cached.at < PUBLIC_CACHE_MS) return res.status(cached.status).json(cached.body);

        let result;
        try {
            result = await bridge.guild('leaderboard', req.params.guildId, { type, limit: 100 });
        } catch {
            return res.status(503).json({ error: 'The bot is restarting, try again in a moment' });
        }

        const status = result.ok ? 200 : result.status;
        const body = result.ok ? result.data : { error: result.error };
        if (publicCache.size >= PUBLIC_CACHE_MAX) publicCache.delete(publicCache.keys().next().value);
        publicCache.set(key, { at: Date.now(), status, body });
        res.status(status).json(body);
    });

    router.get('/dev/stats', requireLogin, requireDeveloper(developerIds), async (req, res) => {
        try {
            const shards = await bridge.stats();
            res.json({
                shards,
                totals: {
                    shards: shards.length,
                    guilds: shards.reduce((total, shard) => total + shard.guilds, 0),
                    members: shards.reduce((total, shard) => total + shard.members, 0),
                },
                manager: {
                    uptimeMs: Math.round(process.uptime() * 1000),
                    memoryMb: Math.round(process.memoryUsage().rss / 1024 / 1024),
                    nodeVersion: process.version,
                },
            });
        } catch {
            res.status(503).json({ error: 'The bot is restarting, try again in a moment' });
        }
    });

    router.use((req, res) => res.status(404).json({ error: 'Not found' }));

    return router;
}

/** @param {unknown} value */
function leaderboardType(value) {
    return typeof value === 'string' && LEADERBOARD_TYPES.has(value) ? value : 'level';
}

/**
 * @param {string} applicationId
 * @param {string} guildId
 */
function inviteUrl(applicationId, guildId) {
    const params = new URLSearchParams({
        client_id: applicationId,
        scope: [OAuth2Scopes.Bot, OAuth2Scopes.ApplicationsCommands].join(' '),
        permissions: BOT_PERMISSIONS,
        guild_id: guildId,
        disable_guild_select: 'true',
    });
    return `https://discord.com/oauth2/authorize?${params}`;
}
