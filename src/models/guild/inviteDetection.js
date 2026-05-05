import mongoose from 'mongoose';
const { Schema, model } = mongoose;

/**
 * @typedef {Object} InviteDetectionType
 * @property {string} guildId - The ID of the guild this configuration applies to.
 * @property {boolean} enabled - Whether the leveling system is enabled.
 */
const InviteDetectionSchema = new Schema({
  guildId: { type: String, required: true },
  enabled: { type: Boolean, default: false },
});

export const InviteDetectionConfig = model('Guild-InviteDetection-Config', InviteDetectionSchema);
