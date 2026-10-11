import { MessageFlags, Events } from 'discord.js';
import User_Level_Cache from '../../levels/cache/userLevels.cache.js';

export const name = Events.InteractionCreate;
export const once = false;
export const description = 'Registering Slash Commands / Autocomplete';

/**
 * @typedef {import('../../../core/extendedClient.js').default} Client
 * @param { import('discord.js').BaseInteraction & { client: Client } } interaction
 */

export async function execute(interaction) {
    const { guild, client } = interaction;

    if (interaction.isAutocomplete()) {
        const command = client.commands.get(interaction.commandName);
        if (!command || !command.autocomplete) return;
        try {
            await command.autocomplete(interaction, client);
        } catch (error) {
            client.utils.LogData(`Autocomplete Error: ${interaction.commandName}`, error.message, 'error');
        }
        return;
    }

    if (interaction.isMessageComponent())
        return client.utils.Embed(
            interaction,
            'Red',
            client.utils.Translate('errors.title', interaction.locale),
            `This component is not functional yet.`,
            { flags: MessageFlags.Ephemeral }
        );
    if (interaction.isModalSubmit())
        return client.utils.Embed(
            interaction,
            'Red',
            client.utils.Translate('errors.title', interaction.locale),
            `This modal is not functional yet.`,
            { flags: MessageFlags.Ephemeral }
        );

    if (interaction.isChatInputCommand()) {
        const command = client.commands.get(interaction.commandName);
        if (!command) {
            const msg = client.utils.Translate('errors.no_command', interaction.locale);
            return client.utils.Embed(
                interaction,
                'Red',
                client.utils.Translate('errors.title', interaction.locale),
                msg,
                { flags: MessageFlags.Ephemeral }
            );
        }

        if (command.commandData.developerOnly && !client.utils.DevPermissionCheck(interaction.user.id)) {
            const msg = client.utils.Translate('errors.developer_only', interaction.locale);
            return client.utils.Embed(
                interaction,
                'Red',
                client.utils.Translate('errors.title', interaction.locale),
                msg,
                { flags: MessageFlags.Ephemeral }
            );
        }

        if (!commandCooldown(interaction, command)) return;

        // Bot Permissions
        if (guild && command.commandData.botPermissions?.length > 0) {
            const [hasPerms, missingPerms] = client.utils.PermissionCheck(
                interaction,
                command.commandData.botPermissions,
                guild.members.me
            );
            if (!hasPerms) {
                const msg = client.utils.Translate('errors.bot_missing_perms', interaction.locale, {
                    perms: missingPerms.flat().join(', '),
                });
                return client.utils.Embed(
                    interaction,
                    'Red',
                    client.utils.Translate('errors.title', interaction.locale),
                    msg,
                    { flags: MessageFlags.Ephemeral }
                );
            }
        }

        // User Permissions
        if (guild && command.commandData.userPermissions?.length > 0) {
            const [hasPerms, missingPerms] = client.utils.PermissionCheck(
                interaction,
                command.commandData.userPermissions,
                interaction.member
            );
            if (!hasPerms) {
                const msg = client.utils.Translate('errors.user_missing_perms', interaction.locale, {
                    perms: missingPerms.flat().join(', '),
                });
                return client.utils.Embed(
                    interaction,
                    'Red',
                    client.utils.Translate('errors.title', interaction.locale),
                    msg,
                    { flags: MessageFlags.Ephemeral }
                );
            }
        }

        try {
            await command.execute(interaction, client);
        } catch (error) {
            // TODO: log errors with webhook to a private channel for better visibility and debugging, instead of just console logging.

            client.utils.LogData(`Command Error: ${interaction.commandName}`, error.stack ?? error.message, 'error');

            const errorReply = {
                content: `${client.customEmojis.reactions.Warning} An error occurred while executing this command.`,
                flags: MessageFlags.Ephemeral,
            };

            try {
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp(errorReply);
                } else {
                    await interaction.reply(errorReply);
                }
            } catch (replyError) {
                client.utils.LogData(
                    'Command Error Reply',
                    `${interaction.commandName}: ${replyError.message}`,
                    'error'
                );
            }
            return;
        }

        if (guild) {
            await User_Level_Cache.incrementCommands(guild.id, interaction.user.id).catch((error) =>
                client.utils.LogData('Command Usage', `Failed to increment command count: ${error.message}`, 'error')
            );
        }
    }
}

/**
 * @param { import('discord.js').ChatInputCommandInteraction & { client: Client } } interaction
 * @param {{ commandData: import('discord.js').SlashCommandBuilder & { cooldown?: number } }} command
 */
function commandCooldown(interaction, command) {
    const { commandName, user, client } = interaction;
    const expiresAt = client.cooldowns.getRemaining('command', user.id, commandName);

    if (expiresAt) {
        const msg = client.utils.Translate('errors.cooldown', interaction.locale, {
            command: commandName,
            time: client.utils.Timestamp(expiresAt),
        });
        client.utils.Embed(interaction, 'Red', client.utils.Translate('errors.title', interaction.locale), msg, {
            flags: [MessageFlags.Ephemeral],
        });
        return false;
    }

    const cooldownAmount = command.commandData.cooldown ?? 5;
    client.cooldowns.add('command', user.id, cooldownAmount, commandName);
    return true;
}
