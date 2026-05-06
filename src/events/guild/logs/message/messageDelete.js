import { Events, PermissionFlagsBits, AuditLogEvent, User, Message, AttachmentBuilder } from 'discord.js';
import Logs_Cache from '../../../../constants/cache/logs.js';
import Client from '../../../../core/client.js';

export const name = Events.MessageDelete;
export const once = false;
export const description = 'Guild Message Delete Logs';

/**
 * @param {Message & { client: Client }} message
 */

export async function execute(message) {
    const { client, guild, channel, content, author } = message;

    if (message.partial || !author || author.bot || !guild) return;
    
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


    let executor = null;
    let username = 'Unknown';
    if(guild.members.me.permissions.has(PermissionFlagsBits.ViewAuditLog)) {
        
        // Waiting for discord push to audit logs
        await new Promise(resolve => setTimeout(resolve, 1500));

        const fetchedLogs = await guild.fetchAuditLogs({
            limit: 5,
            type: AuditLogEvent.MessageDelete
        });

        const deletionLog = fetchedLogs.entries.find(entry => entry.target?.id === author.id && entry.extra?.channel?.id === channel.id && Date.now() - entry.createdTimestamp < 5000);

        if(deletionLog) {
            executor = deletionLog.executor;
            username = deletionLog.executor.username;
        } else {
            executor = author;
            username = author.username;
        }
    }


    const attachments = message.attachments.map((attachment) => attachment.proxyURL).join('\n');
    const deletedText = `-# ${content ? content.substring(0, 2000) : client.utils.Translate('logs.messageDelete.noContent', guild.preferredLocale)}`

    const title = client.utils.Translate('logs.messageDelete.title', guild.preferredLocale, { channel: channel.name });
    const description = `${channel} | ${executor ? executor : 'Unknown Tag'}\n${deletedText}${attachments ? `\n### Attachments:\n` : ``}`;
    const footerText = `MID: ${message.id} | ${username !== 'Unknown' ? `UID: ${author.id}` : ''}`;

    const files = message.attachments.map(attachment => {
            return new AttachmentBuilder(attachment.url, { name: attachment.name });
        });
    
    const embed = await client.utils.Embed(logChannel, 'Red', title, description, { timestamp: true, footer: { text: footerText }, author, files }).catch((err) => {
        client.utils.LogData('Message Deleted', `Guild: ${guild.name} | Error creating embed: ${err}`, 'error');
        // TODO: Add error logging for failed embed creation
        return null;
    });
};