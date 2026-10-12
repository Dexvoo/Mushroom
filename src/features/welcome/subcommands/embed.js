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
    const embed = options.getBoolean('enabled', true);
    const titleOption = options.getString('title');

    /** @type {Partial<import('../models/welcome.js').WelcomeMessageType>} */
    const updates = { embed };
    // Left out keeps the current title; "none" removes it
    if (titleOption !== null) {
        const title = commandText(titleOption).replaceAll('\n', ' ');
        updates.title = title && title.toLowerCase() !== 'none' ? title : null;
    }
    await saveMessageSettings(guild.id, kind, updates);

    return client.utils.Embed(
        interaction,
        'Brand',
        label,
        translate(embed ? 'embed_on' : 'embed_off', { command: `/${kind} test` }),
        { flags: MessageFlags.Ephemeral }
    );
}
