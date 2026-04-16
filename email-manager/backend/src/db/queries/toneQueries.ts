import { getDb } from '../database';

export function getToneProfile(userId: string, contactEmail: string) {
  return getDb()
    .prepare(`SELECT * FROM tone_profiles WHERE user_id = ? AND contact_email = ?`)
    .get(userId, contactEmail.toLowerCase());
}

export function upsertToneProfile(data: {
  userId: string;
  contactEmail: string;
  linguisticProfile: string;
  rawSamples: string;
  sampleCount: number;
}) {
  getDb().prepare(`
    INSERT INTO tone_profiles (user_id, contact_email, linguistic_profile, raw_samples, sample_count, last_analyzed_at, updated_at)
    VALUES (?, ?, ?, ?, ?, unixepoch(), unixepoch())
    ON CONFLICT(user_id, contact_email) DO UPDATE SET
      linguistic_profile = excluded.linguistic_profile,
      raw_samples = excluded.raw_samples,
      sample_count = excluded.sample_count,
      last_analyzed_at = unixepoch(),
      updated_at = unixepoch()
  `).run(data.userId, data.contactEmail.toLowerCase(), data.linguisticProfile, data.rawSamples, data.sampleCount);
}

export function getStaleToneProfiles(staleDays = 30) {
  const staleThreshold = Math.floor(Date.now() / 1000) - staleDays * 86400;
  return getDb()
    .prepare(`SELECT * FROM tone_profiles WHERE last_analyzed_at < ? OR last_analyzed_at IS NULL`)
    .all(staleThreshold);
}

export function incrementToneSampleCount(userId: string, contactEmail: string) {
  getDb()
    .prepare(`UPDATE tone_profiles SET sample_count = sample_count + 1, updated_at = unixepoch() WHERE user_id = ? AND contact_email = ?`)
    .run(userId, contactEmail.toLowerCase());
}
