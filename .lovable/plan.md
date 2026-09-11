# Correct labels, dates, links, and mobile layout

## Changes
- Add one shared date formatter in `src/components` that converts valid `YYYY-MM-DD` values to `1 Jan 2027` and preserves invalid input.
- Replace source “Checked” labels with “Retrieved”, while preserving route verification labels and formatting their dates.
- Format retrieved, verified, effective, and upcoming-change dates wherever they appear in the UI.
- Correct the footer, home trust statement, and methodology repository link exactly as requested.
- Adjust `/check` and `/results` layout at 375px so headings, badges, labels, controls, and checklist rows wrap without horizontal overflow while retaining desktop layouts.

## Validation
- Run the existing typecheck and focused tests.
- Inspect `/check` and `/results` at 375px and desktop width, checking for sideways overflow and readable wrapping.

## Scope
Only files under `src/routes` and `src/components` will be changed. Visa rules and data remain untouched.
