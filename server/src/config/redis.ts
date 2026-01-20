import { Redis } from 'ioredis';
import dotenv from 'dotenv';
dotenv.config();

export const redisConfig = {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    maxRetriesPerRequest: null, // Required for BullMQ
};

export const redisConnection = new Redis(redisConfig);

redisConnection.on('connect', () => {
    console.log('Redis connected');
});

redisConnection.on('error', (err) => {
    console.error('Redis error:', err);
});
