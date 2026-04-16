import { Router } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import {
  getTemplates, getTemplateById, createTemplate, updateTemplate,
  deleteTemplate, incrementTemplateUsage, seedRestaurantTemplates,
} from '../db/queries/templateQueries';

const router = Router();

router.get('/', (req: AuthenticatedRequest, res) => {
  const { category } = req.query as Record<string, string>;
  res.json(getTemplates(req.userId!, category));
});

router.get('/:id', (req: AuthenticatedRequest, res) => {
  const t = getTemplateById(req.userId!, parseInt(req.params.id));
  if (!t) { res.status(404).json({ error: 'Template not found' }); return; }
  res.json(t);
});

router.post('/', (req: AuthenticatedRequest, res) => {
  const t = createTemplate({
    userId: req.userId!,
    name: req.body.name,
    category: req.body.category,
    subjectTemplate: req.body.subjectTemplate,
    bodyTemplate: req.body.bodyTemplate,
    variables: JSON.stringify(req.body.variables || []),
  });
  res.status(201).json(t);
});

router.patch('/:id', (req: AuthenticatedRequest, res) => {
  const t = updateTemplate(req.userId!, parseInt(req.params.id), req.body);
  res.json(t);
});

router.delete('/:id', (req: AuthenticatedRequest, res) => {
  deleteTemplate(req.userId!, parseInt(req.params.id));
  res.json({ success: true });
});

router.post('/:id/render', (req: AuthenticatedRequest, res) => {
  const t = getTemplateById(req.userId!, parseInt(req.params.id)) as Record<string, string> | undefined;
  if (!t) { res.status(404).json({ error: 'Template not found' }); return; }

  const vars: Record<string, string> = req.body.variables || {};
  let body = t.body_template;
  let subject = t.subject_template || '';

  for (const [key, value] of Object.entries(vars)) {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    body = body.replace(regex, value);
    subject = subject.replace(regex, value);
  }

  incrementTemplateUsage(parseInt(req.params.id));
  res.json({ subject, body });
});

router.post('/seed', (req: AuthenticatedRequest, res) => {
  seedRestaurantTemplates(req.userId!);
  res.json({ success: true });
});

export default router;
