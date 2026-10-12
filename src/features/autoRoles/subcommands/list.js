import { MessageFlags, PermissionFlagsBits } from 'discord.js';
import Auto_Roles_Cache from '../cache/autoRoles.cache.js';
import { splitAssignableRoles } from '../utils/assignAutoRoles.js';
import { canManage } from '../utils/commandHelpers.js';

/**
 * @param {import('discord.js').ChatInputCommandInteraction<'cached'>} interaction
 */
export async function execute(interaction) {
    const { client, guild, locale } = interaction;
    if (!(await canManage(interaction))) return;

    const translate = (name, args = {}) => client.utils.Translate(`commands.autorole.${name}`, locale, args);
    const config = await Auto_Roles_Cache.get(guild.id);

    // Roles the bot can't give any more are marked, so they can be fixed or removed
    const describe = (roleIds = []) => {
        if (roleIds.length === 0) return translate('none');
        const { unusable } = splitAssignableRoles(guild, roleIds);
        return roleIds
            .map((id) => {
                if (!guild.roles.cache.has(id)) return translate('deleted_role');
                return unusable.includes(id) ? `<@&${id}> (${translate('cannot_give')})` : `<@&${id}>`;
            })
            .join('\n');
    };

    const notes = [];
    if (!config.enabled) notes.push(translate('currently_off'));
    if (!guild.members.me?.permissions.has(PermissionFlagsBits.ManageRoles)) {
        notes.push(translate('missing_manage_roles'));
    }

    return client.utils.Embed(interaction, 'Brand', translate('list_title'), notes.join('\n\n'), {
        fields: [
            { name: translate('members_field'), value: describe(config.humanRoleIds), inline: true },
            { name: translate('bots_field'), value: describe(config.botRoleIds), inline: true },
        ],
        flags: MessageFlags.Ephemeral,
    });
}
