# Campaign banner drop folder

Put the Figma exports here, then tell Claude. They get cropped to the card's
382:305 aspect, re-encoded to 1146x915 WebP, uploaded to Supabase Storage under
a fresh path, and written onto the matching `campaign` row.

Export the frame WITHOUT the "Дэлгэрэнгүй Үзэх" pill — the platform draws that
itself, so a baked-in one doubles up.

Export at 3x or 4x. Anything at 1x (382x305) has to be upscaled and looks soft.

Filenames must match these slugs (extension can be .png or .jpg):

  ayanga.png        → Ayanga — Back to School
  pocco.png         → Pocco Mix
  isispharma.png    → ISIS Pharma
  univision.png     → Univision
  ubeats.png        → Ubeats
  ubcab.png         → UB Cab Express
  astonish.png      → Astonish
  lg.png            → LG H&H — Fiji
  koko.png          → KOKO
  liquidsalad.png   → Liquid Salad

Partial drops are fine — only the files present get processed.
