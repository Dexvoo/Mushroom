import mongoose from 'mongoose';
const { Schema, model } = mongoose;

/**
 * @typedef {Object} VoteType
 * @property {string} userId - The ID of the user who voted.
 * @property {number} votes - The number of votes the user has cast.
 * @property {Date} createdAt - The timestamp when this document was created.
 * @property {Date} updatedAt - The timestamp when this document was last updated.
 */

const VoteSchema = new Schema(
  {
    userId: { type: String, required: true },
    votes: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const UserVotes = model('User-Votes', VoteSchema);