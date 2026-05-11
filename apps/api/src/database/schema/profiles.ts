import { pgTable, text, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { genderEnum } from './enums';
import { createdAt, idPrimaryKey, updatedAt } from './_helpers';
import { users } from './users';

/**
 * Display/contact info, separated from auth identity so PII concerns don't
 * bleed into the user/login path. One-to-one with `users` via FK.
 */
export const profiles = pgTable(
  'profiles',
  {
    id: idPrimaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    fullName: text('full_name').notNull(),
    phone: text('phone'),
    gender: genderEnum('gender'),
    address: text('address'),
    avatarUrl: text('avatar_url'),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => ({
    profilesUserIdUq: uniqueIndex('profiles_user_id_uq').on(t.userId),
    profilesPhoneUq: uniqueIndex('profiles_phone_uq').on(t.phone),
  }),
);

export type ProfileRow = typeof profiles.$inferSelect;
export type NewProfileRow = typeof profiles.$inferInsert;
