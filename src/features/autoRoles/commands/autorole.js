import {
    SlashCommandBuilder,
    InteractionContextType,
    ApplicationIntegrationType,
    PermissionFlagsBits,
    MessageFlags,
} from 'discord.js';
import Auto_Roles_Cache from '../cache/autoRoles.cache.js';
import { withCommandAudit } from '../../../dashboard/commandAudit.js';
import { describeAutoRoleChanges } from '../../../dashboard/describeChanges.js';
import { autoRolesView, nameLookup } from '../../../dashboard/settingsViews.js';

const typeChoices = [
    { name: 'Members', value: 'members' },
    { name: 'Bots', value: 'bots' },
];

const handlers = {
    add: () => import('../subcommands/add.js'),
    remove: () => import('../subcommands/remove.js'),
    list: () => import('../subcommands/list.js'),
    toggle: () => import('../subcommands/toggle.js'),
};

// Subcommands that change settings, recorded in the dashboard's Web Logs
const AUDITED = new Set(['add', 'remove', 'toggle']);

export const commandData = new SlashCommandBuilder();
commandData.setName('autorole');
commandData.setDescription('Roles given automatically when people or bots join.');
commandData.setIntegrationTypes([ApplicationIntegrationType.GuildInstall]);
commandData.setContexts([InteractionContextType.Guild]);
commandData.setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild);
commandData.addSubcommand((s) =>
    s
        .setName('add')
        .setDescription('Give a role to everyone who joins.')
        .addStringOption((o) =>
            o.setName('type').setDescription('Who gets the role').setRequired(true).addChoices(typeChoices)
        )
        .addRoleOption((o) => o.setName('role').setDescription('The role to give').setRequired(true))
);
commandData.addSubcommand((s) =>
    s
        .setName('remove')
        .setDescription('Stop giving a role to people who join.')
        .addStringOption((o) =>
            o.setName('type').setDescription('Which list to remove it from').setRequired(true).addChoices(typeChoices)
        )
        .addRoleOption((o) => o.setName('role').setDescription('The role to stop giving').setRequired(true))
);
commandData.addSubcommand((s) => s.setName('list').setDescription('Show the roles given to people and bots who join.'));
commandData.addSubcommand((s) =>
    s
        .setName('toggle')
        .setDescription('Turn auto roles on or off (the role lists are kept).')
        .addBooleanOption((o) =>
            o.setName('enabled').setDescription('True to give roles on join, false to stop').setRequired(true)
        )
);

export const meta = {
    cooldown: 5,
    developerOnly: false,
    botPermissions: [],
    userPermissions: [],
};

/**
 * @typedef {import('../../../core/extendedClient.js').default} Client
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
            action: 'Updated auto roles',
            snapshot: async () => autoRolesView(await Auto_Roles_Cache.get(interaction.guildId)),
            describe: (before, after, guild) => describeAutoRoleChanges(before, after, nameLookup(guild)),
        },
        run
    );
}
