import { SlashCommandBuilder, Colors, InteractionContextType, ApplicationIntegrationType, PermissionFlagsBits, ChannelType, ChatInputCommandInteraction } from 'discord.js';
import Client from '../../core/client.js';

const logChoices = [
    { name: 'Message', value: 'message' },
    { name: 'Channel', value: 'channel' },
    { name: 'Member', value: 'member' },
    { name: 'Member Join', value: 'join' },
    { name: 'Member Leave', value: 'leave' },
    { name: 'Voice', value: 'voice' },
    { name: 'Role', value: 'role' },
    { name: 'Server', value: 'server' },
    { name: 'Punishment', value: 'punishment' },
    { name: 'ALL Logs', value: 'all' },
];

const handlers = {
    'logs-setup': () => import('../../handlers/commands/logs/setup.js'),
    'logs-view': () => import('../../handlers/commands/logs/view.js'),
    'logs-test': () => import('../../handlers/commands/logs/test.js'),
    'logs-ignore': () => import('../../handlers/commands/logs/ignore.js'),
    'logs-view-ignored': () => import('../../handlers/commands/logs/ignoreView.js'),
};

export const commandData = new SlashCommandBuilder();
commandData.setName('logs');
commandData.setDescription('Manage guild logs')
commandData.setIntegrationTypes([ ApplicationIntegrationType.GuildInstall ]);
commandData.setContexts([ InteractionContextType.Guild ]);
commandData.setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild);
commandData.addSubcommand((s) => s
    .setName('setup')
    .setDescription('Setup logging for your server.')
    .addStringOption((o) => o
        .setName('log-type')
        .setDescription('Type of log to setup')
        .setRequired(true)
        .addChoices(logChoices)
    )
    .addBooleanOption((o) => o
        .setName('enabled')
        .setDescription('Enable or disable the log type')
        .setRequired(true)
    )
    .addChannelOption((o) => o
        .setName('channel')
        .setDescription('The channel to send the logs to')
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(false)
    )
);
commandData.addSubcommand((s) => s
    .setName('view')
    .setDescription('View the current logging setup for your server.')
    .addStringOption((o) => o
        .setName('log-type')
        .setDescription('Type of log to view')
        .setRequired(true)
        .addChoices(logChoices)
    )
);
commandData.addSubcommand((s) => s
    .setName('test')
    .setDescription('View the current logging setup for your server.')
    .addStringOption((o) => o
        .setName('log-type')
        .setDescription('Type of log to test')
        .setRequired(true)
        .addChoices(logChoices)
    )
);
commandData.addSubcommand((s) => s
    .setName('ignore')
    .setDescription('Add/remove a channel to the log ignore list.')
    .addBooleanOption((o) => o
        .setName('enable')
        .setDescription('Set to true to enable, false to disable.')
        .setRequired(true)
    )
    .addChannelOption((o) => o
        .setName('channel')
        .setDescription('The channel to ignore.')
        .setRequired(false)
    )
);
commandData.addSubcommand((s) => s
    .setName('ignore-view')
    .setDescription('View all channels on the log ignore list.')
);
commandData.cooldown = 5;
commandData.userPermissions = [];
commandData.botPermissions = [];
commandData.developerOnly = true;

/**
 * @param { ChatInputCommandInteraction & { client: Client }} interaction
 */
export async function execute(interaction) {
    const subcommand =  interaction.options.getSubcommand();
    const handlerPromise = handlers[`logs-${subcommand}`];
    if(!handlerPromise) return interaction.client.utils.Embed(interaction, 'Red', interaction.client.utils.Translate('errors.title', interaction.locale), interaction.client.utils.Translate('errors.no_subcommand', interaction.locale, { subcommand }));

    try {
        const handlerModule = await handlerPromise();
        await handlerModule.execute(interaction);
    } catch (error) {
        console.error(error)
    }
}