-- CD-028 Option B follow-up — prevent two reviewers claiming the same
-- submission version at once.
--
-- The 20260715120000 fix plus the reviews/page.tsx discoverability change
-- means every reviewer-role account can now see the same unclaimed submission
-- in /reviews. Nothing previously stopped two concurrent "Start review"
-- clicks from both inserting a reviews row for the same submission_version_id
-- (no unique constraint existed on that column). A partial unique index makes
-- the second concurrent insert fail at the database rather than silently
-- creating two open reviews for one submission; reviews/[id]/actions.ts
-- startReview catches the resulting unique-violation (23505) and reports
-- "already started by another reviewer" instead of a generic failure.
create unique index if not exists reviews_one_open_per_version
  on reviews (submission_version_id) where decided_at is null;
