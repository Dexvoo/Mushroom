import { Events } from 'discord.js';
import Client from '../../../structures/extendedClient.js';
import Global_Cache from '../cache/global.js';
import { ENV } from '../../../bootstrap/environment.js';

export const name = Events.ClientReady;
export const once = true;
export const description = 'Storing Shard ID for Dev Server';

/**
 * @param { Client } client
 */

export async function execute(client) {
    const shardId = await client.shard.broadcastEval(
        (c, { guildId }) =>
          c.guilds.cache.has(guildId) ? c.guilds.cache.get(guildId).shardId : null,
        { context: { guildId: ENV.DEV_GUILD_ID } }
      )
      .then((results) => results.find((id) => id !== null));

      if(shardId !== null) {
        Global_Cache.DevSID = shardId;
      } else {
        console.warn('Developer Guild not found in any shard. Developer Shard ID could not be determined.');
        Global_Cache.DevSID = 0;
        console.log('Developer Shard ID set to 0 by default.');
      }
      
}