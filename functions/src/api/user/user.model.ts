import { model, Schema } from 'mongoose';
import { User } from './user';

const userSchema = new Schema({
  walletAddress: { type: String, required: true },
  id: {
    type: String,
    required: true,
    default: () => Math.random().toString(36).substring(2, 12).toUpperCase(),
    index: { unique: true },
  },
  idIsUsed: { type: Boolean, default: false },
  score: { type: Number, default: 0 },
});

export const UserModel = model<User>('users', userSchema);
