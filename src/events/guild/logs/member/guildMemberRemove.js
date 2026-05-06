import { Events, PermissionFlagsBits, AuditLogEvent, User, GuildMember } from 'discord.js';
import Logs_Cache from '../../../../constants/cache/logs.js';
import Client from '../../../../core/client.js';

export const name = Events.GuildMemberRemove;
export const once = false;

/**
 * @param {GuildMember & { client: Client }} member
 */

export async function execute(member) {
    const { guild, client } = member;

    if (!guild) return;
    
    const logsData = await Logs_Cache.get(guild.id);
    if(!logsData?.member?.enabled || !logsData?.member?.channelId) return client.utils.LogData('Member Left', `Guild: ${guild.name} | Disabled`, 'warning');
    
    const logChannel = guild.channels.cache.get(logsData.member.channelId);
    if(!logChannel) {
        await Logs_Cache.setType(guild.id, 'member', { enabled: false, channelId: null });
        return client.utils.LogData('Member Left', `Guild: ${guild.name} | Log channel not found, disabling logs`, 'error');
    };

    const botPermissions = [ PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.EmbedLinks ];
    const [ hasPermissions, missingPermissions ] = client.utils.PermissionCheck(logChannel, botPermissions, guild.members.me);
    if(!hasPermissions) {
        await Logs_Cache.setType(guild.id, 'member', { enabled: false, channelId: null });
        return client.utils.LogData('Member Left', `Guild: ${guild.name} | Missing permissions in log channel, disabling logs. Missing perms: ${missingPermissions.flat().join(', ')}`, 'error');
    }

    const longTimestamp = `${client.utils.Timestamp(member.joinedAt, 'F')}`;
    const shortTimestamp = `${client.utils.Timestamp(member.joinedAt, 'R')}`;
    const rolesList = member.roles?.cache?.filter((role) => role.name !== '@everyone').map((role) => role).join(' • ');
    const roles = rolesList && rolesList.length > 0 ? rolesList.substring(0, 1024) : 'None';

    
    const title = client.utils.Translate('logs.guildMemberRemove', guild.preferredLocale);
    const description = client.utils.Translate('logs.guildMemberRemoveDescription', guild.preferredLocale, { member, longTimestamp, shortTimestamp, roles});

    const footerText = `UID: ${member.id}`;

    const embed = await client.utils.Embed(logChannel, 'Red', title, description, { timestamp: true, footer: { text: footerText }, author: member.user }).catch((err) => {
        client.utils.LogData('Member Left', `Guild: ${guild.name} | Error creating embed: ${err.message}`, 'error');
        return null;
    });

    if(!embed) {

        // TODO: Add error logging for failed embed creation
        client.utils.LogData('Member Left', `Guild: ${guild.name} | Failed to create embed`, 'error');
    }
};