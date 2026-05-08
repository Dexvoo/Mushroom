import { Events, PermissionFlagsBits, AuditLogEvent, GuildMember } from 'discord.js';
import Logs_Cache from '../../../../constants/cache/logs.js';
import Client from '../../../../core/client.js';

export const name = Events.GuildMemberUpdate;
export const once = false;
export const description = 'Guild Punishment Timeout Adds/Removed Logs';

/**
 * @param {GuildMember & { client: Client }} oldMember
 * @param {GuildMember & { client: Client }} newMember
 */

export async function execute(oldMember, newMember) {
    const { client, guild, user } = newMember;

    if (!guild) return;

    if(oldMember.communicationDisabledUntilTimestamp === newMember.communicationDisabledUntilTimestamp) return;
    
    const logsData = await Logs_Cache.get(guild.id);
    if(!logsData?.punishment?.enabled || !logsData?.punishment?.channelId) return client.utils.LogData('Member Timeout Removed', `Guild: ${guild.name} | Disabled`, 'warning');
    
    const logChannel = guild.channels.cache.get(logsData.member.channelId);
    if(!logChannel) {
        await Logs_Cache.setType(guild.id, 'punishment', { enabled: false, channelId: null });
        return client.utils.LogData('Member Timeout Removed', `Guild: ${guild.name} | Log channel not found, disabling logs`, 'error');
    };

    const botPermissions = [ PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.EmbedLinks ];
    const [ hasPermissions, missingPermissions ] = client.utils.PermissionCheck(logChannel, botPermissions, guild.members.me);
    if(!hasPermissions) {
        await Logs_Cache.setType(guild.id, 'punishment', { enabled: false, channelId: null });
        return client.utils.LogData('Member Timeout Removed', `Guild: ${guild.name} | Missing permissions in log channel, disabling logs. Missing perms: ${missingPermissions.flat().join(', ')}`, 'error');
    }


    let executor = null;
    let username = 'Unknown';
    if(guild.members.me.permissions.has(PermissionFlagsBits.ViewAuditLog)) {
        
        // Waiting for discord push to audit logs
        await new Promise(resolve => setTimeout(resolve, 1500));

        const fetchedLogs = await guild.fetchAuditLogs({
            limit: 5,
            type: AuditLogEvent.MemberUpdate
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

    const footerText = `UID: ${user.id}`;
    if(newMember.communicationDisabledUntilTimestamp === null) {
        const title = client.utils.Translate('logs.punishment.untimeout_title', guild.preferredLocale);
        const description = client.utils.Translate('logs.punishment.untimeout_description', guild.preferredLocale, { user, moderator: executor });
        return client.utils.Embed(logChannel, 'DarkerGrey', title, description, { timestamp: true, footer: { text: footerText }, author: user, moderator: executor }).catch((err) => {
            client.utils.LogData('Member Timeout Removed', `Guild: ${guild.name} | Error creating embed: ${err.message}`, 'error');
            // TODO: Add error logging for failed embed creation
            return;
        });
    } 

    const title = client.utils.Translate('logs.punishment.timeout_title', guild.preferredLocale);
    const description = client.utils.Translate('logs.punishment.timeout_description', guild.preferredLocale, { user, time: client.utils.Timestamp(newMember.communicationDisabledUntil), moderator: executor });
    return client.utils.Embed(logChannel, 'White', title, description, { timestamp: true, footer: { text: footerText }, author: user }).catch((err) => {
        client.utils.LogData('Member Timeout Removed', `Guild: ${guild.name} | Error creating embed: ${err.message}`, 'error');
        // TODO: Add error logging for failed embed creation
        return;
    });
};