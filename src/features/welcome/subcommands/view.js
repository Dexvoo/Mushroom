import { MessageFlags } from 'discord.js';
import Welcome_Cache from '../cache/welcome.cache.js';
import { DEFAULT_MESSAGES } from '../utils/welcomeMessage.js';
import { canManage } from '../../../shared/utils/commandChecks.js';

/**
 * @param {import('discord.js').ChatInputCommandInteraction<'cached'>} interaction
 * @param {'welcome' | 'goodbye'} kind
 */
export async function execute(interaction, kind) {
    const { client, guild, locale } = interaction;
    if (!(await canManage(interaction))) return;

    const translate = (name, args = {}) => client.utils.Translate(`commands.welcome.${name}`, locale, args);
    const settings = (await Welcome_Cache.get(guild.id))[kind];
    const onOff = (value) => (value ? client.customEmojis.reactions.Yes : client.customEmojis.reactions.No);
    // Shown as code so placeholders and formatting are visible as typed
    const asCode = (text) => `\`\`\`\n${text.replaceAll('```', "'''")}\n\`\`\``;

    return client.utils.Embed(interaction, 'Brand', translate(`label_${kind}`), '', {
        fields: [
            { name: translate('field_enabled'), value: onOff(settings.enabled), inline: true },
            {
                name: translate('field_channel'),
                value: settings.channelId ? `<#${settings.channelId}>` : translate('not_set'),
                inline: true,
            },
            { name: translate('field_embed'), value: onOff(settings.embed), inline: true },
            settings.embed && settings.title && { name: translate('field_title'), value: asCode(settings.title) },
            {
                name: settings.message ? translate('field_message') : translate('field_message_default'),
                value: asCode(settings.message ?? DEFAULT_MESSAGES[kind]),
            },
        ].filter(Boolean),
        flags: MessageFlags.Ephemeral,
    });
}
