# Notice

## Upstream work

Buzzwort is derived from
[Hartwich/buzzwort](https://github.com/Hartwich/buzzwort), fixed for this work
at commit `10f336ecb14400e505e67b6476aaa188712539c9`. The upstream repository
declares the code under the Apache License 2.0; the unmodified license text is
retained in `LICENSE`.

LAN Party Hub is an independently maintained derivative. It is not an official
Hartwich/Open Party Lab release and is not endorsed by the upstream maintainer.
Internal `@open-party-lab/*` package names and the `buzzwort` protocol identity
are retained for compatibility.

## LAN Party Hub modifications

Files changed from the fixed upstream revision carry this notice where their
format supports comments:

```text
Modified for LAN Party Hub; see CHANGES.md and NOTICE.md.
```

`package.json` cannot safely contain a comment. Its test script and package
file list are therefore recorded here and in `CHANGES.md`. New files authored
for this localization are distinguishable through Git history.

## Content notice

The 120 Simplified Chinese cards were independently drafted for LAN Party Hub
with OpenAI Codex assistance and were not copied, scraped, or translated from
an external word list or commercial party-game deck. The drafting constraints,
mechanical checks, and review status are recorded in
`docs/content-provenance.md`.

The inherited German and English decks remain exactly the kind of word-list
content that the upstream README marks for a separate rights review. Their
presence in an Apache-2.0 code repository must not be treated as a completed
commercial-distribution clearance. The new Chinese deck also requires final
maintainer editorial and rights review before a public store release.
