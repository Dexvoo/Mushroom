import {
    SlashCommandBuilder,
    InteractionContextType,
    ApplicationIntegrationType,
    ChannelType,
    MessageFlags,
} from 'discord.js';
import Ticket_Config_Cache from '../cache/ticketConfig.cache.js';
import { withCommandAudit } from '../../../dashboard/commandAudit.js';
import { describeTicketChanges } from '../../../dashboard/describeChanges.js';
import { ticketsView, nameLookup } from '../../../dashboard/settingsViews.js';

const handlers = {
    close: () => import('../subcommands/close.js'),
    add: () => import('../subcommands/add.js'),
    remove: () => import('../subcommands/remove.js'),
    lock: () => import('../subcommands/lock.js'),
    unlock: () => import('../subcommands/unlock.js'),
    claim: () => import('../subcommands/claim.js'),
    rename: () => import('../subcommands/rename.js'),
    panel: () => import('../subcommands/panel.js'),
    setup: () => import('../subcommands/setup.js'),
};

export const commandData = new SlashCommandBuilder();
commandData.setName('ticket');
commandData.setDescription('Private support tickets.');
commandData.setIntegrationTypes([ApplicationIntegrationType.GuildInstall]);
commandData.setContexts([InteractionContextType.Guild]);
// Visible to everyone: ticket owners can close their own tickets. Each subcommand checks permissions itself.
commandData.addSubcommand((s) =>
    s
        .setName('close')
        .setDescription('Close this ticket. A transcript is saved first.')
        .addStringOption((o) =>
            o.setName('reason').setDescription('Why it was closed (shown in the transcript)').setMaxLength(500)
        )
);
commandData.addSubcommand((s) =>
    s
        .setName('add')
        .setDescription('Let someone else see and talk in this ticket. (Staff)')
        .addUserOption((o) => o.setName('member').setDescription('Who to add').setRequired(true))
);
commandData.addSubcommand((s) =>
    s
        .setName('remove')
        .setDescription('Remove someone who was added to this ticket. (Staff)')
        .addUserOption((o) => o.setName('member').setDescription('Who to remove').setRequired(true))
);
commandData.addSubcommand((s) =>
    s.setName('lock').setDescription('Stop the owner sending messages (they can still read). (Staff)')
);
commandData.addSubcommand((s) => s.setName('unlock').setDescription('Let the owner send messages again. (Staff)'));
commandData.addSubcommand((s) =>
    s.setName('claim').setDescription('Take this ticket, or let it go if it is yours. (Staff)')
);
commandData.addSubcommand((s) =>
    s
        .setName('rename')
        .setDescription('Rename this ticket channel. (Staff)')
        .addStringOption((o) =>
            o.setName('name').setDescription('The new name').setMinLength(1).setMaxLength(90).setRequired(true)
        )
);
commandData.addSubcommand((s) =>
    s
        .setName('panel')
        .setDescription('Post the "Create Ticket" message, or update it. (Manage Server)')
        .addChannelOption((o) =>
            o
                .setName('channel')
                .setDescription('Where to post it')
                .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
                .setRequired(true)
        )
);
commandData.addSubcommand((s) =>
    s
        .setName('setup')
        .setDescription('Set up tickets. More settings are on the dashboard. (Manage Server)')
        .addBooleanOption((o) => o.setName('enabled').setDescription('Turn tickets on or off').setRequired(true))
        .addChannelOption((o) =>
            o
                .setName('category')
                .setDescription('Category new tickets are created in')
                .addChannelTypes(ChannelType.GuildCategory)
        )
        .addRoleOption((o) => o.setName('staff-role').setDescription('Add a role that can see and manage tickets'))
        .addChannelOption((o) =>
            o
                .setName('transcript-channel')
                .setDescription('Where transcripts of closed tickets are posted')
                .addChannelTypes(ChannelType.GuildText)
        )
);

export const meta = {
    cooldown: 3,
    developerOnly: false,
    botPermissions: [],
    userPermissions: [],
};

// Subcommands that change settings, recorded in the dashboard's Web Logs
const AUDITED = new Set(['setup', 'panel']);

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
            action: 'Updated ticket settings',
            snapshot: async () => {
                const config = await Ticket_Config_Cache.get(interaction.guildId);
                return {
                    settings: ticketsView(config),
                    panelMessageId: config.panel?.messageId ?? null,
                    panelChannelId: config.panel?.channelId ?? null,
                };
            },
            describe: (before, after, guild) => {
                const names = nameLookup(guild);
                const changes = describeTicketChanges(before.settings, after.settings, names);
                if (before.panelMessageId !== after.panelMessageId && after.panelMessageId) {
                    changes.push(`Posted the ticket panel in ${names.channel(after.panelChannelId)}`);
                }
                return changes;
            },
        },
        run
    );
}
