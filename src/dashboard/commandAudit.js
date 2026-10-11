import { createMongoAuditStore } from './auditStore.js';
import { LogData } from '../shared/utils/logger.js';

/**
 * Records settings changes made with slash commands in the Web Logs, the same way dashboard saves are.
 *
 * Takes a snapshot of the settings before and after the command runs and describes the difference,
 * so commands don't need to know about the Web Logs. Commands that fail or change nothing aren't recorded.
 *
 * @template T
 * @typedef {Object} CommandAuditOptions
 * @property {string} action - e.g. "Updated level settings" (same wording as dashboard saves)
 * @property {() => Promise<T>} snapshot - Current settings as a plain view (settingsViews.js)
 * @property {(before: T, after: T, guild: import('discord.js').Guild) => string[]} describe
 * @property {import('./auditStore.js').AuditStore} [store] - Replaced in tests
 */

const defaultStore = createMongoAuditStore();

/**
 * Runs a settings command and records what it changed.
 * Errors from the command itself propagate unchanged; Web Logs failures are only logged, since by then
 * the change has been made and the user has had their reply.
 *
 * @template T
 * @param {import('discord.js').ChatInputCommandInteraction<'cached'>} interaction
 * @param {CommandAuditOptions<T>} options
 * @param {() => Promise<unknown>} run - The command
 */
export async function withCommandAudit(interaction, { action, snapshot, describe, store = defaultStore }, run) {
    let before;
    try {
        before = structuredClone(await snapshot());
    } catch (error) {
        LogData('Web Logs', `Could not read settings before ${commandName(interaction)}: ${error.message}`, 'warning');
    }

    await run();
    if (before === undefined) return;

    try {
        const changes = describe(before, await snapshot(), interaction.guild);
        if (changes.length === 0) {
            LogData('Web Logs', `${commandName(interaction)} in ${interaction.guildId} changed nothing`, 'info');
            return;
        }

        const { user, member } = interaction;
        await store.record({
            guildId: interaction.guildId,
            user: {
                id: user.id,
                username: user.username,
                displayName: member?.displayName ?? user.displayName,
                avatar: user.displayAvatarURL({ extension: 'png', size: 64 }),
            },
            action,
            changes,
            source: commandName(interaction),
        });
        LogData(
            'Web Logs',
            `Recorded ${commandName(interaction)} by ${interaction.user.id} in ${interaction.guildId}`,
            'info'
        );
    } catch (error) {
        LogData(
            'Web Logs',
            `Could not record ${commandName(interaction)} in ${interaction.guildId}: ${error.message}`,
            'error'
        );
    }
}

/**
 * "/level settings max-level"
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 */
export function commandName(interaction) {
    const group = interaction.options.getSubcommandGroup(false);
    const subcommand = interaction.options.getSubcommand(false);
    return ['/' + interaction.commandName, group, subcommand].filter(Boolean).join(' ');
}
