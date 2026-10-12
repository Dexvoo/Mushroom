import { AUTO_ROLES_MAX } from '../../../dashboard/validation.js';

export { canManage, replyError } from '../../../shared/utils/commandChecks.js';

/** The config key for each `type` option of /autorole. */
export const LIST_KEYS = Object.freeze({ members: 'humanRoleIds', bots: 'botRoleIds' });

/** Same limit as the dashboard. */
export { AUTO_ROLES_MAX };

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
