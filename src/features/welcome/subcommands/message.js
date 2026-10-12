import { MessageFlags } from 'discord.js';
import { saveMessageSettings, commandText } from '../utils/welcomeCommand.js';
import { canManage } from '../../../shared/utils/commandChecks.js';

/**
 * @param {import('discord.js').ChatInputCommandInteraction<'cached'>} interaction
 * @param {'welcome' | 'goodbye'} kind
 */
export async function execute(interaction, kind) {
    const { client, options, guild, locale } = interaction;
    if (!(await canManage(interaction))) return;

    const translate = (name, args = {}) => client.utils.Translate(`commands.welcome.${name}`, locale, args);
    const label = translate(`label_${kind}`);

    // Left out (or only spaces) goes back to the default text
    const text = commandText(options.getString('text') ?? '') || null;
    await saveMessageSettings(guild.id, kind, { message: text });

    return client.utils.Embed(
        interaction,
        'Brand',
        label,
        translate(text ? 'message_set' : 'message_reset', { command: `/${kind} test` }),
        { flags: MessageFlags.Ephemeral }
    );
}
