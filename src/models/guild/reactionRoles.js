import mongoose from 'mongoose';
const { Schema, model } = mongoose;

/**
 * @typedef {Object} ReactionRole
 * @property {string} roleId - The ID of the role to be assigned.
 * @property {string} roleEmoji - The emoji (Unicode or custom) that triggers the role assignment.
 */

/**
 * @typedef {Object} ReactionRolesType
 * @property {string} guildId - The ID of the guild where this reaction role message exists.
 * @property {string} messageId - The unique ID of the message that holds the reactions.
 * @property {string} channelId - The ID of the channel where the message is located.
 * @property {string} name - A human-readable name for this reaction role setup (e.g., "Color Roles").
 * @property {boolean} enabled - Whether this specific reaction role message is active.
 * @property {ReactionRole[]} roles - An array of role and emoji configurations.
 * @property {Date} createdAt - The timestamp when this document was created.
 * @property {Date} updatedAt - The timestamp when this document was last updated.
 */

const ReactionRolesSchema = new Schema(
    {
        guildId: { type: String, required: true, index: true },
        messageId: { type: String, required: true, unique: true },
        channelId: { type: String, required: true },
        title: { type: String, default: 'Default Reaction Roles' },
        enabled: { type: Boolean, default: false },
        roles: {
            type: [
                {
                    roleId: { type: String },
                    roleEmoji: { type: String },
                },
            ],
          default: [],
        },
    },
    { timestamps: true }
);

export const ReactionRoles = model('Guild-Reaction-Roles', ReactionRolesSchema);
