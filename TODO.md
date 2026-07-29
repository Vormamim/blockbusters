# TODO — deploy fix for vormamim.com

## What's broken

`data/` and `assets/` never made it onto the live host, even though the code did.
Confirmed by checking these directly — all four return 404:

- https://www.vormamim.com/blockbusters/data/sample-year7-computing.csv
- https://www.vormamim.com/blockbusters/data/sample-year11-se.csv
- https://www.vormamim.com/blockbusters/assets/blockbusters_landing.png
- https://www.vormamim.com/blockbusters/assets/tvshow.png

Meanwhile `app.js` and `style.css` on the live site are already the current
versions (checked — `app.js` has the full `SAMPLE_DECKS` list including Year 7
Computing). So this isn't a stale deploy, it's specifically the two subfolders
missing. The zip itself is fine (verified locally, both PNGs and all 6 CSVs
present at full size) — most likely cause is files were uploaded individually
rather than by extracting the zip in place, which usually can't carry
subfolder structure.

## What to do

1. `dist/` and `blockbusters.zip` are gitignored (build output, not committed),
   so on a fresh PC run first:
   ```
   npm run build
   Compress-Archive -Path dist\* -DestinationPath blockbusters.zip -Force
   ```
2. On vormamim.com's file manager, go to the `/blockbusters/` folder.
3. Upload `blockbusters.zip` there and use the host's "Extract" action on it
   (recreates `data/` and `assets/` automatically) — **or**, if there's no
   extract feature, manually create `data/` and `assets/` subfolders and
   upload every file from local `dist/data/` and `dist/assets/` into them.
4. Verify by re-checking the four URLs above — they should return the actual
   file content, not a 404.

See `README.md`'s "Deploying" section for the full build/zip commands.
