import mongoose from 'mongoose';
const { Schema, model } = mongoose;

/**
 * @typedef {Object} GiveawayType
 * @property {string} guildId - The ID of the guild where the giveaway is running.
 * @property {string} messageId - The ID of the giveaway message.
 * @property {string} channelId - The ID of the channel where the giveaway is running.
 * @property {string} prize - The prize for the giveaway.
 * @property {Date} endsAt - The timestamp when the giveaway ends.
 * @property {number} winnerCount - The number of winners.
 * @property {string} hostId - The ID of the user hosting the giveaway.
 * @property {string} [requiredRoleId] - The ID of the role required to enter.
 * @property {string[]} entrants - An array of user IDs who have entered.
 * @property {string[]} winners - An array of user IDs who have won.
 * @property {boolean} isActive - Whether the giveaway is currently active.
 */

const GiveawaySchema = new Schema(
  {
    guildId: { type: String, required: true },
    messageId: { type: String, required: true, unique: true },
    channelId: { type: String, required: true },
    prize: { type: String, required: true },
    endsAt: { type: Date, required: true },
    winnerCount: { type: Number, required: true, min: 1 },
    hostId: { type: String, required: true },
    requiredRoleId: { type: String, default: null },
    entrants: { type: [String], default: [] },
    winners: { type: [String], default: [] },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Giveaway = model('Guild-Giveaways', GiveawaySchema);
