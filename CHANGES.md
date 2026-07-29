# Changes for LAN Party Hub

This branch is an independently maintained derivative of
[Hartwich/buzzwort](https://github.com/Hartwich/buzzwort) at commit
`10f336ecb14400e505e67b6476aaa188712539c9`. Git history remains the detailed
record; this file summarizes the distributed changes.

## Simplified Chinese localization

- Added `zh-CN` language selection without changing the Buzzwort manifest ID,
  protocol shape, input names, scoring rules, or round flow.
- Added Simplified Chinese server, Host, and Controller copy, including setup,
  roles, timers, score labels, event feeds, private-card hints, and ready state.
- Added a 120-card independently drafted Simplified Chinese deck with ten
  categories, five unique forbidden terms per card, and a 50/50/20 difficulty
  distribution.
- Added Chinese system-font fallbacks, Node built-in localization tests, and
  content provenance documentation.

Modified upstream TypeScript and Markdown files carry a prominent LAN Party
Hub modification notice. The comment-free `package.json` records its changes
through this file and `NOTICE.md`.
