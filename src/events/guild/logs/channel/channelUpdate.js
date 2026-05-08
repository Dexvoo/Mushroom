import { Events, PermissionFlagsBits, AuditLogEvent, GuildChannel, ChannelType, PermissionsBitField, PermissionOverwrites } from 'discord.js';
import Logs_Cache from '../../../../constants/cache/logs.js';
import Client from '../../../../core/client.js';

export const name = Events.ChannelUpdate;
export const once = false;
export const description = 'Guild Channel Update Logs';

/**
 * @param {GuildChannel & { client: Client }} oldChannel
 * @param {GuildChannel & { client: Client }} newChannel
 */

export async function execute(oldChannel, newChannel) {
    const { client, guild, user } = newChannel;

    if (!guild) return;
    
    const logsData = await Logs_Cache.get(guild.id);
    if(!logsData?.channel?.enabled || !logsData?.channel?.channelId) return client.utils.LogData('Channel Update', `Guild: ${guild.name} | Disabled`, 'warning');

    if (logsData.ignoredChannels?.includes(newChannel.id)) return;
    
    const logChannel = guild.channels.cache.get(logsData.member.channelId);
    if(!logChannel) {
        await Logs_Cache.setType(guild.id, 'channel', { enabled: false, channelId: null });
        return client.utils.LogData('Channel Update', `Guild: ${guild.name} | Log channel not found, disabling logs`, 'error');
    };

    const botPermissions = [ PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.EmbedLinks ];
    const [ hasPermissions, missingPermissions ] = client.utils.PermissionCheck(logChannel, botPermissions, guild.members.me);
    if(!hasPermissions) {
        await Logs_Cache.setType(guild.id, 'channel', { enabled: false, channelId: null });
        return client.utils.LogData('Channel Update', `Guild: ${guild.name} | Missing permissions in log channel, disabling logs. Missing perms: ${missingPermissions.flat().join(', ')}`, 'error');
    }


    let executor = null;
    let username = 'Unknown';
    if(guild.members.me.permissions.has(PermissionFlagsBits.ViewAuditLog)) {
        
        // Waiting for discord push to audit logs
        await new Promise(resolve => setTimeout(resolve, 1500));

        const fetchedLogs = await guild.fetchAuditLogs({
            limit: 5,
            type: AuditLogEvent.ChannelUpdate
        });

        const deletionLog = fetchedLogs.entries.find(entry => entry.target?.id === newChannel.id && Date.now() - entry.createdTimestamp < 5000);

        if(deletionLog) {
            executor = deletionLog.executor;
            username = deletionLog.executor.username;
        } 
    }

    let description = '';
    if (oldChannel.name !== newChannel.name) {
        description += `**Name:** \`${oldChannel.name}\` → \`${newChannel.name}\`\n`;
    }

    if (oldChannel.type !== newChannel.type) {
        description += `**Type:** \`${ChannelType[oldChannel.type] || 'Unknown'}\` → \`${ChannelType[newChannel.type] || 'Unknown'}\`\n`;
    }

    if (oldChannel.topic !== newChannel.topic) {
        const oldTopic = oldChannel.topic ? client.utils.Truncate(oldChannel.topic, 100) : 'None';
        const newTopic = newChannel.topic ? client.utils.Truncate(newChannel.topic, 100) : 'None';
        description += `**Topic:** \`${oldTopic}\` → \`${newTopic}\`\n`;
    }

    if (oldChannel.nsfw !== newChannel.nsfw) {
        description += `**NSFW:** \`${oldChannel.nsfw ? 'Yes' : 'No'}\` → \`${newChannel.nsfw ? 'Yes' : 'No'}\`\n`;
    }

    if (oldChannel.rateLimitPerUser !== newChannel.rateLimitPerUser) {
        description += `**Slowmode:** \`${oldChannel.rateLimitPerUser || 0}s\` → \`${newChannel.rateLimitPerUser || 0}s\`\n`;
    }

    if (oldChannel.bitrate !== newChannel.bitrate) {
        description += `**Bitrate:** \`${(oldChannel.bitrate || 0) / 1000}kbps\` → \`${(newChannel.bitrate || 0) / 1000}kbps\`\n`;
    }

    if (oldChannel.userLimit !== newChannel.userLimit) {
        const oldLimit = oldChannel.userLimit === 0 || !oldChannel.userLimit ? 'Unlimited' : oldChannel.userLimit;
        const newLimit = newChannel.userLimit === 0 || !newChannel.userLimit ? 'Unlimited' : newChannel.userLimit;
        description += `**User Limit:** \`${oldLimit}\` → \`${newLimit}\`\n`;
    }

    if (oldChannel.parentId !== newChannel.parentId) {
        const oldParent = oldChannel.parentId ? `<#${oldChannel.parentId}>` : 'None';
        const newParent = newChannel.parentId ? `<#${newChannel.parentId}>` : 'None';
        description += `**Category:** ${oldParent} → ${newParent}\n`;
    }

    const oldPerms = oldChannel.permissionOverwrites.cache;
    const newPerms = newChannel.permissionOverwrites.cache;
    let permChanges = '';

    newPerms.forEach((perm, id) => {
        const old = oldPerms.get(id);
        const target = perm.type === 0 ? `<@&${id}>` : `<@${id}>`; // 0 is Role, 1 is Member

        if (!old) {
            permChanges += `**Added for ${target}:**\n${formatPermissions(perm)}\n`;
            return;
        }

        const diff = comparePermissionDiff(old, perm);
        if (diff) {
            permChanges += `**Updated for ${target}:**\n${diff}\n`;
        }
    });

    oldPerms.forEach((perm, id) => {
        if (!newPerms.has(id)) {
            const target = perm.type === 0 ? `<@&${id}>` : `<@${id}>`;
            permChanges += `**Removed for ${target}:**\n${formatPermissions(perm)}\n`;
        }
    });

    if (permChanges.length > 0) {
        // Use Truncate just in case a massive permission overhaul exceeds embed field limits
        description += `**Permission Overwrites:**\n${client.utils.Truncate(permChanges, 2000)}\n`;
    }

    if (description === '') return;

    const footerText = `CID: ${newChannel.id}`;
    const title = client.utils.Translate('logs.channelUpdate', guild.preferredLocale);
    
    return client.utils.Embed(logChannel, 'White', title, description, { timestamp: true, footer: { text: footerText }, author: executor }).catch((err) => {
        client.utils.LogData('Channel Update', `Guild: ${guild.name} | Error creating embed: ${err.message}`, 'error');
        // TODO: Add error logging for failed embed creation
        return;
    });
};



