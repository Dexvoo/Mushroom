import { UserLevels } from '../../../features/levels/models/userLevels.js';
import NodeCache from 'node-cache';
import { LogData } from '../../../shared/utils/logger.js';
import { EmbedBuilder } from 'discord.js';
import { LevelForExp, MessageXP, VoiceXP } from '../utils/levels.js';

/**
 * @typedef {Object} LevelReward
 * @property {number} level
 * @property {string} roleId
 */

/**
 * @typedef {import('../../../core/extendedClient.js').default} Client
 * @typedef {import('../models/userLevels.js').UserLevelsType} UserLevelsType
 * @typedef {import('../models/guildLevels.js').GuildLevelsType} GuildLevelsType
 */

class User_Levels_Cache {
    /**
     * @private
     * @type {NodeCache}
     */
    cache;
    /** @type {Set<string>} Keys with changes not yet written to the database */
    dirty;
    /** @type {Promise<void> | null} */
    flushing = null;

    constructor() {
        // 1 hour cache TTL
        this.cache = new NodeCache({
            stdTTL: 3600,
            checkperiod: 120,
        });
        this.dirty = new Set();

        setInterval(() => {
            this.flush();
        }, 30000);
    }

    /**
     * Stores changed user data and queues it for the next flush.
     * Dirty entries never expire, so unsaved changes can't be lost to the TTL.
     * @private
     * @param {string} key
     * @param {UserLevelsType} userData
     */
    markDirty(key, userData) {
        this.cache.set(key, userData, 0);
        this.dirty.add(key);
    }

    /**
     * Writes all dirty users to the database in one bulk write.
     * Concurrent calls share the in-progress flush.
     * @returns {Promise<void>}
     */
    flush() {
        if (!this.flushing) {
            this.flushing = this._flush().finally(() => {
                this.flushing = null;
            });
        }
        return this.flushing;
    }

    /** @private */
    async _flush() {
        if (this.dirty.size === 0) return;

        // Take the current dirty keys; changes made during the write re-mark their key
        const keys = [...this.dirty];
        this.dirty.clear();

        const operations = [];
        for (const key of keys) {
            const data = this.cache.get(key);
            if (!data) continue;

            // eslint-disable-next-line no-unused-vars
            const { _id, __v, guildId, userId, ...fields } = data;

            operations.push({
                updateOne: {
                    filter: { guildId, userId },
                    update: { $set: fields },
                    upsert: true,
                },
            });
        }

        if (operations.length === 0) return;

        try {
            await UserLevels.bulkWrite(operations, { ordered: false });

            // Saved entries can expire normally again, unless they changed during the write
            for (const key of keys) {
                if (!this.dirty.has(key)) this.cache.ttl(key);
            }

            LogData('User Levels Cache', `Flushed ${operations.length} users to database`, 'debug');
        } catch (error) {
            // Re-queue so the next flush retries them
            for (const key of keys) this.dirty.add(key);
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
     * Reading does not mark the user dirty; only changes do.
     * @param {string} guildId
     * @param {string} userId
     * @returns {Promise<UserLevelsType | null>} null if the database lookup failed
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

            return userData;
        } catch (error) {
            // Returning a default here would let a later flush overwrite the user's real data
            LogData('User Levels Cache', `Failed to get user data for ${guildId}:${userId}: ${error.message}`, 'error');
            return null;
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

            // eslint-disable-next-line no-unused-vars
            const { _id, __v, ...fields } = data;

            const updated = await UserLevels.findOneAndUpdate(
                { guildId, userId },
                { $set: fields },
                {
                    upsert: true,
                    returnDocument: 'after',
                    lean: true,
                    setDefaultsOnInsert: true,
                }
            );

            this.cache.set(key, updated);
            this.dirty.delete(key);

            return updated;
        } catch (error) {
            LogData(
                'User Levels Cache',
                `Failed to save user data for ${guildId}:${userId}: ${error.message}`,
                'error'
            );
            throw error;
        }
    }

