import cron from 'node-cron';
import { getStaleToneProfiles } from '../db/queries/toneQueries';
import { analyzeToneForContact } from '../services/toneService';

export function startToneReanalysisJob() {
  const schedule = process.env.TONE_REANALYSIS_CRON || '0 2 * * *';

  cron.schedule(schedule, async () => {
    console.log('[Tone] Running nightly tone re-analysis...');
    const stale = getStaleToneProfiles(30) as Array<Record<string, unknown>>;

    for (const profile of stale) {
      try {
        await analyzeToneForContact(profile.user_id as string, profile.contact_email as string);
        console.log(`[Tone] Re-analyzed profile for ${profile.contact_email}`);
      } catch (err) {
        console.error(`[Tone] Failed for ${profile.contact_email}:`, err);
      }
    }
  });

  console.log(`[Tone] Re-analysis job scheduled: ${schedule}`);
}
