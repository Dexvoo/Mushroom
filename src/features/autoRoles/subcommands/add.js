import { MessageFlags } from 'discord.js';
import Auto_Roles_Cache from '../cache/autoRoles.cache.js';
import { LIST_KEYS, AUTO_ROLES_MAX, canManage, roleProblem, replyError } from '../utils/commandHelpers.js';

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

    const problem = roleProblem(role, locale);
    if (problem) return replyError(interaction, problem);

    const config = await Auto_Roles_Cache.get(guild.id);
    const roleIds = config[key] ?? [];
    if (roleIds.includes(role.id)) {
        return replyError(interaction, translate(`already_${type}`, { role: role.toString() }));
    }
    if (roleIds.length >= AUTO_ROLES_MAX) {
        return replyError(interaction, translate('list_full', { max: AUTO_ROLES_MAX }));
    }

    const saved = await Auto_Roles_Cache.set(guild.id, { [key]: [...roleIds, role.id] });

    const description = [translate(`added_${type}`, { role: role.toString() })];
    if (!saved.enabled) description.push(translate('currently_off'));
    return client.utils.Embed(interaction, 'Brand', translate('title'), description.join('\n\n'), {
        flags: MessageFlags.Ephemeral,
    });
}
