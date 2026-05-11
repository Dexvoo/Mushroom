import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import Client from '../../core/client.js';

/**
 * @param { Client } client
 * @param { string } dir
 * @returns { Promise<void> }
*/

export default async function loadCommands(client, dir) {
    const files = fs.readdirSync(dir, { withFileTypes: true });

    for (const file of files) {
        const fullPath = path.join(dir, file.name);

        if (file.isDirectory()) {
            await loadCommands(client, fullPath);
        } else if (file.name.endsWith('.js')) {
            try {
                const command = await import(pathToFileURL(fullPath).href);

                if(!command.execute) {
                    client.utils.LogData('Command Load Error', `Failed to load command at ${fullPath}: Missing execute function`, 'error');
                    continue;
                }

                command.commandData.filePath = pathToFileURL(fullPath).href

                client.commands.set(command.commandData.name, command);
                client.utils.LogData(command.commandData.name, command.commandData.description, 'success');
            } catch (error) {
                client.utils.LogData(`Command Handler`,`Error has been found ${error}`, 'error');
            }
        }
    }
}