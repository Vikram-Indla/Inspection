-- CD-023 / SCR-WEB-130 — enforce the accepted D3 urgency contract at the
-- database boundary. The application server action returns specific localized
-- blockers; this CHECK independently prevents crafted RPC calls from storing
-- an unapproved reason or an unjustified "Other".
--
-- NOT VALID deliberately preserves any historical rows created before this
-- contract correction while enforcing the rule for every new/changed row.
-- Historical normalization, if needed, requires a separately evidenced data
-- remediation; values are never silently rewritten here.
alter table visits drop constraint if exists visits_immediate_reason_contract;
alter table visits add constraint visits_immediate_reason_contract check (
  immediate_creator_role is null
  or (
    nullif(btrim(immediate_reason), '') is not null
    and immediate_reason in (
      'Complaint received',
      'Incident / accident report',
      'Referral from authority',
      'Other'
    )
    and (
      immediate_reason <> 'Other'
      or nullif(btrim(notes), '') is not null
    )
  )
) not valid;

comment on constraint visits_immediate_reason_contract on visits is
  'CD-023 accepted D3 urgency values; Other requires justification in Visit notes.';
