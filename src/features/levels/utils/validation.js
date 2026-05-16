import { GuildChannel, GuildMember, PermissionFlagsBits } from 'discord.js';
import Client from '../../../structures/extendedClient.js';
import User_Level_Cache from '../cache/userLevels.cache.js';
import Guild_Level_Cache from '../cache/guildLevels.cache.js';

/**
 * Performs all preliminary checks for granting XP.
 * @param { GuildMember & { client: Client }} member
 * @param { GuildChannel & { client: Client }} channelLevel - The channel where the event occurred.
 * @returns {Promise<{guildConfig: import('../models/guildLevels.js').LevelConfigType|null>}
 */
export async function ValidateXP(member, channelLevel) {
    const { guild, client } = member;

    const guildConfig = await Guild_Level_Cache.get(guild.id);
    if (!guildConfig?.enabled || !guildConfig.channelId) {
        if (guildConfig && !guildConfig.enabled) {
          client.utils.LogData('XP Pre-Check', `Guild: ${guild.name} | Levels disabled.`, 'warning');
        }
        return null;
    }

    const botPermissions = [ PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.EmbedLinks ];
    const [hasPerms] = client.utils.PermissionCheck(channelLevel, botPermissions, client);
    if (!hasPerms) {
        client.utils.LogData('XP Pre-Check', `Guild: ${guild.name} | Missing permissions in level-up channel, disabling`, 'error');
        await Guild_Level_Cache.setType(guild.id, 'enabled', false);
        return null;
    }

    if(isBlacklisted(member, channelLevel, guildConfig)) return null

    return { guildConfig };
}



/**
 * @param { GuildMember & { client: Client }} member
 * @param { GuildChannel & { client: Client }} channel
 * @param {import('../models/guildLevels.js').LevelConfigType} config
 * @returns {boolean}
 */
function isBlacklisted(member, channel, config) {
    const { client } = channel;
    if (!config.blacklisted) return false;

    const hasBlacklistedRole = config.blacklisted.roleIds?.some((roleId) => member.roles.cache.has(roleId));
    const isBlacklistedChannel = config.blacklisted.channelIds?.includes(channel.id);

    if (hasBlacklistedRole) {
      client.utils.LogData('XP Blacklist', `Guild: ${member.guild.name} | User: @${member.user.username} | Has blacklisted role`, 'info');
      return true;
    }

    if (isBlacklistedChannel) {
        client.utils.LogData('XP Blacklist', `Guild: ${member.guild.name} | Channel: #${channel.name} | Is a blacklisted channel`, 'info');
        return true;
    }

    return false;
}