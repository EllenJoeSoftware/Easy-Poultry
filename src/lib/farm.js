import { api } from '@/api/client';

const safe = async (p) => { try { return (await p) || []; } catch { return []; } };
const cache = new Map(); // email -> { ids, primary, at }
const TTL = 60_000;

/**
 * Resolve the farm ids the signed-in user can see:
 *  - farms they own (Farm.owner_email / Farm.created_by)
 *  - farms they are a member of (FarmMember.member_email → farm_id or farm_owner_email)
 * Returns { ids: string[], primary: string|null }. Cached for 60s per user.
 */
export async function getUserFarms(user) {
  if (!user?.email) return { ids: [], primary: null };
  const email = user.email;
  const hit = cache.get(email);
  if (hit && Date.now() - hit.at < TTL) return hit;

  const ids = new Set();
  const [owned, created, memberships] = await Promise.all([
    safe(api.entities.Farm.filter({ owner_email: email })),
    safe(api.entities.Farm.filter({ created_by: email })),
    safe(api.entities.FarmMember.filter({ member_email: email })),
  ]);
  const ownedList = [...owned, ...created].filter(f => f?.id);
  ownedList.forEach(f => ids.add(f.id));

  memberships.forEach(m => { if (m?.farm_id) ids.add(m.farm_id); });
  const ownerEmails = [...new Set(memberships.map(m => m?.farm_owner_email).filter(Boolean))];
  if (ownerEmails.length) {
    const farms = await Promise.all(ownerEmails.map(e => safe(api.entities.Farm.filter({ created_by: e }))));
    farms.flat().forEach(f => f?.id && ids.add(f.id));
  }
  // If the user owns no farm but a farm_id appears on their own docs, adopt it as primary
  let primary = ownedList[0]?.id || null;
  if (!primary) {
    const mine = await safe(api.entities.PoultryBatch.filter({ created_by: email }));
    const fid = mine.find(b => b?.farm_id)?.farm_id;
    if (fid) { ids.add(fid); primary = fid; }
  }
  if (!primary) primary = [...ids][0] || null;

  const out = { ids: [...ids], primary, at: Date.now() };
  cache.set(email, out);
  return out;
}

export const getUserFarmIds = async (user) => (await getUserFarms(user)).ids;
export const getPrimaryFarmId = async (user) => (await getUserFarms(user)).primary;

/** Fields to stamp on any new farm-scoped document so other apps (mobile) see it. */
export async function farmStamp(user) {
  const primary = await getPrimaryFarmId(user);
  return primary ? { farm_id: primary } : {};
}

/**
 * Fetch an entity for the user: docs they created + docs scoped to any of their farms.
 *  sortField: sorted desc client-side (strings/dates/timestamps).
 *  where: optional extra equality filters applied client-side (e.g. { status: 'active' }).
 *  limit: optional max rows after sorting.
 */
export async function fetchForUserAndFarms(entity, user, sortField = 'created_date', where = null, limit = null) {
  const { ids } = await getUserFarms(user);
  const results = await Promise.all([
    safe(entity.filter({ created_by: user?.email })),
    ...ids.map(id => safe(entity.filter({ farm_id: id }))),
  ]);
  const map = new Map();
  results.flat().forEach(d => d?.id && map.set(d.id, d));
  let rows = [...map.values()];
  if (where) rows = rows.filter(r => Object.entries(where).every(([k, v]) => r[k] === v));
  const val = (d) => { const v = d?.[sortField]; if (!v) return 0; if (v.toDate) return v.toDate().getTime(); const t = new Date(v).getTime(); return Number.isFinite(t) ? t : 0; };
  rows.sort((a, b) => val(b) - val(a));
  return limit ? rows.slice(0, limit) : rows;
}
