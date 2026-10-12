import { MessageFlags } from 'discord.js';
import Auto_Roles_Cache from '../cache/autoRoles.cache.js';
import { canManage } from '../utils/commandHelpers.js';

/**
 * @param {import('discord.js').ChatInputCommandInteraction<'cached'>} interaction
 */
export async function execute(interaction) {
    const { client, options, guild, locale } = interaction;
    if (!(await canManage(interaction))) return;

    const enabled = options.getBoolean('enabled', true);
    await Auto_Roles_Cache.set(guild.id, { enabled });

    return client.utils.Embed(
        interaction,
        'Brand',
        client.utils.Translate('commands.autorole.title', locale),
        client.utils.Translate(enabled ? 'commands.autorole.enabled' : 'commands.autorole.disabled', locale),
        { flags: MessageFlags.Ephemeral }
    );
}