/**
 * Formats permission allow/deny fields into readable text.
 * @param {PermissionOverwrites} overwrite
 */
function formatPermissions(overwrite) {
    const allowed = new PermissionsBitField(overwrite.allow.bitfield).toArray();
    const denied = new PermissionsBitField(overwrite.deny.bitfield).toArray();
    const parts =[];
  
    if (allowed.length > 0) parts.push(`✅ **Allowed:** \`${allowed.join(', ')}\``);
    if (denied.length > 0) parts.push(`❌ **Denied:** \`${denied.join(', ')}\``);
  
    return parts.join('\n');
}
  
/**
 * Compares permission overwrites and returns a string of differences.
 * @param {PermissionOverwrites} oldPerm
 * @param {PermissionOverwrites} newPerm
 */
function comparePermissionDiff(oldPerm, newPerm) {
    const changes =[];
    const allPerms = Object.keys(PermissionsBitField.Flags);
  
    for (const perm of allPerms) {
        const oldAllowed = oldPerm.allow.has(perm);
        const oldDenied = oldPerm.deny.has(perm);
        const newAllowed = newPerm.allow.has(perm);
        const newDenied = newPerm.deny.has(perm);
  
        if (oldAllowed !== newAllowed || oldDenied !== newDenied) {
            if (newAllowed) {
                changes.push(`✅ \`${perm}\``);
            } else if (newDenied) {
                changes.push(`❌ \`${perm}\``);
            } else {
                changes.push(`⬜ \`${perm}\` (Reset)`);
            }
        }
    }
  
    return changes.length ? changes.join('\n') : null;
}