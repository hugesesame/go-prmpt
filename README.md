# GO PRMPT

**English** | [日本語](README.ja.md)

A cue-based prompter for live events. Line up your text in a cue list and send it, one cue at a time, to a separate output window — by pressing Space, at a set time of day, or on timecode (MTC / LTC).

> [!IMPORTANT]
> **Desktop Chrome only.** GO PRMPT does not work on smartphones or tablets. It relies on a keyboard, a separate output window, and Chrome features such as Web MIDI and the File System Access API.

**Open the app: https://hugesesame.github.io/go-prmpt/**

![GO PRMPT](screenshots/main.png)

## Features

- Cue lists split into pages, with GO on the Space key and a NEXT preview
- Separate 16:9 output window, opened on an external display when one is connected
- Countdown and message overlays on top of the output
- Automatic cues by time of day, or by timecode: MTC in, LTC in, or an internal generator with MTC / LTC out
- CLEAR, BLACK OUT and BLINK, dissolve or cut transitions, and colors and outline settings
- SHOW mode that locks editing during the performance
- Save and open show files, and import cues from CSV
- English and Japanese interface

## Getting started

1. Open the app in desktop Chrome.
2. Press **Open Output** in the toolbar and move the output window to your display (press `F` for fullscreen).
3. Press `?` or the **Help** button at the bottom left for the full user guide.

To try it with sample data, download [`samples/sample-show.json`](samples/sample-show.json) and load it with **Open**.

## Your data

Your shows stay on your computer. Edits are saved in the browser automatically, and **Save** writes a show file wherever you choose. Nothing is sent to a server.

## Development

Requires Node.js 20.19+ or 22.12+.

```bash
npm install
npm run dev     # http://localhost:5173
npm run build   # outputs to dist/
```

Every push to `main` is built and published to GitHub Pages by GitHub Actions.
