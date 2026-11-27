# AI Usage

## Tools used

- GitHub Copilot (Copilot SDK in VS Code) was used as an AI coding assistant
  during this development session.

## How AI assisted

- Reviewed existing feature code and summarized current implementation gaps.
- Assisted with implementing recipe discovery, offline persistence, recipe
  details, favourites, and profile improvements.
- Assisted with TypeScript and ESLint debugging and with writing focused Jest
  tests.
- Drafted project and assignment documentation based on inspected repository
  files and validation output.

## Review and validation

Generated changes were compared with the existing architecture, typed with
`npx tsc --noEmit`, linted with `npx expo lint`, and tested with focused Jest
selectors during implementation. Full-suite, Expo compatibility, and export
results are reported separately after they are run. Device behavior still
requires manual testing.

## Example of a correction during AI-assisted development

An initial Home search-field edit returned a `TextInput` followed by a
conditional clear button without a wrapping parent, producing a TypeScript
syntax error. The code was corrected to render both controls inside a `View`,
and TypeScript validation then passed.

## Author review

- [ ] I reviewed all AI-assisted code and can explain the implementation.
- [ ] I rewrote the project decisions and descriptions in my own words.
- [ ] I verified all manual-test and screenshot claims before submission.
