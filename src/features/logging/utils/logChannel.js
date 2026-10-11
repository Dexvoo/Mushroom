import { PermissionFlagsBits } from 'discord.js';
import Logs_Cache from '../cache/logs.cache.js';
import { logSettings } from '../models/logging.js';
import { PermissionCheck } from '../../../shared/utils/permissions.js';
import { LogData } from '../../../shared/utils/logger.js';

/**
 * @typedef {import('../models/logging.js').LogType} LogType
 */

const REQUIRED_PERMISSIONS = [
    PermissionFlagsBits.ViewChannel,
    PermissionFlagsBits.SendMessages,
    PermissionFlagsBits.EmbedLinks,
];

/**
 * Finds the channel a log type should be posted to.
 * If the configured channel is gone or the bot can't post there, the log type is turned off.
 *
 * @param {import('discord.js').Guild} guild
 * @param {LogType} type
 * @param {object} [options]
 * @param {string | null} [options.sourceChannelId] - The channel the event happened in; skipped if it's on the ignore list
 * @returns {Promise<import('discord.js').GuildTextBasedChannel | null>} null if nothing should be logged
 */
export async function getLogChannel(guild, type, { sourceChannelId } = {}) {
    const config = await Logs_Cache.get(guild.id);
    const settings = logSettings(config, type);
    if (!settings?.enabled || !settings.channelId) return null;

    if (sourceChannelId && config.ignoredChannels?.includes(sourceChannelId)) return null;

    const channel = guild.channels.cache.get(settings.channelId);
    if (!channel?.isTextBased()) {
        await disableLogType(guild, type, 'log channel not found');
        return null;
    }

    const [hasPermissions, missingPermissions] = PermissionCheck(channel, REQUIRED_PERMISSIONS, guild.members.me);
    if (!hasPermissions) {
        await disableLogType(
            guild,
            type,
            `missing permissions in log channel: ${missingPermissions.flat().join(', ')}`
        );
        return null;
    }

    return channel;
}

/**
 * @param {import('discord.js').Guild} guild
 * @param {LogType} type
 * @param {string} reason
 */
async function disableLogType(guild, type, reason) {
    await Logs_Cache.setType(guild.id, type, { enabled: false, channelId: null });
    LogData('Logging', `Guild: ${guild.name} | Disabled '${type}' logs: ${reason}`, 'error');
}

/**
 * Finds who performed an action using the audit log, after giving Discord a moment to write the entry.
 *
 * @param {import('discord.js').Guild} guild
 * @param {import('discord.js').AuditLogEvent} type
 * @param {(entry: import('discord.js').GuildAuditLogsEntry) => boolean} match - Picks the entry for this action
 * @param {object} [options]
 * @param {number} [options.delayMs=1500] - How long to wait for Discord to write the entry
 * @returns {Promise<import('discord.js').User | import('discord.js').PartialUser | null>} null if it can't be determined
 */
export async function findAuditLogExecutor(guild, type, match, { delayMs = 1500 } = {}) {
    if (!guild.members.me?.permissions.has(PermissionFlagsBits.ViewAuditLog)) return null;

    await new Promise((resolve) => setTimeout(resolve, delayMs));

    try {
        const { entries } = await guild.fetchAuditLogs({ limit: 5, type });
        return entries.find(match)?.executor ?? null;
    } catch (error) {
        LogData('Logging', `Guild: ${guild.name} | Audit log fetch failed: ${error.message}`, 'warning');
        return null;
    }
}
