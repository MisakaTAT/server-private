import { db, op } from '@app/drizzle/db.ts';
import * as schema from '@app/drizzle/schema';

import * as convert from './convert.ts';
import type * as res from './res.ts';

export async function fetchSlimUserByUsername(username: string): Promise<res.ISlimUser | null> {
  const data = await db
    .select()
    .from(schema.chiiUser)
    .where(op.eq(schema.chiiUser.username, username))
    .execute();
  for (const d of data) {
    return convert.toSlimUser(d);
  }
  return null;
}

export async function fetchSlimSubjectByID(
  id: number,
  allowNsfw = false,
): Promise<res.ISlimSubject | null> {
  const data = await db
    .select()
    .from(schema.chiiSubjects)
    .where(
      op.and(
        op.eq(schema.chiiSubjects.id, id),
        op.eq(schema.chiiSubjects.ban, 0),
        allowNsfw ? undefined : op.eq(schema.chiiSubjects.nsfw, false),
      ),
    )
    .execute();
  for (const d of data) {
    return convert.toSlimSubject(d);
  }
  return null;
}

export async function fetchSubjectByID(
  id: number,
  allowNsfw = false,
): Promise<res.ISubject | null> {
  const data = await db
    .select()
    .from(schema.chiiSubjects)
    .innerJoin(schema.chiiSubjectFields, op.eq(schema.chiiSubjects.id, schema.chiiSubjectFields.id))
    .where(
      op.and(
        op.eq(schema.chiiSubjects.id, id),
        op.eq(schema.chiiSubjects.ban, 0),
        allowNsfw ? undefined : op.eq(schema.chiiSubjects.nsfw, false),
      ),
    )
    .execute();
  for (const d of data) {
    return convert.toSubject(d.subject, d.subject_field);
  }
  return null;
}
