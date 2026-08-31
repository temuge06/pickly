# GIP webfonts

The MVP design (Figma `JLqMihd0UwHkxgu9f1TbNX`, section **MVP1**) is set entirely
in **GIP** — a licensed Mongolian foundry face, not something we can pull from
Google Fonts. Drop the `.woff2` files here and the whole app picks them up; the
`@font-face` rules in `src/app/globals.css` already point at these exact paths.

Expected filenames (only the weights you actually have are needed — any file
that is missing simply falls through to the fallback stack, no build error):

| file                  | weight | style  | used by                                    |
| --------------------- | ------ | ------ | ------------------------------------------ |
| `gip-ultralight.woff2`| 200    | normal | music-card artist line                      |
| `gip-light.woff2`     | 300    | normal | captions                                    |
| `gip-regular.woff2`   | 400    | normal | body copy, bio, placeholders                |
| `gip-italic.woff2`    | 400    | italic | Q&A question quotes                         |
| `gip-medium.woff2`    | 500    | normal | Copy button, campaign sub-labels            |
| `gip-semibold.woff2`  | 600    | normal | quick-link labels, promo code               |
| `gip-bold.woff2`      | 700    | normal | section titles, usernames, tab labels       |
| `gip-black.woff2`     | 900    | normal | campaign banner headlines                   |

Until they land, `--font-gip` falls back to Montserrat Alternates (already
loaded via `next/font/google`), which shares GIP's single-storey `a`/`g` and
covers Mongolian Cyrillic — so the layout is correct and only the letterforms
differ.

`.woff2` only. Do not commit `.ttf`/`.otf` originals: they are 3–5x the bytes
and every browser we support reads woff2.
