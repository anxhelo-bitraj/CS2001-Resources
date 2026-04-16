import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

import { runMigrations } from './db/database';
import { authMiddleware } from './middleware/auth';
import { errorHandler } from './middleware/errorHandler';
import { generalRateLimiter } from './middleware/rateLimiter';

import authRoutes from './routes/authRoutes';
import emailRoutes from './routes/emailRoutes';
import aiRoutes from './routes/aiRoutes';
import contactRoutes from './routes/contactRoutes';
import templateRoutes from './routes/templateRoutes';
import taskRoutes from './routes/taskRoutes';
import reminderRoutes from './routes/reminderRoutes';
import briefingRoutes from './routes/briefingRoutes';
import calendarRoutes from './routes/calendarRoutes';
import analyticsRoutes from './routes/analyticsRoutes';

import { startEmailSyncJob } from './jobs/emailSyncJob';
import { startFollowUpReminderJob } from './jobs/followUpReminderJob';
import { startToneReanalysisJob } from './jobs/toneReanalysisJob';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:4173'], credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(generalRateLimiter);

// Health check (no auth)
app.get('/api/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// All other routes require auth
app.use('/api/auth', authMiddleware, authRoutes);
app.use('/api/emails', authMiddleware, emailRoutes);
app.use('/api/ai', authMiddleware, aiRoutes);
app.use('/api/contacts', authMiddleware, contactRoutes);
app.use('/api/templates', authMiddleware, templateRoutes);
app.use('/api/tasks', authMiddleware, taskRoutes);
app.use('/api/reminders', authMiddleware, reminderRoutes);
app.use('/api/briefing', authMiddleware, briefingRoutes);
app.use('/api/calendar', authMiddleware, calendarRoutes);
app.use('/api/analytics', authMiddleware, analyticsRoutes);

app.use(errorHandler);

runMigrations();

if (process.env.NODE_ENV !== 'test') {
  startEmailSyncJob();
  startFollowUpReminderJob();
  startToneReanalysisJob();
}

app.listen(PORT, () => {
  console.log(`[Server] GM Email Manager backend running on http://localhost:${PORT}`);
});

export default app;
