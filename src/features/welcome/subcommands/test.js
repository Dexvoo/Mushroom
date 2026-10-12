import { MessageFlags } from 'discord.js';
import Welcome_Cache from '../cache/welcome.cache.js';
import { buildMessage } from '../utils/welcomeMessage.js';
import { brandColour } from '../../../shared/cache/guildSettings.cache.js';
import { canManage } from '../../../shared/utils/commandChecks.js';

/**
 * Shows the message exactly as it would be posted, with the person running the command as the member.
 * The reply is private, so nothing is posted in the channel.
 * @param {import('discord.js').ChatInputCommandInteraction<'cached'>} interaction
 * @param {'welcome' | 'goodbye'} kind
 */
export async function execute(interaction, kind) {
    const { client, guild, member, locale } = interaction;
    if (!(await canManage(interaction))) return;

    const settings = (await Welcome_Cache.get(guild.id))[kind];
    const message = buildMessage(kind, settings, member, await brandColour(guild.id));

    const notes = [client.utils.Translate('commands.welcome.test_note', locale)];
    if (!settings.enabled || !settings.channelId) {
        notes.push(client.utils.Translate('commands.welcome.test_off', locale, { command: `/${kind}` }));
    }

    // The notes go above the message as small text; a message already at Discord's limit is cut to make room
    const content = [notes.map((note) => `-# ${note}`).join('\n'), message.content].filter(Boolean).join('\n');

    // Nobody is pinged by a preview
    await interaction.reply({
        content: content.length > 2000 ? `${content.slice(0, 1999)}…` : content,
        embeds: message.embeds,
        allowedMentions: { parse: [] },
        flags: MessageFlags.Ephemeral,
    });
}
