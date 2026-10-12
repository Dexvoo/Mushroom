import { MessageFlags } from 'discord.js';
import Ticket_Config_Cache from '../cache/ticketConfig.cache.js';
import { postPanel } from '../utils/panel.js';
import { canManage, replyError } from '../../../shared/utils/commandChecks.js';

/**
 * @param {import('discord.js').ChatInputCommandInteraction<'cached'>} interaction
 */
export async function execute(interaction) {
    const { client, options, guild, locale } = interaction;
    if (!(await canManage(interaction))) return;
    const t = (key, args = {}) => client.utils.Translate(`tickets.${key}`, locale, args);

    const channel = options.getChannel('channel', true);
    const result = /** @type {any} */ (await postPanel(guild, channel.id));
    if (!result.ok) {
        return replyError(
            interaction,
            result.reason === 'bot_permissions'
                ? t('panel_bot_permissions', { channel: channel.toString(), perms: result.missing.join(', ') })
                : t('panel_no_channel')
        );
    }

    const lines = [t(result.updated ? 'panel_updated' : 'panel_posted', { url: result.messageUrl })];
    if (!(await Ticket_Config_Cache.get(guild.id)).enabled) lines.push(t('currently_off'));
    return client.utils.Embed(interaction, 'Brand', t('title'), lines.join('\n\n'), { flags: MessageFlags.Ephemeral });
}
