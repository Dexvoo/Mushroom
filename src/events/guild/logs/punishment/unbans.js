import { Events, PermissionFlagsBits, AuditLogEvent, GuildBan } from 'discord.js';
import Logs_Cache from '../../../../constants/cache/logs.js';
import Client from '../../../../core/client.js';

export const name = Events.GuildBanRemove;
export const once = false;
export const description = 'Guild Punishment Unban Logs';

/**
 * @param {GuildBan & { client: Client }} ban
 */

export async function execute(ban) {
    const { client, guild, user, reason } = ban;

    if (!guild) return;
    
    const logsData = await Logs_Cache.get(guild.id);
    if(!logsData?.punishment?.enabled || !logsData?.punishment?.channelId) return client.utils.LogData('Member Banned', `Guild: ${guild.name} | Disabled`, 'warning');
    
    const logChannel = guild.channels.cache.get(logsData.member.channelId);
    if(!logChannel) {
        await Logs_Cache.setType(guild.id, 'punishment', { enabled: false, channelId: null });
        return client.utils.LogData('Member Banned', `Guild: ${guild.name} | Log channel not found, disabling logs`, 'error');
    };

    const botPermissions = [ PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.EmbedLinks ];
    const [ hasPermissions, missingPermissions ] = client.utils.PermissionCheck(logChannel, botPermissions, guild.members.me);
    if(!hasPermissions) {
        await Logs_Cache.setType(guild.id, 'punishment', { enabled: false, channelId: null });
        return client.utils.LogData('Member Banned', `Guild: ${guild.name} | Missing permissions in log channel, disabling logs. Missing perms: ${missingPermissions.flat().join(', ')}`, 'error');
    }
    

    let executor = null;
    let username = 'Unknown';
    if(guild.members.me.permissions.has(PermissionFlagsBits.ViewAuditLog)) {
        
        // Waiting for discord push to audit logs
        await new Promise(resolve => setTimeout(resolve, 1500));

        const fetchedLogs = await guild.fetchAuditLogs({
            limit: 5,
            type: AuditLogEvent.MemberBanRemove
        });

        const deletionLog = fetchedLogs.entries.find(entry => entry.target?.id === user.id && Date.now() - entry.createdTimestamp < 5000);

        if(deletionLog) {
            executor = deletionLog.executor;
            username = deletionLog.executor.username;
        } else {
            executor = user;
            username = user.username;
        }
    }

    const title = client.utils.Translate('logs.punishment.unbanTitle', guild.preferredLocale);
    const description = client.utils.Translate('logs.punishment.unbanDescription', guild.preferredLocale, { user, reason, moderator: executor });

    const footerText = `UID: ${user.id}`;

    const embed = await client.utils.Embed(logChannel, 'Yellow', title, description, { timestamp: true, footer: { text: footerText }, author: user }).catch((err) => {
        client.utils.LogData('Member Banned', `Guild: ${guild.name} | Error creating embed: ${err.message}`, 'error');
        // TODO: Add error logging for failed embed creation
        return;
    });
};