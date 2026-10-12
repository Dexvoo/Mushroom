import { MessageFlags, PermissionFlagsBits } from 'discord.js';

/**
 * Checks the user can manage the server (the dashboard requires the same for settings).
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
 * A private error reply.
 * @param {import('discord.js').ChatInputCommandInteraction<'cached'>} interaction
 * @param {string} message
 */
export function replyError(interaction, message) {
    const { client, locale } = interaction;
    return client.utils.Embed(interaction, 'Red', client.utils.Translate('errors.title', locale), message, {
        flags: MessageFlags.Ephemeral,
    });
}
