import { MessageFlags, PermissionFlagsBits } from 'discord.js';
import { AUTO_ROLES_MAX } from '../../../dashboard/validation.js';

/** The config key for each `type` option of /autorole. */
export const LIST_KEYS = Object.freeze({ members: 'humanRoleIds', bots: 'botRoleIds' });

/** Same limit as the dashboard. */
export { AUTO_ROLES_MAX };

/**
 * Checks the user can manage the server (the dashboard requires the same).
 * Replies with an error and returns false if not.
 * @param {import('discord.js').ChatInputCommandInteraction<'cached'>} interaction
 * @returns {Promise<boolean>}
 */
export async function canManage(interaction) {
    const { client, member, locale } = interaction;
    const [hasPerms, missingPerms] = await client.utils.PermissionCheck(
        interaction,
        [PermissionFlagsBits.ManageGuild],
        member
    );
    if (hasPerms) return true;

    await replyError(
        interaction,
        client.utils.Translate('errors.user_missing_perms', locale, { perms: missingPerms.flat().join(', ') })
    );
    return false;
}

/**
 * Why the bot can't give a role, or null if it can. Same rules as the dashboard.
 * @param {import('discord.js').Role} role
 * @param {string} locale
 * @returns {string | null}
 */
export function roleProblem(role, locale) {
    const { client, guild } = role;
    const translate = (key) => client.utils.Translate(`commands.autorole.${key}`, locale, { role: role.toString() });
    if (role.id === guild.id) return translate('everyone');
    if (role.managed) return translate('managed');
    if (role.position >= (guild.members.me?.roles.highest.position ?? 0)) return translate('too_high');
    return null;
}

/**
 * @param {import('discord.js').ChatInputCommandInteraction<'cached'>} interaction
 * @param {string} message
 */
export function replyError(interaction, message) {
    const { client, locale } = interaction;
    return client.utils.Embed(interaction, 'Red', client.utils.Translate('errors.title', locale), message, {
        flags: MessageFlags.Ephemeral,
    });
}
