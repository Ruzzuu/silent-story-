---
applyTo: "**"
description: "Always enforce a security review for every code update in this workspace. Trigger terms: secure update, vulnerability check, OWASP, auth hardening, Supabase security review."
---
Every code update must include a security pass before completion.

## Required Security Review
For each changed file, verify and report:
- Input validation and sanitization for untrusted data
- Authentication and authorization correctness for privileged actions
- Database/query safety and least-privilege data access
- No hardcoded secrets, tokens, or exposed sensitive configuration
- Injection defenses (SQL, command, template, URL/path)
- Safe rendering of user content (XSS prevention)
- Error and logging hygiene (no sensitive internals leaked)

## Verification
- Run practical checks when available (tests, lint, audit) and report results.
- If a check cannot be run, explicitly state what was skipped and residual risk.

## Response Contract
Include a "Security Review" section in the final response with:
- Findings (ordered high to low, or explicit no-critical-findings)
- Mitigations applied
- Remaining risks and recommended follow-up
