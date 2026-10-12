import { MessageFlags } from 'discord.js';
import Welcome_Cache from '../cache/welcome.cache.js';
import { buildWelcomeCommand, AUDITED_SUBCOMMANDS } from '../utils/welcomeCommand.js';
import { withCommandAudit } from '../../../dashboard/commandAudit.js';
import { describeWelcomeChanges } from '../../../dashboard/describeChanges.js';
import { welcomeView, nameLookup } from '../../../dashboard/settingsViews.js';

const KIND = 'welcome';

// Imported from this file (not a shared one) so /reload picks up changes to the subcommands
const handlers = {
    channel: () => import('../subcommands/channel.js'),
    toggle: () => import('../subcommands/toggle.js'),
    message: () => import('../subcommands/message.js'),
    embed: () => import('../subcommands/embed.js'),
    test: () => import('../subcommands/test.js'),
    view: () => import('../subcommands/view.js'),
};

export const commandData = buildWelcomeCommand(KIND);

export const meta = {
    cooldown: 5,
    developerOnly: false,
    botPermissions: [],
    userPermissions: [],
};

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
    const run = () => handlerModule.execute(interaction, KIND);

    if (!AUDITED_SUBCOMMANDS.has(subcommand)) return run();
    await withCommandAudit(
        interaction,
        {
            action: 'Updated welcome messages',
            snapshot: async () => welcomeView(await Welcome_Cache.get(interaction.guildId)),
            describe: (before, after, guild) => describeWelcomeChanges(before, after, nameLookup(guild)),
        },
        run
    );
}
