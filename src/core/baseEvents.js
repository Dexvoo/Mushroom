import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';

/**
 * @typedef {import('../core/extendedClient.js').default} Client
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

        try {
            const event = await import(pathToFileURL(fullPath).href);

            if (!event.name || !event.execute) {
                client.utils.LogData('Event Load Error', `Missing name or execute at ${fullPath}`, 'error');
                continue;
            }

            const listener = async (...args) => {
                try {
                    await event.execute(...args, client);
                } catch (error) {
                    client.utils.LogData(
                        'Event Error',
                        `${event.name} (${path.relative(process.cwd(), fullPath)})\n${error.stack ?? error.message}`,
                        'error'
                    );
                }
            };

            if (event.once) {
                client.once(event.name, listener);
            } else {
                client.on(event.name, listener);
            }

            const description = event.description ?? 'No description provided.';

            client.utils.LogData('Event', `${description}`, 'success');
        } catch (error) {
            console.log(error);
            client.utils.LogData('Event Loader', `Failed loading ${fullPath}: ${error.message}`, 'error');
        }
    }
}
