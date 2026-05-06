import { Events } from 'discord.js';
import Client from '../../core/client.js';

export const name = Events.ClientReady;
export const once = true;
export const description = 'Console Log Client Ready';

/**
 * @param { Client } client
 */

export async function execute(client) {
    client.utils.LogData('Client Ready', `Logged in as ${client.user.tag}!`, 'info');
};