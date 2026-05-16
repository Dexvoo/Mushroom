import { UserLevels } from '../../../features/levels/models/userLevels.js';
import Client from '../../../structures/extendedClient.js';
import NodeCache from 'node-cache';
import { LogData } from '../../../shared/utils/logger.js';
import { EmbedBuilder, GuildMember, Message } from 'discord.js';
import { LevelForExp, MessageXP, VoiceXP } from '../utils/levels.js';

/**
 * @typedef {import('../models/userLevels.js').UserLevelsType} UserLevelsType
 * @typedef {import('../models/guildLevels.js').GuildLevelsType} GuildLevelsType
 */

class User_Levels_Cache {
    /**
     * @private
     * @type {NodeCache}
     */
    cache;
    dirty;

    constructor() {
        // 1 hour cache TTL
        this.cache = new NodeCache({
            stdTTL: 3600,
            checkperiod: 120
        });
        this.dirty = new Set();
        setInterval(() => {
            this.flush();
        }, 30000);
    }

    async flush() {
        try {

            for (const key of this.dirty) {

                const data = this.cache.get(key);

                if (!data) continue;

                const { guildId, userId } = data;

                await UserLevels.findOneAndUpdate(
                    { guildId, userId },
                    { $set: data },
                    {
                        upsert: true,
                        setDefaultsOnInsert: true
                    }
                );

                this.dirty.delete(key);
            }

            LogData('User Levels Cache', 'Flushed dirty users to database', 'debug');

        } catch (error) {
            LogData('User Levels Cache', `Failed to flush cache: ${error.message}`, 'error');
        }
    }

    /**
     * Creates a default user level object.
     * @param {string} guildId
     * @param {string} userId
     * @returns {UserLevelsType}
     */
    createDefault(guildId, userId) {
        return {
            guildId,
            userId,

            xp: 0,
            level: 0,

            totalMessages: 0,
            totalVoice: 0,
            totalCommands: 0,

            messageXP: 0,
            voiceXP: 0,
            dropsXP: 0,

            lastMessageAt: null,
            lastVoiceAt: null,
            lastLevelUpAt: null,

            dailyStreak: 0,
        };
    }

    /**
     * Gets user data from cache or database.
     * @param {string} guildId
     * @param {string} userId
     * @returns {Promise<UserLevelsType>}
     */
    async get(guildId, userId) {
        try {
            const key = `${guildId}:${userId}`;

            const cached = this.cache.get(key);
            if (cached) return cached;

            let userData = await UserLevels.findOne({ guildId, userId }).lean();

            if (!userData) {
                userData = this.createDefault(guildId, userId);
            }

            this.cache.set(key, userData);
            this.dirty.add(key);

            return userData;
        } catch (error) {
            LogData( 'User Levels Cache', `Failed to get user data for ${guildId}:${userId}: ${error.message}`, 'error');
            return this.createDefault(guildId, userId);
        }
    }

    /**
     * Saves cached user data to the database.
     * @param {string} guildId
     * @param {string} userId
     * @returns {Promise<UserLevelsType>}
     */
    async save(guildId, userId) {
        try {
            const key = `${guildId}:${userId}`;

            const data = this.cache.get(key);
            if (!data) return null;

            const updated = await UserLevels.findOneAndUpdate(
                { guildId, userId },
                { $set: data },
                {
                    upsert: true,
                    new: true,
                    lean: true,
                    setDefaultsOnInsert: true
                }
            );

            this.cache.set(key, updated);

            return updated;
        } catch (error) {
            LogData('User Levels Cache', `Failed to save user data for ${guildId}:${userId}: ${error.message}`, 'error');
            throw error;
        }
    }

    /**
     * Adds message XP to a user.
     * @param {GuildMember & { client: Client }} member
     * @param {GuildLevelsType} guildData
     * @returns {Promise<boolean>}
     */
    async addMessageXP(member, guildData) {
        const { guild } = member;

        const key = `${guild.id}:${member.id}`;
        const userData = await this.get(guild.id, member.id);
        if (!userData) return false;

        let userXP = MessageXP();
        const roleMulti = await this.getCombinedRoleMultiplier(member, guildData);

        userXP *= roleMulti;
        userXP *= guildData.xpMultiplier;
        userXP = Math.floor(userXP);

        const oldLevel = userData.level;

        userData.xp += userXP;
        userData.messageXP += userXP;
        userData.totalMessages += 1;
        userData.lastMessageAt = new Date();

        const [ newLevel ] = LevelForExp(userData.xp);

        if (newLevel > oldLevel) {
            userData.level = newLevel;
            userData.lastLevelUpAt = new Date();

            this.send(member, guildData, userData);

            console.log(`${member.user.username} levelled up from ${oldLevel} to ${newLevel}`);
        }

        this.cache.set(key, userData);
        this.dirty.add(key);

        return true;
    }

