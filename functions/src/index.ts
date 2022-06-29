import * as dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

mongoose.connect(<string>process.env.MONGODB_URL);

export * from './api/user/user.functions';
