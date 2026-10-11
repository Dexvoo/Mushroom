import mongoose from 'mongoose';
import { ENV } from '../bootstrap/environment.js';
import { LogData } from '../shared/utils/logger.js';
import { Shutdown } from './shutdown.js';

export async function Database_Connect(client) {
    try {
        await mongoose.connect(ENV.MONGO_URI);
        LogData('MongoDB', 'Connected to the database successfully.', 'success');
    } catch (error) {
        console.error(`Failed to connect to the database: ${error}`);
        await Shutdown('DATABASE FAILURE', client);
    }
}

export async function Database_Disconnect() {
    try {
        if (mongoose.connection.readyState === 1) {
            await mongoose.connection.close();
            LogData('MongoDB', 'Disconnected from the database successfully.', 'success');
        }
    } catch (error) {
        LogData('MongoDB', `Failed to disconnect from server: ${error.message}`, 'error');
    }
}
