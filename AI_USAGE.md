# AI Usage Disclosure

## Tools used

- **OpenAI Codex (this session):** used to inspect the existing codebase and draft the submission documentation: setup instructions, environment-variable reference, architecture overview, API summary, limitations, technical decisions, and this disclosure.

No AI-generated source-code changes were made in this documentation pass. If other AI tools were used while the application itself was built, add them here before submitting so this record remains complete and accurate.

## How AI output was reviewed

AI drafts were checked against the repository's routes, models, configuration, seed script, frontend API client, and test files. Documentation was edited to describe only behavior present in the code and to separate development/demo behavior from production guidance.

## Reviewed and changed AI suggestions

1. **Admin account documentation:** The initial documentation idea was to describe a generic administrator login. It was changed to the actual seeded account, `alice@example.com`, with its documented demo password, and explicitly states that `npm run seed` must be run first.
2. **Frontend configuration:** A generic draft suggested a frontend `VITE_API_URL` variable. It was removed because the actual frontend uses the Vite `/api` proxy configured in `Frontend/vite.config.ts`; inventing an unused variable would be misleading.
3. **Database safety:** The environment-file example was reviewed and changed to placeholders. A connection string with credentials does not belong in a committed sample configuration, even for a development project.

## Rejected or suboptimal AI suggestion

An AI-style generic recommendation to describe local-storage JWT persistence as a production-ready authentication design was rejected as suboptimal. The documentation now identifies it as an assessment-friendly convenience and explains that secure HTTP-only cookies plus refresh-token handling should be considered for production.

## Work deliberately retained as human-owned

The repository's application behavior remains the source of truth: role definitions, task/comment authorization rules, API contract, models, configuration, and tests were not blindly changed from AI output. The final documentation was constrained to observed code behavior, and the security and tradeoff statements were selected to make the limitations clear to reviewers.

## Submission note

This disclosure covers the AI assistance used for the current documentation work. The submitter should update it if they used additional tools or made implementation changes after this document was prepared.
