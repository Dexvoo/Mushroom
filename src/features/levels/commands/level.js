import {
    SlashCommandBuilder,
    InteractionContextType,
    ApplicationIntegrationType,
    ChannelType,
    MessageFlags,
} from 'discord.js';
import Guild_Level_Cache from '../cache/guildLevels.cache.js';
import { withCommandAudit } from '../../../dashboard/commandAudit.js';
import { describeLevelChanges } from '../../../dashboard/describeChanges.js';
import { levelsView, nameLookup } from '../../../dashboard/settingsViews.js';

const handlers = {
    setup: () => import('../subcommands/setup.js'),
    rank: () => import('../subcommands/rank.js'),
    leaderboard: () => import('../subcommands/leaderboard.js'),
    settings: {
        //     'xp-multiplier': () => import('../subcommands/test.js'),
        'message-cooldown': () => import('../subcommands/settings/messageCooldown.js'),
        'max-level': () => import('../subcommands/settings/maxLevel.js'),
        'levelup-message': () => import('../subcommands/settings/levelUpMessage.js'),
        //     'remove-past-rewards': () => import('../subcommands/test.js'),
        'add-level-reward': () => import('../subcommands/settings/levelRewardAdd.js'),
        'remove-level-reward': () => import('../subcommands/settings/levelRewardRemove.js'),
        'view-level-rewards': () => import('../subcommands/settings/levelRewardList.js'),
        blacklist: () => import('../subcommands/settings/blacklist.js'),
        //     'add-multiplier': () => import('../subcommands/test.js'),
        //     'remove-multiplier': () => import('../subcommands/test.js'),
        //     'view-multipliers':() => import('../subcommands/test.js'),
    },
    // 'admin':{
    //     'set': () => import('../subcommands/test.js'),
    //     'add': () => import('../subcommands/test.js'),
    //     'remove': () => import('../subcommands/test.js'),
    // },
};

// Subcommands that change settings, recorded in the dashboard's Web Logs
const AUDITED = new Set([
    'setup',
    'settings message-cooldown',
    'settings max-level',
    'settings levelup-message',
    'settings add-level-reward',
    'settings remove-level-reward',
    'settings blacklist',
]);

