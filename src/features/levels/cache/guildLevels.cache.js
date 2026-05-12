import { LevelConfig } from '../../../models/guild/levels.js';
import NodeCache from 'node-cache';
import { LogData } from '../../../shared/utils/embed.js';

/**
 * @typedef {import('../../../models/guild/levels.js').LevelConfigType} LevelConfigType
 */
class Guild_Level_Cache {
    /**
     * @private
     * @type {NodeCache}
     */
    cache;

    constructor() {
        // stdTTL: 3600 (1 hour), checkperiod: 120 (cleans up expired keys every 2 mins)
        this.cache = new NodeCache({ stdTTL: 3600, checkperiod: 120 });
    }

    /**
     * Fetches the log configuration for a guild, using the cache if available.
     * @param {string} guildId - The ID of the guild.
     * @return {Promise<LevelConfigType>} The log configuration.
     */
    async get(guildId) {
        try {

            const cached = this.cache.get(guildId);
            if (cached) return cached;

            let config = await LevelConfig.findOne({ guildId }).lean();

            if (!config) {
                config = this.createDefault(guildId);
            }

            this.cache.set(guildId, config);
            return config;
        } catch (error) {
            LogData('Guild Level Cache', `Failed to get config for ${guildId}: ${error.message}`, 'error');
            return this.createDefault(guildId);
        }
    }

    /**
     * Updates a specific sub-category (like 'message', 'join', 'leave') and updates cache.
     * @param {string} guildId
     * @param {keyof LevelConfigType} type
     * @param {Partial<LevelConfigType[keyof LevelConfigType]>} newData - The new data for this category.
     * @return {Promise<LevelConfigType>}
     */
    async setType(guildId, type, newData) {
        try {
            const updatedConfig = await LevelConfig.findOneAndUpdate(
                { guildId },
                {
                    $set: Object.fromEntries(
                        Object.entries(newData).map(([key, value]) => [
                            `${type}.${key}`,
                            value
                        ])
                    )
                },
                { returnDocument: 'after', upsert: true, lean: true, setDefaultsOnInsert: true }
            );

            this.cache.set(guildId, updatedConfig);
            LogData('Guild Level Cache', `Type '${type}' updated for guild ${guildId}`, 'debug');

            return updatedConfig;
        } catch (error) {
            LogData('Guild Level Cache', `Failed to set type '${type}' for ${guildId}: ${error.message}`, 'error');
            throw error;
        }
    }

    createDefault(guildId) {
        return {
            guildId,

            enabled: false,
            channelId: null,

            blacklisted: {
                roleIds: [],
                channelIds: [],
            },

            rewards: [],
            removePastRewards: false,

            xpMultiplier: 1,
            messageCooldown: 60,
            maxLevel: 100,

            levelUpMessage:
                '{user}, you just gained a level! Current Level: **{level}**!',

            roleMultipliers: [],
        };
    }

    /**
     * Forcefully removes a guild from the cache.
     * @param {string} guildId
     */
    invalidate(guildId) {
        this.cache.del(guildId);
        LogData('Guild Level Cache', `Cache invalidated for guild ${guildId}`, 'debug');
    }
};

export default new Guild_Level_Cache();