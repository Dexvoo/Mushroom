import mongoose from 'mongoose';
const { Schema, model } = mongoose;


/**
 * @typedef {Object} LogsType
 * @property {Boolean} enabled
 * @property {String} channelId
 */

const LogChannelSchema = new Schema(
  {
    enabled: { type: Boolean, default: false },
    channelId: { type: String, default: null },
  },
  { _id: false }
);

/**
 * @typedef {Object} LogsConfigType
 * @property {string} guildId
 * @property {LogsType} message
 * @property {LogsType} channel
 * @property {LogsType} join
 * @property {LogsType} leave
 * @property {LogsType} voice
 * @property {LogsType} role
 * @property {LogsType} server
 * @property {LogsType} member
 * @property {LogsType} punishment
 * @property {string[]} ignoredChannels
 *
 *
 */
const LogsConfigSchema = new Schema(
  {
    guildId: { type: String, required: true, unique: true },
    message: LogChannelSchema,
    channel: LogChannelSchema,
    join: LogChannelSchema,
    leave: LogChannelSchema,
    voice: LogChannelSchema,
    role: LogChannelSchema,
    server: LogChannelSchema,
    member: LogChannelSchema,
    punishment: LogChannelSchema,

    ignoredChannels: { type: [String], default: [] }, // Add this line
  },
  { timestamps: true }
);

export const LogsConfig = model('Guild-Logs-Config', LogsConfigSchema);
