# Simplified Chinese card provenance

## Source and authorship

The `zh-CN` Buzzwort deck in `src/server/content/buzzwortCards.ts` was created
for the LAN Party Hub localization on 2026-07-29. OpenAI Codex assisted with
the initial drafting and structural validation. No website, dictionary export,
commercial card deck, existing party-game question bank, or other external
word-list dataset was queried, copied, scraped, or translated to create it.

The terms were selected from general everyday knowledge. Drafting deliberately
avoided product and platform brands, named fictional characters, film or
television properties, song or book text, and distinctive commercial-game
card wording. Contributors offer their original selection and wording under
the repository's Apache-2.0 terms, subject to the final review described below.

## Structure

- 120 cards with sequential IDs `zh-CN-001` through `zh-CN-120`.
- Ten existing internal categories with exactly 12 cards each.
- Exactly five non-empty, unique forbidden terms on every card.
- Unique target terms, with no forbidden term exactly equal to its target.
- Difficulty totals of 50 easy, 50 medium, and 20 hard cards.

Automated Node tests enforce these structural properties and verify that
`zh-CN` selects this deck instead of falling back to German.

## Review status and remaining risk

The deck still requires maintainer review for natural phrasing, regional
comprehension, cultural sensitivity, balance, accidental ambiguity, and final
rights clearance before a public store or commercial release. AI assistance
and structural checks do not replace that review.

The German and English decks were inherited from
`Hartwich/buzzwort@10f336ecb14400e505e67b6476aaa188712539c9`. Their upstream
README already calls for a word-list rights review. This document does not
claim independent provenance or commercial clearance for those inherited
decks.
