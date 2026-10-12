import {
    SlashCommandBuilder,
    InteractionContextType,
    ApplicationIntegrationType,
    PermissionFlagsBits,
    ChannelType,
    PermissionsBitField,
} from 'discord.js';
import Welcome_Cache from '../cache/welcome.cache.js';
import { WELCOME_LIMITS } from '../../../dashboard/validation.js';

/** Subcommands that change settings, recorded in the dashboard's Web Logs */
export const AUDITED_SUBCOMMANDS = new Set(['channel', 'toggle', 'message', 'embed']);

/** What the bot needs in the channel to post welcome and goodbye messages. */
export const POST_PERMISSIONS = new PermissionsBitField([
    PermissionFlagsBits.ViewChannel,
    PermissionFlagsBits.SendMessages,
    PermissionFlagsBits.EmbedLinks,
]);

/**
 * The /welcome and /goodbye commands have the same subcommands.
 * @param {'welcome' | 'goodbye'} kind
 */
export function buildWelcomeCommand(kind) {
    const noun = kind === 'welcome' ? 'welcome' : 'goodbye';
    const when = kind === 'welcome' ? 'people join' : 'people leave';

    return new SlashCommandBuilder()
        .setName(kind)
        .setDescription(`The message posted when ${when}.`)
        .setIntegrationTypes([ApplicationIntegrationType.GuildInstall])
        .setContexts([InteractionContextType.Guild])
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addSubcommand((s) =>
            s
                .setName('channel')
                .setDescription(`Choose where ${noun} messages are posted.`)
                .addChannelOption((o) =>
                    o
                        .setName('channel')
                        .setDescription('The channel to post in')
                        .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
                        .setRequired(true)
                )
        )
        .addSubcommand((s) =>
            s
                .setName('toggle')
                .setDescription(`Turn ${noun} messages on or off.`)
                .addBooleanOption((o) =>
                    o.setName('enabled').setDescription(`True to post ${noun} messages`).setRequired(true)
                )
        )
        .addSubcommand((s) =>
            s
                .setName('message')
                .setDescription(`Set the ${noun} text. Leave it out to go back to the default.`)
                .addStringOption((o) =>
                    o
                        .setName('text')
                        .setDescription(
                            'Use {user} {username} {displayName} {server} {memberCount}, and \\n for a new line'
                        )
                        .setMaxLength(WELCOME_LIMITS.MESSAGE_MAX)
                        .setRequired(false)
                )
        )
        .addSubcommand((s) =>
            s
                .setName('embed')
                .setDescription(`Send the ${noun} message inside an embed.`)
                .addBooleanOption((o) => o.setName('enabled').setDescription('True to use an embed').setRequired(true))
                .addStringOption((o) =>
                    o
                        .setName('title')
                        .setDescription('Embed title (placeholders work). Type "none" to remove it.')
                        .setMaxLength(WELCOME_LIMITS.TITLE_MAX)
                        .setRequired(false)
                )
        )
        .addSubcommand((s) => s.setName('test').setDescription(`Preview the ${noun} message (only you can see it).`))
        .addSubcommand((s) => s.setName('view').setDescription(`Show the ${noun} message settings.`));
}

/**
 * Saves changes to one message (welcome or goodbye), keeping the rest of its settings.
 * @param {string} guildId
 * @param {'welcome' | 'goodbye'} kind
 * @param {Partial<import('../models/welcome.js').WelcomeMessageType>} updates - Must already be checked
 */
export async function saveMessageSettings(guildId, kind, updates) {
    const config = await Welcome_Cache.get(guildId);
    const saved = await Welcome_Cache.set(guildId, {
        [kind]: { ...Welcome_Cache.defaultMessage(), ...config[kind], ...updates },
    });
    return saved[kind];
}

/**
 * Text typed into a slash command option, where new lines can't be typed: "\n" becomes a new line.
 * @param {string} text
 */
export function commandText(text) {
    return text.replaceAll('\\n', '\n').trim();
}
