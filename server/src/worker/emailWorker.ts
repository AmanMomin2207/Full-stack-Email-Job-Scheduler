import { Worker, Job, Queue } from 'bullmq';
import { redisConnection, redisConfig } from '../config/redis';
import { sendEmail } from '../services/emailService';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
export const EMAIL_QUEUE_NAME = 'email-queue';

// Queue definition for producer
export const emailQueue = new Queue(EMAIL_QUEUE_NAME, {
    connection: redisConfig,
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 1000,
        },
        removeOnComplete: true,
    },
});

const MIN_DELAY_MS = 2000; // 2 seconds delay between sends check
const MAX_EMAILS_PER_HOUR = 100; // Configurable

// Worker
export const worker = new Worker(EMAIL_QUEUE_NAME, async (job: Job) => {
    const { id, recipient, subject, body, userId } = job.data;

    // Custom Rate Limiting using Redis
    const now = new Date();
    const currentHour = now.toISOString().slice(0, 13); // 2023-10-27T10
    const rateLimitKey = `rate_limit:${userId}:${currentHour}`;

    const currentCount = await redisConnection.incr(rateLimitKey);

    if (currentCount > MAX_EMAILS_PER_HOUR) {
        console.log(`Rate limit exceeded for user ${userId}. Rescheduling job ${id}.`);
        await job.moveToDelayed(Date.now() + 60 * 60 * 1000, job.token); // Delay by 1 hour (simple retry logic)
        await redisConnection.decr(rateLimitKey);
        throw new Error('Rate limit exceeded');
    }

    // Artificial Delay
    await new Promise(resolve => setTimeout(resolve, MIN_DELAY_MS));

    try {
        console.log(`Processing job ${id} for ${recipient}`);

        // Actually send
        await sendEmail(recipient, subject, body);

        await prisma.emailJob.update({
            where: { id },
            data: { status: 'SENT', sentAt: new Date() }
        });

    } catch (err: any) {
        console.error(`Failed to send email to ${recipient}`, err);
        await prisma.emailJob.update({
            where: { id },
            data: { status: 'FAILED' }
        });
        throw err;
    }
}, {
    connection: redisConfig,
    concurrency: 5,
});

worker.on('completed', (job) => {
    console.log(`Job ${job.id} has completed!`);
});

worker.on('failed', (job, err) => {
    console.log(`Job ${job?.id} has failed with ${err.message}`);
});
