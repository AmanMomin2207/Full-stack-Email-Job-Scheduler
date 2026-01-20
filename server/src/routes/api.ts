import { Router } from 'express';
import multer from 'multer';
import { PrismaClient } from '@prisma/client';
import { emailQueue } from '../worker/emailWorker';
import fs from 'fs';
import csv from 'csv-parser';

const router = Router();
const prisma = new PrismaClient();
const upload = multer({ dest: 'uploads/' });

// Parse CSV
router.post('/parse-csv', upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
    }

    const results: any[] = [];
    fs.createReadStream(req.file.path)
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', () => {
            // Cleanup
            fs.unlinkSync(req.file!.path);
            // Assume CSV has 'email' column, map it
            const emails = results.map(row => row.email || row.Email || Object.values(row)[0]).filter(e => e);
            res.json({ count: emails.length, emails });
        });
});

// Schedule
router.post('/schedule', async (req, res) => {
    // req.body: { emails: string[], subject, body, startTime (ISO), delaySeconds, hourlyLimit }
    const { emails, subject, body, startTime, delaySeconds = 2, hourlyLimit = 100 } = req.body;

    // Ensure authenticated (middleware usage omitted for brevity but required ideally)
    // const userId = req.user?.id;
    // For now assuming req.user is set by passport session, or pass userId explicitly for dev if auth failing
    const userId = (req.user as any)?.id;

    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    let scheduleTime = new Date(startTime).getTime(); // ms
    const delayMs = delaySeconds * 1000;

    // Simple batching logic respecting hourly limit
    let countInWindow = 0;
    let windowStart = scheduleTime;

    const jobsToCreate = [];

    for (const email of emails) {
        // Check if we pushed past the hour window just by delay
        if (scheduleTime >= windowStart + 3600000) {
            windowStart = windowStart + 3600000;
            countInWindow = 0;
            // scheduleTime should catch up to windowStart if it fell behind? 
            // Logic: If plain delay puts us into next window, that's fine.
            // But if we hit LIMIT, we force jump to next window.
        }

        if (countInWindow >= hourlyLimit) {
            // Jump to next hour window
            windowStart += 3600000;
            scheduleTime = windowStart;
            countInWindow = 0;
        }

        const scheduledAt = new Date(scheduleTime);

        jobsToCreate.push({
            email,
            scheduledAt,
        });

        scheduleTime += delayMs;
        countInWindow++;
    }

    // Save to DB and Queue
    // Using prisma transaction if possible, or just sequential
    const createdJobs = [];

    for (const job of jobsToCreate) {
        // DB
        const dbJob = await prisma.emailJob.create({
            data: {
                subject,
                body,
                recipient: job.email,
                scheduledAt: job.scheduledAt,
                status: 'PENDING',
                userId,
            }
        });
        createdJobs.push(dbJob);

        // Queue
        const delay = Math.max(0, job.scheduledAt.getTime() - Date.now());
        await emailQueue.add('send-email', {
            id: dbJob.id, // Job ID for tracking
            recipient: job.email,
            subject,
            body,
            userId,
        }, {
            delay,
            jobId: dbJob.id // Use DB ID as BullMQ Job ID for easy lookup
        });
    }

    res.json({ message: 'Scheduled successfully', count: createdJobs.length });
});

router.get('/scheduled-emails', async (req, res) => {
    const userId = (req.user as any)?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const emails = await prisma.emailJob.findMany({
        where: { userId, status: 'PENDING' },
        orderBy: { scheduledAt: 'asc' }
    });
    res.json(emails);
});

router.get('/sent-emails', async (req, res) => {
    const userId = (req.user as any)?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const emails = await prisma.emailJob.findMany({
        where: {
            userId,
            status: { in: ['SENT', 'FAILED'] }
        },
        orderBy: { sentAt: 'desc' }
    });
    res.json(emails);
});

export default router;
