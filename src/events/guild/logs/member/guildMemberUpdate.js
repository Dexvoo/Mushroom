import { Events, PermissionFlagsBits, AuditLogEvent, User, GuildMember } from 'discord.js';
import Logs_Cache from '../../../../constants/cache/logs.js';
import Client from '../../../../core/client.js';

export const name = Events.GuildMemberUpdate;
export const once = false;
export const description = 'Guild Member Update Logs';

/**
 * @param {GuildMember & { client: Client }} oldMember
 * @param {GuildMember & { client: Client }} newMember
 */

export async function execute(oldMember, newMember) {
    if(oldMember.partial) return;

    const { guild, client } = newMember;

    if (!guild) return;

    // Check for timeouts as they are handled by punishment/timeouts.js
    if (oldMember.communicationDisabledUntilTimestamp !== newMember.communicationDisabledUntilTimestamp && oldMember.nickname === newMember.nickname && oldMember.roles.cache.size === newMember.roles.cache.size) return;
    
    const logsData = await Logs_Cache.get(guild.id);
    if(!logsData?.member?.enabled || !logsData?.member?.channelId) return client.utils.LogData('Member Update', `Guild: ${guild.name} | Disabled`, 'warning');
    
    const logChannel = guild.channels.cache.get(logsData.member.channelId);
    if(!logChannel) {
        await Logs_Cache.setType(guild.id, 'member', { enabled: false, channelId: null });
        return client.utils.LogData('Member Update', `Guild: ${guild.name} | Log channel not found, disabling logs`, 'error');
    };

    const botPermissions = [ PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.EmbedLinks ];
    const [ hasPermissions, missingPermissions ] = client.utils.PermissionCheck(logChannel, botPermissions, guild.members.me);
    if(!hasPermissions) {
        await Logs_Cache.setType(guild.id, 'member', { enabled: false, channelId: null });
        return client.utils.LogData('Member Update', `Guild: ${guild.name} | Missing permissions in log channel, disabling logs. Missing perms: ${missingPermissions.flat().join(', ')}`, 'error');
    }

    const fields = [];
    let thumbnail = false

    if(oldMember.nickname !== newMember.nickname) {
        fields.push({
            name: 'Nickname',
            value: `\`${oldMember.nickname || oldMember.displayName}\` → \`${newMember.nickname || newMember.displayName}\``,
            inline: false,
        });
    }

    if(oldMember.avatar !== newMember.avatar) {
        const isRemoved = !newMember.avatar;

        fields.push({
            name: 'Server Avatar',
            value: isRemoved ? 'Removed' : 'Updated',
            inline: false,
        });
        
        const avatarUrl = isRemoved 
            ? oldMember.avatarURL({ extension: 'png', size: 512 }) 
            : newMember.avatarURL({ extension: 'png', size: 512 });

        if (avatarUrl) {
            thumbnail = avatarUrl;
        }
    }

    const oldRoles = oldMember.roles.cache.map((r) => r.id);
    const newRoles = newMember.roles.cache.map((r) => r.id);
    const addedRoles = newRoles.filter((r) => !oldRoles.includes(r));
    const removedRoles = oldRoles.filter((r) => !newRoles.includes(r));

    if(addedRoles.length > 0) {
        fields.push({
            name: 'Roles Added',
            value: addedRoles
                .map((r) => `<@&${r}>`)
                .join(', ')
                .substring(0, 1024),
            inline: false,
        });
    }

    if(removedRoles.length > 0) {
        fields.push({
            name: 'Roles Removed',
            value: removedRoles
                .map((r) => `<@&${r}>`)
                .join(', ')
                .substring(0, 1024),
            inline: false,
        });
    }

    if(fields.length === 0 ) return;




    
    const title = client.utils.Translate('logs.member.update_title', guild.preferredLocale);
    const footerText = `UID: ${newMember.id}`;

    const embed = await client.utils.Embed(logChannel, 'Orange', title, '', { timestamp: true, footer: { text: footerText }, author: newMember.user, fields, thumbnail }).catch((err) => {
        client.utils.LogData('Member Update', `Guild: ${guild.name} | Error creating embed: ${err.message}`, 'error');
        // TODO: Add error logging for failed embed creation
        return;
    });
};