import { Events, PermissionFlagsBits, AuditLogEvent, User, Message, AttachmentBuilder } from 'discord.js';
import Logs_Cache from '../../cache/logs.cache.js';
import Client from '../../../../structures/extendedClient.js';

export const name = Events.MessageUpdate;
export const once = false;
export const description = 'Guild Message Update Logs';

/**
 * @param {Message & { client: Client }} oldMessage
 * @param {Message & { client: Client }} newMessage
 */

export async function execute(oldMessage, newMessage) {
    const { client, guild, channel, content, author } = newMessage;

    if (author?.bot || !guild ) return;

    let oldContent = oldMessage.partial ? '*Unavailable (Uncached)*' : oldMessage.content;
    let newContent = newMessage.content;
    
    if(!oldMessage.partial && oldContent === newContent) return;
    
    const logsData = await Logs_Cache.get(guild.id);
    if(!logsData?.message?.enabled || !logsData?.message?.channelId) return client.utils.LogData('Message Update', `Guild: ${guild.name} | Disabled`, 'warning');

    if(logsData.ignoredChannels?.includes(channel.id)) return;
    
    const logChannel = guild.channels.cache.get(logsData.message.channelId);
    if(!logChannel) {
        await Logs_Cache.setType(guild.id, 'message', { enabled: false, channelId: null });
        return client.utils.LogData('Message Update', `Guild: ${guild.name} | Log channel not found, disabling logs`, 'error');
    };

    const botPermissions = [ PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.EmbedLinks ];
    const [ hasPermissions, missingPermissions ] = client.utils.PermissionCheck(logChannel, botPermissions, guild.members.me);
    if(!hasPermissions) {
        await Logs_Cache.setType(guild.id, 'message', { enabled: false, channelId: null });
        return client.utils.LogData('Message Update', `Guild: ${guild.name} | Missing permissions in log channel, disabling logs. Missing perms: ${missingPermissions.flat().join(', ')}`, 'error');
    }


    oldContent = `**Old Content:**\n${oldContent ? oldContent.substring(0, 1900) : client.utils.Translate('logs.messageDelete.noContent', guild.preferredLocale)}`
    newContent = `\n**New Content:**\n${newContent ? newContent.substring(0, 1900) : client.utils.Translate('logs.messageDelete.noContent', guild.preferredLocale)}`
    
    const title = client.utils.Translate('logs.message.update_title', guild.preferredLocale, { channel: channel.name });
    const description = oldContent += newContent
    const footerText = `MID: ${newMessage.id} | UID: ${author.id}`;
    const url = newMessage.url
    
    const embed = await client.utils.Embed(logChannel, 'Red', title, description, { timestamp: true, footer: { text: footerText }, author, url }).catch((err) => {
        client.utils.LogData('Message Update', `Guild: ${guild.name} | Error creating embed: ${err}`, 'error');
        // TODO: Add error logging for failed embed creation
        return null;
    });
};