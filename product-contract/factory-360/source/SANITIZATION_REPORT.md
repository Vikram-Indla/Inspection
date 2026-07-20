# API Collection Sanitization Report

The original uploaded API collection was processed locally. The packaged JSON preserves endpoint paths,
methods, headers, parameter names, field structures, enums, descriptions and example schemas.

Removed or replaced:

- Passwords and password confirmations
- Bearer/access tokens
- Password-reset codes
- National IDs
- Email addresses and mobile numbers
- Dates of birth and verification timestamps
- User-profile names/usernames
- Local workstation file paths

Redaction event count: 69

The raw source JSON is intentionally **not included** in this ZIP and must not be committed to Git.
