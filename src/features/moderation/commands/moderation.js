import {
    SlashCommandBuilder,
    InteractionContextType,
    ApplicationIntegrationType,
    PermissionFlagsBits,
    MessageFlags,
} from 'discord.js';
import { parseDuration, formatDuration, MIN_MUTE_MS, MAX_MUTE_MS, REASON_MAX } from '../utils/checks.js';

const handlers = {
    ban: () => import('../subcommands/ban.js'),
    unban: () => import('../subcommands/unban.js'),
    kick: () => import('../subcommands/kick.js'),
    mute: () => import('../subcommands/mute.js'),
    unmute: () => import('../subcommands/unmute.js'),
    purge: () => import('../subcommands/purge.js'),
    nickname: () => import('../subcommands/nickname.js'),
    warn: () => import('../subcommands/warn.js'),
    unwarn: () => import('../subcommands/unwarn.js'),
    history: () => import('../subcommands/history.js'),
};

const reasonOption = (o) => o.setName('reason').setDescription('Why (shown in the audit log)').setMaxLength(REASON_MAX);

export const commandData = new SlashCommandBuilder();
commandData.setName('moderation');
commandData.setDescription('Ban, kick, mute, warn, purge and more.');
commandData.setIntegrationTypes([ApplicationIntegrationType.GuildInstall]);
commandData.setContexts([InteractionContextType.Guild]);
// Shown to members who can time people out; server admins can change this under Server Settings > Integrations.
// Each action still checks its own permission (Ban Members, Kick Members…) for the moderator and for Ovx.
commandData.setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers);
commandData.addSubcommand((s) =>
    s
        .setName('ban')
        .setDescription('Ban someone, even if they already left the server.')
        .addUserOption((o) => o.setName('user').setDescription('Who to ban (or paste their ID)').setRequired(true))
        .addStringOption(reasonOption)
        .addIntegerOption((o) =>
            o
                .setName('delete-messages')
                .setDescription('Also delete their recent messages')
                .addChoices(
                    { name: "Don't delete any", value: 0 },
                    { name: 'Last hour', value: 3600 },
                    { name: 'Last 24 hours', value: 86_400 },
                    { name: 'Last 7 days', value: 604_800 }
                )
        )
);
commandData.addSubcommand((s) =>
    s
        .setName('unban')
        .setDescription('Unban someone.')
        .addUserOption((o) => o.setName('user').setDescription('Who to unban (paste their ID)').setRequired(true))
        .addStringOption(reasonOption)
);
commandData.addSubcommand((s) =>
    s
        .setName('kick')
        .setDescription('Kick someone from the server.')
        .addUserOption((o) => o.setName('user').setDescription('Who to kick').setRequired(true))
        .addStringOption(reasonOption)
);
commandData.addSubcommand((s) =>
    s
        .setName('mute')
        .setDescription('Time someone out so they cannot talk.')
        .addUserOption((o) => o.setName('user').setDescription('Who to mute').setRequired(true))
        .addStringOption((o) =>
            o
                .setName('duration')
                .setDescription('How long, e.g. 10m, 1h, 2d (up to 28 days)')
                .setMaxLength(40)
                .setAutocomplete(true)
                .setRequired(true)
        )
        .addStringOption(reasonOption)
);
commandData.addSubcommand((s) =>
    s
        .setName('unmute')
        .setDescription("End someone's timeout.")
        .addUserOption((o) => o.setName('user').setDescription('Who to unmute').setRequired(true))
        .addStringOption(reasonOption)
);
commandData.addSubcommand((s) =>
    s
        .setName('purge')
        .setDescription('Delete recent messages in this channel. Pinned messages are kept.')
        .addIntegerOption((o) =>
            o.setName('amount').setDescription('How many (1-100)').setMinValue(1).setMaxValue(100).setRequired(true)
        )
        .addUserOption((o) => o.setName('user').setDescription("Only delete this person's messages"))
);
commandData.addSubcommand((s) =>
    s
        .setName('nickname')
        .setDescription("Change someone's nickname, or leave it empty to reset it.")
        .addUserOption((o) => o.setName('user').setDescription('Whose nickname').setRequired(true))
        .addStringOption((o) => o.setName('nickname').setDescription('The new nickname').setMaxLength(32))
);

commandData.addSubcommand((s) =>
    s
        .setName('warn')
        .setDescription('Warn someone. It goes on their record and they get a message saying why.')
        .addUserOption((o) => o.setName('user').setDescription('Who to warn').setRequired(true))
        .addStringOption((o) =>
            o.setName('reason').setDescription('Why they are being warned').setMaxLength(REASON_MAX).setRequired(true)
        )
);
commandData.addSubcommand((s) =>
    s
        .setName('unwarn')
        .setDescription('Remove a warning, e.g. one given by mistake.')
        .addIntegerOption((o) =>
            o
                .setName('case')
                .setDescription('The case number of the warning (see history)')
                .setMinValue(1)
                .setRequired(true)
        )
);
commandData.addSubcommand((s) =>
    s
        .setName('history')
        .setDescription("See someone's warnings, mutes, kicks and bans.")
        .addUserOption((o) => o.setName('user').setDescription('Whose history (or paste their ID)').setRequired(true))
);

export const meta = {
    cooldown: 3,
    developerOnly: false,
    botPermissions: [],
    userPermissions: [],
};

const DURATION_SUGGESTIONS = ['60s', '5m', '10m', '1h', '6h', '1d', '1w'];

/**
 * Suggests mute lengths, and shows how a typed one is understood ("1h30m" → "1 hour 30 minutes").
 * @param {import('discord.js').AutocompleteInteraction} interaction
 */
export async function autocomplete(interaction) {
    const typed = String(interaction.options.getFocused()).trim();
    const choices = [];

    const parsed = typed ? parseDuration(typed) : null;
    if (parsed !== null && parsed >= MIN_MUTE_MS && parsed <= MAX_MUTE_MS) {
        choices.push({ name: formatDuration(parsed), value: typed.slice(0, 100) });
    }
    for (const value of DURATION_SUGGESTIONS) {
        const name = formatDuration(/** @type {number} */ (parseDuration(value)));
        if (choices.some((choice) => choice.name === name)) continue;
        if (!typed || name.includes(typed.toLowerCase()) || value.startsWith(typed.toLowerCase())) {
            choices.push({ name, value });
        }
    }
    await interaction.respond(choices.slice(0, 25));
}

/**
 * @param {import('discord.js').ChatInputCommandInteraction<'cached'>} interaction
 */
export async function execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    const handler = handlers[subcommand];
    if (!handler)
        return interaction.client.utils.Embed(
            interaction,
            'Red',
            interaction.client.utils.Translate('errors.title', interaction.locale),
            interaction.client.utils.Translate('errors.no_subcommand', interaction.locale, { subcommand }),
            { flags: MessageFlags.Ephemeral }
        );

    // Errors propagate to the slash command handler, which logs them and replies to the user
    const handlerModule = await handler();
    return handlerModule.execute(interaction);
}
