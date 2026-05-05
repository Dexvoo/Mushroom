import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import Client from '../core/client.js';

/**
 * @param { Client } client
 * @param { string } dir
 * @returns { Promise<void> }
*/


export default async function loadEvents(client, dir) {
    const files = fs.readdirSync(dir, { withFileTypes: true });

    for (const file of files) {
        const fullPath = path.join(dir, file.name);

        if (file.isDirectory()) {
            await loadEvents(client, fullPath);
            continue;
        }   
        
        if (!file.name.endsWith('.js')) continue;

        const event = await import(pathToFileURL(fullPath).href);

        if (!event.name || !event.execute) {
            client.utils.LogData('Event Load Error', `Failed to load event at ${fullPath}: Missing name or execute function`, 'error');
            continue;
        }
        
        if (event.once) {
            client.once(event.name, (...args) => event.execute(...args, client));
        } else {
            client.on(event.name, (...args) => event.execute(...args, client));
        }
        client.utils.LogData('Event Loaded', `Loaded event: ${file.name}`, 'success');
    }
}