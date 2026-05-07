import { Events, PermissionFlagsBits, AuditLogEvent, User, GuildMember } from 'discord.js';
import Logs_Cache from '../../../../constants/cache/logs.js';
import Client from '../../../../core/client.js';

export const name = Events.GuildMemberAdd;
export const once = false;
export const description = 'Guild Member Add Logs';

/**
 * @param {GuildMember & { client: Client }} member
 */

export async function execute(member) {
    const { guild, client } = member;

    if (!guild) return;
    
    const logsData = await Logs_Cache.get(guild.id);
    if(!logsData?.member?.enabled || !logsData?.member?.channelId) return client.utils.LogData('Member Joined', `Guild: ${guild.name} | Disabled`, 'warning');
    
    const logChannel = guild.channels.cache.get(logsData.member.channelId);
    if(!logChannel) {
        await Logs_Cache.setType(guild.id, 'member', { enabled: false, channelId: null });
        return client.utils.LogData('Member Joined', `Guild: ${guild.name} | Log channel not found, disabling logs`, 'error');
    };

    const botPermissions = [ PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.EmbedLinks ];
    const [ hasPermissions, missingPermissions ] = client.utils.PermissionCheck(logChannel, botPermissions, guild.members.me);
    if(!hasPermissions) {
        await Logs_Cache.setType(guild.id, 'member', { enabled: false, channelId: null });
        return client.utils.LogData('Member Joined', `Guild: ${guild.name} | Missing permissions in log channel, disabling logs. Missing perms: ${missingPermissions.flat().join(', ')}`, 'error');
    }

    const position = `${guild.memberCount}${client.utils.GetOrdinalSuffix(guild.memberCount)}`;
    const longTimestamp = `${client.utils.Timestamp(member.user.createdAt, 'F')}`;
    const shortTimestamp = `${client.utils.Timestamp(member.user.createdAt, 'R')}`;
    
    const title = client.utils.Translate('logs.guildMemberAdd', guild.preferredLocale);
    const description = client.utils.Translate('logs.guildMemberAddDescription', guild.preferredLocale, { member, position, longTimestamp, shortTimestamp});

    const footerText = `UID: ${member.id}`;

    const embed = await client.utils.Embed(logChannel, 'Green', title, description, { timestamp: true, footer: { text: footerText }, author: member.user }).catch((err) => {
        client.utils.LogData('Member Joined', `Guild: ${guild.name} | Error creating embed: ${err.message}`, 'error');
        // TODO: Add error logging for failed embed creation
        return;
    });
};