    /**
     * Adds message XP to a user.
     * @param {import('discord.js').GuildMember & { client: Client }} member
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

        const [newLevel] = LevelForExp(userData.xp);
        const leveledUp = newLevel > oldLevel;

        if (leveledUp) {
            userData.level = newLevel;
            userData.lastLevelUpAt = new Date();
        }

        // Persist XP before level-up side effects so a failed reward/message can't lose it
        this.markDirty(key, userData);

        if (leveledUp) {
            const rewards = await this.rewards(member, guildData, userData);
            await this.send(member, guildData, userData, rewards);
        }

        return true;
    }

    /**
     * Adds Voice XP to a user.
     * @param {import('discord.js').GuildMember & { client: Client }} member
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

        const [newLevel] = LevelForExp(userData.xp);
        const leveledUp = newLevel > oldLevel;

        if (leveledUp) {
            userData.level = newLevel;
            userData.lastLevelUpAt = new Date();
        }

        // Persist XP before level-up side effects so a failed reward/message can't lose it
        this.markDirty(key, userData);

        if (leveledUp) {
            const rewards = await this.rewards(member, guildData, userData);
            await this.send(member, guildData, userData, rewards);
        }

        return true;
    }

    /**
     * Sends the level-up message.
     * @param {import('discord.js').GuildMember & { client: Client }} member
     * @param {GuildLevelsType} guildData
     * @param {UserLevelsType} userData
     * @param {{ added: LevelReward[], removed: LevelReward[], failed: LevelReward[] }} rewards
     * @returns {Promise<boolean>}
     */
    async send(member, guildData, userData, rewards = { added: [], removed: [], failed: [] }) {
        const { guild, client } = member;

        const channelId = guildData.channelId;
        const channel = guild.channels.cache.get(channelId);

        if (!channel?.isTextBased()) return false;

        const levelUpMessageTemplate = guildData.levelUpMessage || '{user} leveled up to **{level}**!';
        const levelUpMessage = levelUpMessageTemplate
            .replaceAll('{user}', member.toString())
            .replaceAll('{level}', userData.level.toString());

        const embed = new EmbedBuilder().setDescription(levelUpMessage);

        if (rewards.added.length > 0)
            embed.addFields({
                name: 'Added Rewards',
                value: rewards.added.map((reward) => `<@&${reward.roleId}>`).join(', '),
                inline: true,
            });
        if (rewards.removed.length > 0)
            embed.addFields({
                name: 'Removed Rewards',
                value: rewards.removed.map((reward) => `<@&${reward.roleId}>`).join(', '),
                inline: true,
            });
        if (rewards.failed.length > 0)
            embed.addFields({
                name: 'Failed Rewards',
                value: rewards.failed.map((reward) => `<@&${reward.roleId}>`).join(', '),
                inline: true,
            });

        try {
            await channel.send({ embeds: [embed] });
        } catch (error) {
            LogData('User Levels Cache', `Failed to send level up message in ${guild.id}: ${error.message}`, 'error');
            return false;
        }

        if (client.shard) {
            const devEmbed = new EmbedBuilder().setDescription(
                `User: ${member} | Guild: ${guild.name} | Level: \`${userData.level}\``
            );

            await client.utils
                .DevEmbed('userLevel', client, devEmbed)
                .catch((error) => LogData('User Levels Cache', `Failed to send dev embed: ${error.message}`, 'error'));
        }

        return true;
    }

    /**
     * Handles level reward roles for a member.
     *
     * @param {import('discord.js').GuildMember} member
     * @param {GuildLevelsType} guildData
     * @param {UserLevelsType} userData
     * @returns {Promise<{ added: LevelReward[], removed: LevelReward[], failed: LevelReward[] }>}
     */
    async rewards(member, guildData, userData) {
        const { guild } = member;

        const rewards = [...(guildData.rewards ?? [])]
            .filter((reward) => reward?.level && reward?.roleId)
            .sort((a, b) => b.level - a.level);

        if (!rewards.length) return { added: [], removed: [], failed: [] };

        const removePastRewards = guildData.removePastRewards === true;

        const added = [];
        const removed = [];
        const failed = [];

        const currentReward = rewards.find((reward) => reward.level <= userData.level);
        if (!currentReward) return { added, removed, failed };

        const currentRole = guild.roles.cache.get(currentReward.roleId);

        if (!currentRole) {
            failed.push(currentReward);
            return { added, removed, failed };
        }

        if (!member.roles.cache.has(currentReward.roleId)) {
            try {
                await member.roles.add(currentRole);
                added.push(currentReward);
            } catch {
                failed.push(currentReward);
            }
        }

        if (removePastRewards) {
            const oldRewards = rewards.filter((reward) => {
                return reward.level < currentReward.level;
            });

            for (const reward of oldRewards) {
                if (!member.roles.cache.has(reward.roleId)) continue;

                const role = guild.roles.cache.get(reward.roleId);
                if (!role) {
                    failed.push(reward);
                    continue;
                }

                try {
                    await member.roles.remove(role);
                    removed.push(reward);
                } catch {
                    failed.push(reward);
                }
            }
        }

        return { added, removed, failed };
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
        if (!userData) return null;

        userData.totalCommands += 1;

        this.markDirty(key, userData);
        return userData;
    }

    /**
     * Calculates the combined role multiplier for a member.
     * @param {import('discord.js').GuildMember} member
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

        if (this.dirty.has(key)) {
            LogData('User Levels Cache', `Skipped invalidating ${guildId}:${userId}: unsaved changes`, 'warning');
            return;
        }

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

            // Warm the cache, but never overwrite an entry that may hold newer, unsaved changes
            for (const user of topUsers) {
                const key = `${guildId}:${user.userId}`;
                if (!this.cache.has(key)) this.cache.set(key, user);
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
