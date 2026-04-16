import { Router } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { getDb } from '../db/database';
import { generateDailyBriefing } from '../services/briefingService';
import { format } from 'date-fns';

const router = Router();

router.get('/', async (req: AuthenticatedRequest, res, next) => {
  try {
    const date = format(new Date(), 'yyyy-MM-dd');
    const existing = getDb()
      .prepare(`SELECT * FROM daily_briefings WHERE user_id = ? AND briefing_date = ?`)
      .get(req.userId!, date);

    if (existing) { res.json(existing); return; }

    const result = await generateDailyBriefing(req.userId!, req.accessToken!);
    res.json({ ...result, briefing_date: date });
  } catch (err) {
    next(err);
  }
});

router.get('/:date', (req: AuthenticatedRequest, res) => {
  const briefing = getDb()
    .prepare(`SELECT * FROM daily_briefings WHERE user_id = ? AND briefing_date = ?`)
    .get(req.userId!, req.params.date);
  if (!briefing) { res.status(404).json({ error: 'Briefing not found for this date' }); return; }
  res.json(briefing);
});

router.post('/regenerate', async (req: AuthenticatedRequest, res, next) => {
  try {
    const result = await generateDailyBriefing(req.userId!, req.accessToken!);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

export default router;
