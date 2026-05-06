import { AuditLogEvent, Events, GuildChannel, PermissionFlagsBits } from 'discord.js';
import Logs_Cache from '../../../../constants/cache/logs.js';
import Client from '../../../../core/client.js';

export const name = Events.ChannelDelete;
export const once = false;

/**
 * @param {GuildChannel & { client: Client }} channel
 */

export async function execute(channel) {
    const { guild, client } = channel;

    if (!guild) return;
    
    const logsData = await Logs_Cache.get(guild.id);
    if(!logsData?.channel?.enabled || !logsData?.channel?.channelId) return client.utils.LogData('Channel Deleted', `Guild: ${guild.name} | Disabled`, 'warning');
    
    const logChannel = guild.channels.cache.get(logsData.channel.channelId);
    if(!logChannel) {
        await Logs_Cache.setType(guild.id, 'channel', { enabled: false, channelId: null });
        return client.utils.LogData('Channel Deleted', `Guild: ${guild.name} | Log channel not found, disabling logs`, 'error');
    };

    const botPermissions = [ PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.EmbedLinks ];
    const [ hasPermissions, missingPermissions ] = client.utils.PermissionCheck(logChannel, botPermissions, guild.members.me, client);
    if(!hasPermissions) {
        await Logs_Cache.setType(guild.id, 'channel', { enabled: false, channelId: null });
        return client.utils.LogData('Channel Deleted', `Guild: ${guild.name} | Missing permissions in log channel, disabling logs. Missing perms: ${missingPermissions.flat().join(', ')}`, 'error');
    }

    let executor = null;
    let username = 'Unknown';
    if(guild.members.me.permissions.has(PermissionFlagsBits.ViewAuditLog)) {

        // Waiting for discord push to audit logs
        await new Promise(resolve => setTimeout(resolve, 1500));

        const fetchedLogs = await guild.fetchAuditLogs({
            limit: 1,
            type: AuditLogEvent.ChannelDelete
        });

        const channelLog = fetchedLogs.entries.find(entry => entry.targetId === channel.id);

        if(channelLog) {
            executor = channelLog.executor;
            username = channelLog.executor.username;
        }
    }

    const title = client.utils.Translate('logs.channelDelete', guild.preferredLocale, { username });
    const footerText = `CID: ${channel.id} | ${username !== 'Unknown' ? `UID: ${executor.id}` : ''}`;

    const embed = await client.utils.Embed(logChannel, 'Red', title, `#${channel.name} | ${executor ? executor : 'Unknown User'}`, { timestamp: true, footer: { text: footerText } }).catch((err) => {
        client.utils.LogData('Channel Deleted', `Guild: ${guild.name} | Error creating embed: ${err}`, 'error');
        return null;
    });

    if(!embed) {

        // TODO: Add error logging for failed embed creation
        client.utils.LogData('Channel Deleted', `Guild: ${guild.name} | Failed to create embed`, 'error');
    }
};