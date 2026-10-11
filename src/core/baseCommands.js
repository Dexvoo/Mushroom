import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';
import { registerHooks } from 'module';

/**
 * @typedef {import('./extendedClient.js').default} Client
 */

const RELOAD_PARAM = 'reload';

// Commands lazy-load their subcommands with relative imports, which resolve without the
// reloaded command's cache-busting query and so return the old cached module. This hook
// carries the query from a reloaded parent to files in `subcommands/` folders only;
// caches, models and utils must stay shared, so they are never re-imported.
registerHooks({
    resolve(specifier, context, nextResolve) {
        const result = nextResolve(specifier, context);
        if (!context.parentURL?.startsWith('file:') || !result.url.startsWith('file:')) return result;

        const version = new URL(context.parentURL).searchParams.get(RELOAD_PARAM);
        if (!version) return result;

        const url = new URL(result.url);
        if (!url.pathname.includes('/subcommands/')) return result;

        url.searchParams.set(RELOAD_PARAM, version);
        return { ...result, url: url.href };
    },
});

/**
 * Re-imports a command (and its subcommands) from disk and replaces it in client.commands.
 * Only affects the shard it runs on; use broadcastEval to reload every shard.
 * @param { Client } client
 * @param { string } commandName
 * @returns { Promise<string> } The reloaded command's name
 */
export async function reloadCommand(client, commandName) {
    const existing = client.commands.get(commandName);
    const filePath = existing?.commandData.filePath;
    if (!filePath) throw new Error(`No command file found for \`${commandName}\`.`);

    const command = await import(`${filePath}?${RELOAD_PARAM}=${Date.now()}`);
    if (!command.execute) throw new Error(`Missing execute function in ${filePath}`);

    command.commandData.filePath = filePath;

    if (command.commandData.name !== commandName) client.commands.delete(commandName);
    client.commands.set(command.commandData.name, command);

    return command.commandData.name;
}

/**
 * @param { Client } client
 * @param { string } dir
 * @returns { Promise<void> }
 */

export default async function loadCommands(client, dir) {
    const files = fs.readdirSync(dir, {
        withFileTypes: true,
    });

    for (const file of files) {
        const fullPath = path.join(dir, file.name);

        if (file.isDirectory()) {
            await loadCommands(client, fullPath);
            continue;
        }

        if (!file.name.endsWith('.js')) continue;

        if (!fullPath.includes(`${path.sep}commands${path.sep}`)) {
            continue;
        }

        try {
            const command = await import(pathToFileURL(fullPath).href);
            if (!command.execute) {
                client.utils.LogData('Command Init Load Error', `Missing execute function at ${fullPath}`, 'error');
                continue;
            }

            command.commandData.filePath = pathToFileURL(fullPath).href;

            client.commands.set(command.commandData.name, command);
            client.utils.LogData(
                'Command',
                `${command.commandData.name} | ${command.commandData.description}`,
                'success'
            );
        } catch (error) {
            client.utils.LogData('Command Init', `Error loading ${fullPath}: ${error.message}`, 'error');
        }
    }
}