export const commandData = new SlashCommandBuilder();
commandData.setName('level');
commandData.setDescription('Leveling system commands for ranks, leaderboards, and settings.');
commandData.setIntegrationTypes([ApplicationIntegrationType.GuildInstall]);
commandData.setContexts([InteractionContextType.Guild]);
// commandData.setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild);
commandData.addSubcommand((s) =>
    s
        .setName('rank')
        .setDescription("Shows your or another user's current level and XP.")
        .addUserOption((o) => o.setName('user').setDescription('The user you want to check.').setRequired(false))
);
commandData.addSubcommand((s) =>
    s
        .setName('leaderboard')
        .setDescription('Displays the server leaderboard.')
        .addStringOption((o) =>
            o
                .setName('type')
                .setDescription('The type of leaderboard to show.')
                .setRequired(true)
                .addChoices(
                    { name: 'Levels', value: 'level' },
                    { name: 'Messages', value: 'totalMessages' },
                    { name: 'Voice', value: 'totalVoice' },
                    { name: 'Commands', value: 'totalCommands' }
                )
        )
);
commandData.addSubcommand((s) =>
    s
        .setName('setup')
        .setDescription('Enable or disable the leveling system for your server.')
        .addBooleanOption((o) =>
            o.setName('enabled').setDescription('Enable or disable the level system.').setRequired(true)
        )
        .addChannelOption((o) =>
            o
                .setName('channel')
                .setDescription('Channel to send level-up messages.')
                .addChannelTypes(ChannelType.GuildText)
                .setRequired(false)
        )
);
commandData.addSubcommandGroup((g) =>
    g
        .setName('settings')
        .setDescription('Configure leveling system settings.')
        .addSubcommand((s) =>
            s
                .setName('xp-multiplier')
                .setDescription("Set the server's XP multiplier (Max: 5).")
                .addNumberOption((o) =>
                    o
                        .setName('multiplier')
                        .setDescription('Value from 0 to 5 (e.g., 2 for double XP).')
                        .setMinValue(0)
                        .setMaxValue(5)
                        .setRequired(true)
                )
        )
        .addSubcommand((s) =>
            s
                .setName('message-cooldown')
                .setDescription('Set the cooldown between XP gains in seconds.')
                .addIntegerOption((o) =>
                    o
                        .setName('seconds')
                        .setDescription('Cooldown in seconds (20-3600).')
                        .setMinValue(20)
                        .setMaxValue(3600)
                        .setRequired(true)
                )
        )
        .addSubcommand((s) =>
            s
                .setName('max-level')
                .setDescription('Set the maximum level users can reach.')
                .addIntegerOption((o) =>
                    o
                        .setName('level')
                        .setDescription('Maximum level (1-10000).')
                        .setMinValue(1)
                        .setMaxValue(10000)
                        .setRequired(true)
                )
        )
        .addSubcommand((s) =>
            s
                .setName('levelup-message')
                .setDescription('Set the custom level-up message.')
                .addStringOption((o) =>
                    o
                        .setName('message')
                        .setDescription('Use {user} and {level} as placeholders.')
                        .setMinLength(1)
                        .setMaxLength(500)
                        .setRequired(true)
                )
        )
        .addSubcommand((s) =>
            s
                .setName('remove-past-rewards')
                .setDescription("Set whether to remove a user's previous level-up role.")
                .addBooleanOption((o) =>
                    o
                        .setName('enabled')
                        .setDescription('True to remove old roles, false to keep them.')
                        .setRequired(true)
                )
        )
        .addSubcommand((s) =>
            s
                .setName('add-level-reward')
                .setDescription('Add a role reward for reaching a certain level.')
                .addIntegerOption((o) =>
                    o
                        .setName('level')
                        .setDescription('The level required to get the role.')
                        .setMinValue(1)
                        .setMaxValue(10000)
                        .setRequired(true)
                )
                .addRoleOption((o) =>
                    o.setName('role').setDescription('The role to give at that level.').setRequired(true)
                )
        )
        .addSubcommand((s) =>
            s
                .setName('remove-level-reward')
                .setDescription('Remove a level reward.')
                .addIntegerOption((o) =>
                    o
                        .setName('level')
                        .setDescription('The level whose reward you want to remove.')
                        .setMinValue(1)
                        .setMaxValue(10000)
                        .setRequired(true)
                )
        )
        .addSubcommand((s) => s.setName('view-level-rewards').setDescription('List all configured level reward roles.'))
        .addSubcommand((s) =>
            s
                .setName('blacklist')
                .setDescription('Blacklist roles or channels from gaining XP.')
                .addRoleOption((o) =>
                    o.setName('role').setDescription('Role to blacklist from gaining XP.').setRequired(false)
                )
                .addChannelOption((o) =>
                    o
                        .setName('channel')
                        .setDescription('Channel to blacklist from gaining XP.')
                        .addChannelTypes(ChannelType.GuildText)
                        .setRequired(false)
                )
        )
        .addSubcommand((s) =>
            s
                .setName('add-multiplier')
                .setDescription('Add an XP multiplier to a role.')
                .addRoleOption((o) => o.setName('role').setDescription('The role to grant bonus XP.').setRequired(true))
                .addNumberOption((o) =>
                    o
                        .setName('multiplier')
                        .setDescription('The multiplier (e.g., 1.5 for +50% XP).')
                        .setMinValue(1.01)
                        .setMaxValue(5)
                        .setRequired(true)
                )
        )
        .addSubcommand((s) =>
            s
                .setName('remove-multiplier')
                .setDescription('Remove an XP multiplier from a role.')
                .addRoleOption((o) =>
                    o.setName('role').setDescription('The role to remove the multiplier from.').setRequired(true)
                )
        )
        .addSubcommand((s) => s.setName('view-multipliers').setDescription('View all configured role XP multipliers.'))
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
    if (!interaction.guild) return;
    const subcommandGroup = interaction.options.getSubcommandGroup(false);
    const subcommand = interaction.options.getSubcommand();
    const handler = subcommandGroup ? handlers[subcommandGroup]?.[subcommand] : handlers[subcommand];
    if (!handler)
        return interaction.client.utils.Embed(
            interaction,
            'Red',
            interaction.client.utils.Translate('errors.title', interaction.locale),
            interaction.client.utils.Translate('errors.no_subcommand', interaction.locale, { subcommand }),
            { flags: MessageFlags.Ephemeral }
        );

    // Errors propagate to the slash command handler, which logs them and replies to the user
    const guildConfig = await Guild_Level_Cache.get(interaction.guildId);
    const handlerModule = await handler();
    const run = () => handlerModule.execute(interaction, guildConfig);

    if (!AUDITED.has([subcommandGroup, subcommand].filter(Boolean).join(' '))) return run();
    await withCommandAudit(
        interaction,
        {
            action: 'Updated level settings',
            snapshot: async () => levelsView(await Guild_Level_Cache.get(interaction.guildId)),
            describe: (before, after, guild) => describeLevelChanges(before, after, nameLookup(guild)),
        },
        run
    );
}
