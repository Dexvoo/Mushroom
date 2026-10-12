import {
    SlashCommandBuilder,
    InteractionContextType,
    ApplicationIntegrationType,
    PermissionFlagsBits,
    ChannelType,
    MessageFlags,
} from 'discord.js';
import { StreamSubscription } from '../models/streamSubscription.js';
import { listSubscriptions } from '../utils/subscriptions.js';
import { withCommandAudit } from '../../../dashboard/commandAudit.js';
import { describeStreamChanges } from '../../../dashboard/describeChanges.js';
import { nameLookup } from '../../../dashboard/settingsViews.js';

const platformChoices = [
    { name: 'Twitch', value: 'twitch' },
    { name: 'YouTube', value: 'youtube' },
    { name: 'Kick', value: 'kick' },
];

const handlers = {
    add: () => import('../subcommands/add.js'),
    remove: () => import('../subcommands/remove.js'),
    list: () => import('../subcommands/list.js'),
};

export const commandData = new SlashCommandBuilder();
commandData.setName('streams');
commandData.setDescription('Post in Discord when streamers go live or upload.');
commandData.setIntegrationTypes([ApplicationIntegrationType.GuildInstall]);
commandData.setContexts([InteractionContextType.Guild]);
commandData.setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild);
commandData.addSubcommand((s) =>
    s
        .setName('add')
        .setDescription('Follow a streamer or channel.')
        .addStringOption((o) =>
            o.setName('platform').setDescription('Where they stream').setRequired(true).addChoices(platformChoices)
        )
        .addStringOption((o) =>
            o.setName('account').setDescription('Username, @handle or link').setMaxLength(100).setRequired(true)
        )
        .addChannelOption((o) =>
            o
                .setName('channel')
                .setDescription('Where to post notifications')
                .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
                .setRequired(true)
        )
        .addRoleOption((o) => o.setName('ping').setDescription('A role to ping (choose @everyone to ping everyone)'))
);
commandData.addSubcommand((s) =>
    s
        .setName('remove')
        .setDescription('Stop following a streamer or channel.')
        .addStringOption((o) =>
            o.setName('streamer').setDescription('Who to unfollow').setAutocomplete(true).setRequired(true)
        )
);
commandData.addSubcommand((s) => s.setName('list').setDescription('Show who this server follows.'));

export const meta = {
    cooldown: 5,
    developerOnly: false,
    botPermissions: [],
    userPermissions: [],
};

// Subcommands that change settings, recorded in the dashboard's Web Logs
const AUDITED = new Set(['add', 'remove']);

/**
 * Suggests the streamers this server follows, for /streams remove.
 * @param {import('discord.js').AutocompleteInteraction} interaction
 */
export async function autocomplete(interaction) {
    if (!interaction.guildId) return interaction.respond([]);
    const typed = interaction.options.getFocused().toLowerCase();
    const subscriptions = await StreamSubscription.find({ guildId: interaction.guildId }).lean();
    const names = { twitch: 'Twitch', youtube: 'YouTube', kick: 'Kick' };
    await interaction.respond(
        subscriptions
            .filter((s) => s.displayName.toLowerCase().includes(typed))
            .slice(0, 25)
            .map((s) => ({ name: `${s.displayName} (${names[s.platform]})`.slice(0, 100), value: String(s._id) }))
    );
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
    const run = () => handlerModule.execute(interaction);

    if (!AUDITED.has(subcommand)) return run();
    await withCommandAudit(
        interaction,
        {
            action: 'Updated stream notifications',
            snapshot: () => listSubscriptions(interaction.guildId),
            describe: (before, after, guild) => describeStreamChanges(before, after, nameLookup(guild)),
        },
        run
    );
}
