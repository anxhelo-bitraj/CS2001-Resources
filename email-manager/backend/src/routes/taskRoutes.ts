import { Router } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { getTasks, createTask, updateTask, deleteTask } from '../db/queries/taskQueries';

const router = Router();

router.get('/', (req: AuthenticatedRequest, res) => {
  const { done, priority } = req.query as Record<string, string>;
  const opts: { done?: boolean; priority?: string } = {};
  if (done !== undefined) opts.done = done === 'true';
  if (priority) opts.priority = priority;
  res.json(getTasks(req.userId!, opts));
});

router.post('/', (req: AuthenticatedRequest, res) => {
  const task = createTask({
    userId: req.userId!,
    emailId: req.body.emailId,
    description: req.body.description,
    dueDate: req.body.dueDate,
    priority: req.body.priority || 'medium',
    source: 'manual',
  });
  res.status(201).json(task);
});

router.patch('/:id', (req: AuthenticatedRequest, res) => {
  const task = updateTask(req.userId!, parseInt(req.params.id), req.body);
  res.json(task);
});

router.delete('/:id', (req: AuthenticatedRequest, res) => {
  deleteTask(req.userId!, parseInt(req.params.id));
  res.json({ success: true });
});

export default router;
