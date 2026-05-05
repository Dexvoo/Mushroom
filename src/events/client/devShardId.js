import { Events } from 'discord.js';
import Client from '../../core/client.js';
import Global_Cache from '../../constants/global.js';
import { ENV } from '../../core/env.js';

export const name = Events.ClientReady;
export const once = true;

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