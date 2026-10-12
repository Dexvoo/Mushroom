import { MessageFlags } from 'discord.js';
import Auto_Roles_Cache from '../cache/autoRoles.cache.js';
import { LIST_KEYS, canManage, replyError } from '../utils/commandHelpers.js';

/**
 * @param {import('discord.js').ChatInputCommandInteraction<'cached'>} interaction
 */
export async function execute(interaction) {
    const { client, options, guild, locale } = interaction;
    if (!(await canManage(interaction))) return;

    const type = /** @type {keyof typeof LIST_KEYS} */ (options.getString('type', true));
    const role = options.getRole('role', true);
    const key = LIST_KEYS[type];
    const translate = (name, args = {}) => client.utils.Translate(`commands.autorole.${name}`, locale, args);

    const config = await Auto_Roles_Cache.get(guild.id);
    const roleIds = config[key] ?? [];
    if (!roleIds.includes(role.id)) {
        return replyError(interaction, translate(`not_in_${type}`, { role: role.toString() }));
    }

    await Auto_Roles_Cache.set(guild.id, { [key]: roleIds.filter((id) => id !== role.id) });
    return client.utils.Embed(
        interaction,
        'Brand',
        translate('title'),
        translate(`removed_${type}`, { role: role.toString() }),
        { flags: MessageFlags.Ephemeral }
    );
}
