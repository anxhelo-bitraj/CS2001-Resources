import { Router } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { getCalendarEvents, createCalendarEvent } from '../services/graphService';

const router = Router();

router.get('/events', async (req: AuthenticatedRequest, res, next) => {
  try {
    const now = new Date();
    const from = (req.query.from as string) || now.toISOString();
    const to = (req.query.to as string) || new Date(now.getTime() + 7 * 86400000).toISOString();

    const events = await getCalendarEvents(req.accessToken!, from, to);
    res.json(events.map((e) => ({
      id: e.id,
      subject: e.subject,
      start: e.start.dateTime,
      end: e.end.dateTime,
      location: e.location?.displayName,
      isOnlineMeeting: e.isOnlineMeeting,
      attendees: e.attendees?.map((a) => a.emailAddress.address),
    })));
  } catch (err) {
    next(err);
  }
});

router.post('/events', async (req: AuthenticatedRequest, res, next) => {
  try {
    const event = await createCalendarEvent(req.accessToken!, req.body);
    res.status(201).json(event);
  } catch (err) {
    next(err);
  }
});

export default router;
