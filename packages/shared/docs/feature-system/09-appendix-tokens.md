# 09 — Recommended runtime tokens / tags

Centralize tokens in a constants file so engine and UI use identical strings.

## Runtime triggers / effect tokens
- `inspire_greatness_active`
- `rage_active`
- `bardic_music_active`
- `countersong_active`

## Attack type tags
- `sneak_attack`
- `unarmed`
- `melee`
- `ranged`
- `spell`

## Effect / target tags
- `fear`
- `charm`
- `trap`
- `poison`
- `undead`
- `dragon`

## Other context tags
- `mounted`
- `flanking`
- `flat_footed`
- `prone`

> Keep this list in a single constants file and import it into UI, server, and automation agents.
