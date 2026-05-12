import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import Client from './extendedClient.js';

/**
 * @param { Client } client
 * @param { string } dir
 * @returns { Promise<void> }
*/

export default async function loadCommands(client, dir) {

    const files = fs.readdirSync(dir, {
        withFileTypes: true
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
            client.utils.LogData('Command', `${command.commandData.name} | ${command.commandData.description}`, 'success');

        } catch (error) {

            client.utils.LogData('Command Init', `Error loading ${fullPath}: ${error.message}`, 'error');
        }
    }
}