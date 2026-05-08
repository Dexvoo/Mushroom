import { Events, PermissionFlagsBits, AuditLogEvent, User, Message, AttachmentBuilder, GuildChannel } from 'discord.js';
import Logs_Cache from '../../../../constants/cache/logs.js';
import Client from '../../../../core/client.js';

export const name = Events.MessageBulkDelete;
export const once = false;
export const description = 'Guild Message Bulk Delete Logs';

/**
 * @param {Message & { client: Client }} messages
 * @param {GuildChannel & { client: Client }} channel
 */

export async function execute(messages, channel) {
    const { client, guild } = channel;

    if (!guild) return;
    
    const logsData = await Logs_Cache.get(guild.id);
    if(!logsData?.message?.enabled || !logsData?.message?.channelId) return client.utils.LogData('Message Deleted', `Guild: ${guild.name} | Disabled`, 'warning');

    if(logsData.ignoredChannels?.includes(channel.id)) return;
    
    const logChannel = guild.channels.cache.get(logsData.message.channelId);
    if(!logChannel) {
        await Logs_Cache.setType(guild.id, 'message', { enabled: false, channelId: null });
        return client.utils.LogData('Message Deleted', `Guild: ${guild.name} | Log channel not found, disabling logs`, 'error');
    };

    const botPermissions = [ PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.EmbedLinks ];
    const [ hasPermissions, missingPermissions ] = client.utils.PermissionCheck(logChannel, botPermissions, guild.members.me);
    if(!hasPermissions) {
        await Logs_Cache.setType(guild.id, 'message', { enabled: false, channelId: null });
        return client.utils.LogData('Message Deleted', `Guild: ${guild.name} | Missing permissions in log channel, disabling logs. Missing perms: ${missingPermissions.flat().join(', ')}`, 'error');
    }


    let executor = false;
    let username = 'Unknown';
    if(guild.members.me.permissions.has(PermissionFlagsBits.ViewAuditLog)) {
        
        // Waiting for discord push to audit logs
        await new Promise(resolve => setTimeout(resolve, 5000));

        const fetchedLogs = await guild.fetchAuditLogs({
            limit: 5,
            type: AuditLogEvent.MessageBulkDelete
        });

        const deletionLog = fetchedLogs.entries.find(entry => entry.targetId === channel.id && Date.now() - entry.createdTimestamp < 10_000);

        if(deletionLog) {

            const fetchExecutor = (await guild.members.fetch(deletionLog.executor.id)).user
            executor = fetchExecutor;
            username = fetchExecutor.username;
        }
    }
    
    const title = client.utils.Translate('logs.message.bulkDelete_title', guild.preferredLocale, { channel: channel.name });
    const description = client.utils.Translate('logs.message.bulkDelete_description', guild.preferredLocale, { count: messages.size, user: executor ? executor : 'Unknown Tag' });
    const footerText = `${username !== 'Unknown' ? `UID: ${executor.id} | ` : ''}CID: ${channel.id}`;

    
    const embed = await client.utils.Embed(logChannel, 'DarkRed', title, description, { timestamp: true, footer: { text: footerText }, author: executor }).catch((err) => {
        client.utils.LogData('Message Deleted', `Guild: ${guild.name} | Error creating embed: ${err}`, 'error');
        // TODO: Add error logging for failed embed creation
        return null;
    });
};