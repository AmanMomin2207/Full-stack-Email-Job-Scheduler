import { RedisMemoryServer } from 'redis-memory-server';

let redisServer: RedisMemoryServer;

export const startRedisServer = async () => {
    try {
        redisServer = new RedisMemoryServer({
            instance: {
                port: 6379, // Try to bind to default port
            }
        });

        await redisServer.start();

        const host = await redisServer.getHost();
        const port = await redisServer.getPort();

        console.log(`[Redis] Local server started at ${host}:${port}`);
        return { host, port };
    } catch (err) {
        console.error('[Redis] Failed to start local server:', err);
        // Fallback or re-throw? 
        // If it fails (e.g. port stored), we might assume an external redis is running?
        console.log('[Redis] Assuming external Redis might be available or startup failed.');
    }
};

export const stopRedisServer = async () => {
    if (redisServer) {
        await redisServer.stop();
    }
};
