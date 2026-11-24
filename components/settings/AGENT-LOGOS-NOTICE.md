# Agent logos — provenance and licence

The marks in `AgentLogos.tsx` are inline SVG paths, so the colour comes from
the theme (`fill="currentColor"`) and nothing is drawn as a coloured tile on
the page. They were previously served as files from `public/agents/`; those
files are gone, because their `fill` attribute carried the brand colour and
made the row look like a set of stickers.

| Agent | Mark | Source | Licence |
| --- | --- | --- | --- |
| Claude Code | Claude | [simple-icons](https://simpleicons.org) slug `claude` | CC0-1.0 (public domain) |
| Cursor | Cursor | [simple-icons](https://simpleicons.org) slug `cursor` | CC0-1.0 (public domain) |
| Gemini | Gemini | [simple-icons](https://simpleicons.org) slug `googlegemini` | CC0-1.0 (public domain) |
| Codex | Codex | the Codex mark served by [skills.sh](https://www.skills.sh) (`/agents/codex.svg`) | trademark of its owner; used here only to name the tool |
| Hermes | Wing | Nous Research wing mark (official site asset) | trademark of its owner; used here only to name the tool |

Notes:

- simple-icons releases the artwork under CC0-1.0. CC0 covers the artwork
  only; the trademarks of the brands stay with their owners. These marks are
  used nominatively, to say which agents this app can be connected to.
- The Codex path is the glyph that skills.sh serves, with the black plate
  behind it removed and the `viewBox` cropped to the ink, so it inherits the
  theme colour instead of printing a black square on a light page.
- The Hermes path is the Nous Research wing mark, silhouette only. The mark
  served by skills.sh is a bitmap pattern and could not be used as a vector.
