import { Router } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { getContacts, getContactByEmail, upsertContact, updateContact, deleteContact } from '../db/queries/contactQueries';

const router = Router();

router.get('/', (req: AuthenticatedRequest, res) => {
  res.json(getContacts(req.userId!));
});

router.get('/:email', (req: AuthenticatedRequest, res) => {
  const contact = getContactByEmail(req.userId!, decodeURIComponent(req.params.email));
  if (!contact) { res.status(404).json({ error: 'Contact not found' }); return; }
  res.json(contact);
});

router.post('/', (req: AuthenticatedRequest, res) => {
  const { id, displayName, category } = req.body;
  upsertContact({ id: id.toLowerCase(), userId: req.userId!, displayName, category });
  res.json({ success: true });
});

router.patch('/:email', (req: AuthenticatedRequest, res) => {
  updateContact(req.userId!, decodeURIComponent(req.params.email), req.body);
  const contact = getContactByEmail(req.userId!, decodeURIComponent(req.params.email));
  res.json(contact);
});

router.delete('/:email', (req: AuthenticatedRequest, res) => {
  deleteContact(req.userId!, decodeURIComponent(req.params.email));
  res.json({ success: true });
});

export default router;
