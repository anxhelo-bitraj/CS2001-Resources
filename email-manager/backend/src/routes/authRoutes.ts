import { Router } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { upsertUser } from '../services/syncService';
import { seedRestaurantTemplates } from '../db/queries/templateQueries';
import { getDb } from '../db/database';

const router = Router();

router.post('/verify', (req: AuthenticatedRequest, res) => {
  const { displayName } = req.body;
  upsertUser(req.userId!, req.userEmail || '', displayName || '');
  seedRestaurantTemplates(req.userId!);
  res.json({ id: req.userId, email: req.userEmail, displayName });
});

router.get('/me', (req: AuthenticatedRequest, res) => {
  const user = getDb().prepare(`SELECT * FROM users WHERE id = ?`).get(req.userId!) as Record<string, unknown> | undefined;
  if (!user) { res.status(404).json({ error: 'User not found' }); return; }
  res.json({ id: user.id, email: user.email, displayName: user.display_name });
});

router.delete('/logout', (_req, res) => {
  res.json({ success: true });
});

export default router;
