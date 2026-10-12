import { MessageFlags } from 'discord.js';
import { StreamSubscription } from '../models/streamSubscription.js';
import { PLATFORMS } from '../utils/notification.js';
import { canManage, replyError } from '../../../shared/utils/commandChecks.js';

const SUBSCRIPTION_ID = /^[a-f\d]{24}$/i;

/**
 * @param {import('discord.js').ChatInputCommandInteraction<'cached'>} interaction
 */
export async function execute(interaction) {
    const { client, options, guild, locale } = interaction;
    if (!(await canManage(interaction))) return;
    const t = (key, args = {}) => client.utils.Translate(`commands.streams.${key}`, locale, args);

    // Autocomplete fills in the ID; someone typing a name instead is matched by name
    const value = options.getString('streamer', true).trim();
    const filter = SUBSCRIPTION_ID.test(value)
        ? { _id: value, guildId: guild.id }
        : { guildId: guild.id, displayName: new RegExp(`^${value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') };

    const removed = await StreamSubscription.findOneAndDelete(filter).lean();
    if (!removed) return replyError(interaction, t('not_followed'));

    return client.utils.Embed(
        interaction,
        'Brand',
        t('title'),
        t('removed', { name: removed.displayName, platform: PLATFORMS[removed.platform].name }),
        { flags: MessageFlags.Ephemeral }
    );
}
