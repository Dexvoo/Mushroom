import { PermissionsBitField, PermissionFlagsBits, OAuth2Scopes } from 'discord.js';

/** Ovx's support server. The dashboard's front end has its own copy (public/landing.js), which must match. */
export const SUPPORT_URL = 'https://discord.gg/t7tF2Qs3Qc';

// What the bot needs for its features; used in "Add to server" links. Server admins can untick any of them.
export const BOT_PERMISSIONS = new PermissionsBitField([
    PermissionFlagsBits.ViewChannel,
    PermissionFlagsBits.SendMessages,
    PermissionFlagsBits.EmbedLinks,
    PermissionFlagsBits.AttachFiles,
    PermissionFlagsBits.ReadMessageHistory,
    PermissionFlagsBits.ManageRoles, // Level rewards, auto roles, ticket access
    PermissionFlagsBits.ViewAuditLog, // Who did what, in logs
    PermissionFlagsBits.ManageChannels, // Ticket channels
    PermissionFlagsBits.ManageMessages, // /moderation purge
    PermissionFlagsBits.ManageNicknames, // /moderation nickname
    PermissionFlagsBits.KickMembers,
    PermissionFlagsBits.BanMembers,
    PermissionFlagsBits.ModerateMembers, // /moderation mute
    PermissionFlagsBits.ChangeNickname, // Bot Settings nickname
    PermissionFlagsBits.ManageGuildExpressions, // /emoji and /sticker
]).bitfield.toString();

/**
 * The "Add to server" link. Without a guildId, Discord asks which server to add the bot to.
 * @param {string} applicationId
 * @param {string} [guildId]
 */
export function inviteUrl(applicationId, guildId) {
    const params = new URLSearchParams({
        client_id: applicationId,
        scope: [OAuth2Scopes.Bot, OAuth2Scopes.ApplicationsCommands].join(' '),
        permissions: BOT_PERMISSIONS,
        ...(guildId && { guild_id: guildId, disable_guild_select: 'true' }),
    });
    return `https://discord.com/oauth2/authorize?${params}`;
}
