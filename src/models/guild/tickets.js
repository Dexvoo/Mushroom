import mongoose from 'mongoose';
const { Schema, model } = mongoose;

/**
 * @typedef {Object} TicketConfigType
 * @property {string} guildId
 * @property {boolean} enabled
 * @property {string} setupChannelId
 * @property {string} ticketCategoryId
 * @property {string} archiveChannelId
 * @property {string} supportRoleId
 * @property {string} adminRoleId
 * @property {number} maxTicketsPerUser
 * @property {number} lastTicketId
 */
const TicketConfigSchema = new Schema({
  guildId: { type: String, required: true },
  enabled: { type: Boolean, default: true },
  setupChannelId: { type: String, required: true },
  ticketCategoryId: { type: String, required: true },
  archiveChannelId: { type: String, required: true },
  supportRoleId: { type: String, required: true },
  adminRoleId: { type: String, required: true },
  maxTicketsPerUser: { type: Number, default: 3 },
  lastTicketId: { type: Number, default: 0 },
});

const TicketInstanceSchema = new Schema({
  guildId: { type: String, required: true },
  memberId: { type: String, required: true },
  ticketId: { type: String, required: true },
  channelId: { type: String, required: true },
  buttonId: { type: String, required: true },
  open: { type: Boolean, default: true },
  locked: { type: Boolean, default: false },
  transcriptURL: { type: String, default: null },
  createdAt: { type: Date, default: Date.now },
  closedAt: { type: Date, default: null },
  closedBy: { type: String, default: null },
});

export const TicketInstance = model('Guild-Tickets-Users', TicketInstanceSchema);
export const TicketConfig = model('Guild-Tickets-Config', TicketConfigSchema);