# GO PRMPT

**English** | [日本語](README.ja.md)

A cue-based prompter for live events. Line up your text in a cue list and send it, one cue at a time, to a separate output window — by pressing Space, at a set time of day, or on timecode (MTC / LTC).

> [!IMPORTANT]
> **Desktop Chrome only.** GO PRMPT does not work on smartphones or tablets. It relies on a keyboard, a separate output window, and Chrome features such as Web MIDI and the File System Access API.

**Open the app: https://hugesesame.github.io/go-prmpt/**

> **This is a beta.** GO PRMPT is still being tested and has not been used in a real show yet. MTC and LTC have only been checked with software senders and an audio loopback, not with hardware. Try it with your own equipment before using it in a show.

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

## Running it on your own computer

This part is for people who want to change the app or build it themselves. You do not need it to use the app — just open the link above. It needs Node.js 20.19+ or 22.12+.

```bash
npm install
npm run dev
```

Open the address that appears in the terminal (normally http://localhost:5173/).

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server; changes to the code show up right away |
| `npm run build` | Type-check and build the app into `dist/` |
| `npm run preview` | Open the built app from `dist/` locally |

The public site and your local copy behave a little differently:

| | Public site | Local dev server (localhost) |
|---|---|---|
| What you need | Chrome | Chrome and Node.js |
| Internet | Needed to open the app | Not needed |
| Saved show and settings | Kept for the site | Kept for localhost |
| Microphone, MIDI and window permissions | Asked for the site | Asked again for localhost |

Each one keeps its saved show apart from the other. Use **Save** and **Open** to move a show between them.

| Path | Contents |
|---|---|
| `src/primary/` | The main screen: cue list, pages, overlays, timecode engine, help |
| `src/output/` | The output window |
| `src/components/` | Parts shared by both screens, such as the output view and color picker |
| `src/state.ts` | App state and actions |
| `src/timecode.ts`, `src/mtc.ts`, `src/ltc.ts` | Timecode math, MTC and LTC encoding and decoding |
| `src/csv.ts`, `src/fileio.ts` | CSV import, saving and opening show files |
| `src/i18n.tsx` | English and Japanese text |

Built with React, TypeScript and Vite.

## License

[MIT](LICENSE). You are free to use, change and share GO PRMPT, including at work. It comes with no warranty.
