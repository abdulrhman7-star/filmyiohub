# CineHub — Arabic Subtitle Fallback

## Structure

```text
.
├── index.html
├── netlify.toml
├── README.md
└── netlify/
    └── functions/
        ├── tmdb.js
        ├── subtitles.js
        └── subtitle-file.js
```

## Netlify environment variables

Set these in Netlify → Site configuration → Environment variables:

- `TMDB_ACCESS_TOKEN` — TMDB Read Access Token.
- `OPEN_SUBTITLES_API_KEY` — OpenSubtitles.com API key.
- `OPEN_SUBTITLES_USERNAME` — OpenSubtitles.com account username.
- `OPEN_SUBTITLES_PASSWORD` — OpenSubtitles.com account password.
- `OPEN_SUBTITLES_APP_NAME` — optional application name, default `CineHub`.
- `OPEN_SUBTITLES_APP_VERSION` — optional version, default `1.0.0`.

Never put these values inside `index.html`.

## How Arabic fallback works

1. CineHub gets TMDB and IMDb metadata.
2. For a movie it searches OpenSubtitles using the IMDb/TMDB identifiers.
3. For TV episodes it prefers the episode IMDb ID; otherwise it uses the series IMDb ID plus season and episode.
4. The best Arabic result is selected using language, non-machine-translation preference, hearing-impaired flag, download count, year and release information.
5. The subtitle file is requested server-side and exposed to the player as WebVTT through the Netlify `subtitle-file` function.
6. The primary VidSrc adapter receives the documented custom subtitle URL and Arabic default-language setting.
7. If the primary adapter cannot be used, CineHub falls back to a second configured player adapter without trying to bypass iframe security.

## Routes

- `/` — search page
- `/embed/movie/tt11083552` — movie embed
- `/embed/tv/tt0944947/1/1` — TV episode embed

## Important

The external player must support custom subtitle injection for an external WebVTT URL. Cross-origin iframe content is not modified by CineHub JavaScript.

Use only video/player sources you are authorized to embed and use. CineHub does not download, extract, decrypt, or re-host video content.