    /**
     * Adds Voice XP to a user.
     * @param {GuildMember & { client: Client }} member
     * @param {GuildLevelsType} guildData
     * @param {number} minutes
     * @returns {Promise<boolean>}
     */
    async addVoiceXP(member, guildData, minutes) {
        const { guild } = member;

        const key = `${guild.id}:${member.id}`;
        const userData = await this.get(guild.id, member.id);
        if (!userData) return false;

        let userXP = VoiceXP(minutes);
        const roleMulti = await this.getCombinedRoleMultiplier(member, guildData);

        userXP *= roleMulti;
        userXP *= guildData.xpMultiplier;
        userXP = Math.floor(userXP);

        const oldLevel = userData.level;

        userData.xp += userXP;
        userData.voiceXP += userXP;
        userData.totalVoice += minutes;
        userData.lastVoiceAt = new Date();

        const [ newLevel ] = LevelForExp(userData.xp);

        if (newLevel > oldLevel) {
            userData.level = newLevel;
            userData.lastLevelUpAt = new Date();

            this.send(member, guildData, userData);
            
            console.log(`${member.user.username} levelled up from ${oldLevel} to ${newLevel}`);
        }

        this.cache.set(key, userData);
        this.dirty.add(key);

        return true;
    }

    /**
     * Adds Voice XP to a user.
     * @param {GuildMember & { client: Client }} member
     * @param {GuildLevelsType} guildData
     * @param {UserLevelsType} userData
     * @returns {Promise<boolean>}
     */
    async send(member, guildData, userData) {
        const { guild, client } = member;

        const channelId = guildData.channelId
        const channel = guild.channels.cache.get(channelId);

        
        const levelUpMessageTemplate = guildData.levelUpMessage || '{user} leveled up to **{level}**!';
        const levelUpMessage = levelUpMessageTemplate
        .replace('{user}', member.toString())
        .replace('{level}', userData.level.toString());
        
        const embed = new EmbedBuilder()
            .setDescription(levelUpMessage);
    
        await channel.send({ embeds:[ embed ]});
        
        
        const devEmbed = new EmbedBuilder()
            .setDescription(`User: ${member} | Guild: ${guild.name} | Level: \`${userData.level}\``);
        
        await client.utils.DevEmbed('userLevel', client, devEmbed);

    }

    /**
     * Increments command usage count.
     * @param {string} guildId
     * @param {string} userId
     * @returns {Promise<UserLevelsType>}
     */
    async incrementCommands(guildId, userId) {
        const key = `${guildId}:${userId}`;

        const userData = await this.get(guildId, userId);
        userData.totalCommands += 1;

        this.cache.set(key, userData);
        this.dirty.add(key);
        return userData;
    }

    /**
     * Calculates the combined role multiplier for a member.
     * @param {GuildMember & { client: Client }} member
     * @param {GuildLevelsType} levelConfig
     * @returns {number} Combined multiplier
     */
    async getCombinedRoleMultiplier(member, levelConfig) {
        if (!levelConfig.roleMultipliers?.length) {
            return 1;
        }

        const totalBonus = levelConfig.roleMultipliers
            .filter((rm) => member.roles.cache.has(rm.roleId))
            .reduce((total, rm) => total + rm.multiplier, 0);

        return 1 + totalBonus;
    }

    /**
     * Removes a user from cache.
     * @param {string} guildId
     * @param {string} userId
     */
    invalidate(guildId, userId) {
        const key = `${guildId}:${userId}`;

        this.cache.del(key);
        LogData('User Levels Cache', `Cache invalidated for ${guildId}:${userId}`, 'debug');
    }


    /**
 * Gets top users for a guild.
 * Ensures cache is flushed before querying.
 *
 * @param {string} guildId
 * @param {'totalMessages' | 'totalVoice' | 'level' | 'xp'} type
 * @returns {Promise<UserLevelsType[]>}
 */
async getTopUsers(guildId, type) {

    const limit = 15;

    try {

        // Ensure DB is up to date first
        await this.flush();

        const sortQuery = type === 'level' ? { level: -1, xp: -1 } : { [type]: -1 };

        const topUsers = await UserLevels.find({ guildId, [type]: { $gt: 0 } })
            .sort(sortQuery)
            .limit(limit)
            .lean();

        // Refresh cache with latest DB state
        for (const user of topUsers) {
            const key = `${guildId}:${user.userId}`;
            this.cache.set(key, user);
        }

        LogData('User Levels Cache', `Leaderboard refreshed for ${guildId} (${type})`, 'debug');

        return topUsers;

    } catch (error) {
        LogData('User Levels Cache', `Failed leaderboard fetch for ${guildId}: ${error.message}`, 'error');
        return [];
    }
}
}

export default new User_Levels_Cache();