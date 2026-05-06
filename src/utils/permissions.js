import { ChatInputCommandInteraction, GuildMember, GuildChannel, ThreadChannel, PermissionsBitField } from 'discord.js';
import Client from '../core/client.js'
import { LogData } from './logger.js';
import { ENV } from '../core/env.js';
/**
 * Checks if a user/bot has the required permissions in a channel
 *
 * @param {ChatInputCommandInteraction | GuildChannel | ThreadChannel} interactionChannel - Interaction or Channel to check permissions in
 * @param {Array<string>} permissions - Array of permission names to check
 * @param {GuildMember | Client} member - GuildMember or Client to check permissions for
 * @returns {[boolean, string[]?]} Array with boolean success flag and optional array of missing permissions
 * @throws {Error} If invalid parameters are provided
 */

function PermissionCheck(interaction, permissions, member) {
    if (!interaction || !permissions) {
        throw new Error('Invalid parameters provided to PermissionCheck');
    }

    let channel, guild
    if(interaction instanceof ChatInputCommandInteraction) {
        channel = interaction.channel;
        guild = interaction.guild;
    } else if (interaction instanceof GuildChannel || interaction instanceof ThreadChannel) {
        channel = interaction;
        guild = interaction.guild;
    } else {
        throw new Error('Invalid interaction/channel provided to PermissionCheck');
    }

    let userPermissions
    if (member instanceof GuildMember) {
        userPermissions = member.permissionsIn(channel);
    } else if (member instanceof Client) {
        if(!guild) throw new Error('Guild context is required to check client permissions');
        userPermissions = guild.members.me.permissionsIn(channel);
    } else {
        throw new Error('Invalid member/client provided to PermissionCheck');
    }

    const missingPermissions = permissions
        .filter((permission) => !userPermissions.has(permission))
        .map((permission) => new PermissionsBitField(permission).toArray());
    return missingPermissions.length > 0 ? [false, missingPermissions] : [true];
};

/**
 * Checks if a user ID belongs to a bot developer
 *
 * @param {string} userId - The Discord user ID to check
 * @returns {boolean} True if the user is a developer, false otherwise
 */
function DevPermissionCheck(userId) {
    if (ENV.DEVELOPER_IDS.length === 0) {
        LogData('Developer Permission Check', 'No developer IDs defined in environment variables.', 'warning');
        return false;
    }

    return ENV.DEVELOPER_IDS.includes(userId);
}

export { PermissionCheck, DevPermissionCheck };