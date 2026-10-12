import { DASHBOARD_LOG_TYPES } from './validation.js';
import { logSettings } from '../features/logging/models/logging.js';

/**
 * Plain snapshots of a guild's settings, used by the dashboard API and to describe changes for the Web Logs
 * (both dashboard saves and slash commands, see commandAudit.js).
 */

/**
 * Turns IDs into names for the Web Logs, as they are right now.
 * @param {import('discord.js').Guild} guild
 * @returns {import('./describeChanges.js').NameLookup}
 */
export function nameLookup(guild) {
    return {
        channel: (id) => {
            if (!id) return 'none';
            const channel = guild.channels.cache.get(id);
            return channel ? `#${channel.name}` : 'deleted channel';
        },
        role: (id) => {
            const role = guild.roles.cache.get(id);
            return role ? `@${role.name}` : 'deleted role';
        },
    };
}

/**
 * The logging settings the dashboard can see and edit.
 * Join and leave logs that were never set up show the member log settings they follow (see logSettings).
 * @param {import('../features/logging/models/logging.js').LogsConfigType} config
 */
export function loggingView(config) {
    const types = {};
    for (const type of DASHBOARD_LOG_TYPES) {
        const settings = logSettings(config, /** @type {any} */ (type));
        types[type] = { enabled: Boolean(settings?.enabled), channelId: settings?.channelId ?? null };
    }
    return { types, ignoredChannels: [...(config.ignoredChannels ?? [])] };
}

/**
 * The level settings the dashboard can see and edit (nothing internal like _id).
 * @param {import('../features/levels/models/guildLevels.js').GuildLevelsType} config
 */
export function levelsView(config) {
    return {
        enabled: Boolean(config.enabled),
        channelId: config.channelId ?? null,
        levelUpMessage: config.levelUpMessage ?? null,
        messageCooldown: config.messageCooldown,
        maxLevel: config.maxLevel,
        removePastRewards: Boolean(config.removePastRewards),
        publicLeaderboard: Boolean(config.publicLeaderboard),
        rewards: (config.rewards ?? []).map(({ level, roleId }) => ({ level, roleId })),
        blacklisted: {
            roleIds: [...(config.blacklisted?.roleIds ?? [])],
            channelIds: [...(config.blacklisted?.channelIds ?? [])],
        },
    };
}

/**
 * The auto role settings the dashboard can see and edit.
 * @param {import('../features/autoRoles/models/autoRoles.js').AutoRolesType} config
 * @param {(roleId: string) => boolean} [roleExists] - Drops deleted roles, so they can't block a save
 */
export function autoRolesView(config, roleExists = () => true) {
    return {
        enabled: Boolean(config.enabled),
        humanRoleIds: (config.humanRoleIds ?? []).filter(roleExists),
        botRoleIds: (config.botRoleIds ?? []).filter(roleExists),
    };
}

/**
 * The welcome and goodbye settings the dashboard can see and edit.
 * @param {import('../features/welcome/models/welcome.js').WelcomeType} config
 */
export function welcomeView(config) {
    const message = (value) => ({
        enabled: Boolean(value?.enabled),
        channelId: value?.channelId ?? null,
        message: value?.message ?? null,
        embed: Boolean(value?.embed),
        title: value?.title ?? null,
    });
    return { welcome: message(config.welcome), goodbye: message(config.goodbye) };
}
