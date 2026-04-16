import { Router } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { getDb } from '../db/database';

const router = Router();

router.get('/response-times', (req: AuthenticatedRequest, res) => {
  const data = getDb().prepare(`
    SELECT category,
           AVG(response_time_minutes) as avgMinutes,
           COUNT(*) as count,
           ROUND(100.0 * SUM(CASE WHEN within_sla = 1 THEN 1 ELSE 0 END) / COUNT(*), 1) as withinSlaPercent
    FROM response_time_log
    WHERE user_id = ?
    GROUP BY category
  `).all(req.userId!);
  res.json(data);
});

router.get('/sentiment', (req: AuthenticatedRequest, res) => {
  const days = parseInt((req.query.days as string) || '7');
  const cutoff = Math.floor(Date.now() / 1000) - days * 86400;

  const data = getDb().prepare(`
    SELECT date(received_at, 'unixepoch') as date,
           SUM(CASE WHEN ai_sentiment = 'positive' THEN 1 ELSE 0 END) as positive,
           SUM(CASE WHEN ai_sentiment = 'neutral' THEN 1 ELSE 0 END) as neutral,
           SUM(CASE WHEN ai_sentiment = 'negative' THEN 1 ELSE 0 END) as negative,
           SUM(CASE WHEN ai_sentiment = 'urgent' THEN 1 ELSE 0 END) as urgent
    FROM email_cache
    WHERE user_id = ? AND received_at > ? AND folder = 'inbox'
    GROUP BY date(received_at, 'unixepoch')
    ORDER BY date ASC
  `).all(req.userId!, cutoff);
  res.json(data);
});

router.get('/volume', (req: AuthenticatedRequest, res) => {
  const days = parseInt((req.query.days as string) || '30');
  const cutoff = Math.floor(Date.now() / 1000) - days * 86400;

  const data = getDb().prepare(`
    SELECT ai_category as category,
           date(received_at, 'unixepoch') as date,
           COUNT(*) as count
    FROM email_cache
    WHERE user_id = ? AND received_at > ? AND folder = 'inbox'
    GROUP BY ai_category, date(received_at, 'unixepoch')
    ORDER BY date ASC
  `).all(req.userId!, cutoff);
  res.json(data);
});

router.get('/review-scores', (req: AuthenticatedRequest, res) => {
  const data = getDb().prepare(`
    SELECT date(created_at, 'unixepoch') as date,
           AVG(score) as avgScore,
           COUNT(*) as count
    FROM review_response_scores
    WHERE user_id = ? AND score IS NOT NULL
    GROUP BY date(created_at, 'unixepoch')
    ORDER BY date ASC
  `).all(req.userId!);
  res.json(data);
});

export default router;
