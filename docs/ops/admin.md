# Operator runbook — granting and revoking Hygieia admin

Hygieia has no admin UI for admins, no hardcoded operator email and no migration that names a
person. Admin status is one boolean, `hygieia.profiles.is_admin`, and only the operator can set it,
by hand, in SQL. The app reads it (client-side `RequireAdmin` + the admin RLS policies) and never
writes it: the `authenticated` role's column grant on `profiles` excludes `is_admin`, so a client
insert or update that carries the column is rejected by Postgres regardless of what the UI does.

## Before you start

- **The user must have signed in to Hygieia at least once.** The profile row is created
  client-side on the first signed-in session (`src/auth/profile.ts`); there is no trigger on
  `auth.users` (ADR-0003 rule 6). No profile row → the `update` below affects 0 rows. Ask the person
  to open `/auth`, sign in (magic link or Google), and land on the home page first.
- The project is the one shared with Alyssos (ADR-0003). Hygieia owns only schema `hygieia`; the
  snippets below touch nothing else. Run them in the Supabase **SQL editor** of that project (or
  through the Management API with the operator's access token). **Never put them in a migration**
  — a migration is committed code, and committed code must not name a person.
- Email addresses go in the SQL editor only. Nothing under this repo may contain a real one.

## Grant

```sql
update hygieia.profiles
   set is_admin = true
 where user_id = (select id from auth.users where email = '<operator email>');
```

Expected: `UPDATE 1`. `UPDATE 0` means the person has not signed in yet (see above) or the email
differs from the one on their auth user (Google accounts use the Google address).

## Revoke

```sql
update hygieia.profiles
   set is_admin = false
 where user_id = (select id from auth.users where email = '<operator email>');
```

## Verify

```sql
select u.email, p.display_name, p.is_admin
  from hygieia.profiles p
  join auth.users u on u.id = p.user_id
 where p.is_admin;
```

Lists every current admin. The app picks the change up on its next profile read (reload the page;
`useProfile()` runs once per signed-in session).

## What this does NOT do

- It does not create accounts. Accounts are shared Supabase Auth users; sign-up IS the first sign-in.
- It does not change RLS. The admin policies already exist (P1.8) and key on this column through
  `hygieia.is_admin()`; granting the flag is all that is needed for the person to read pending content
  and review it.
