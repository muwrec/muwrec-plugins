# IQMax

Vendetta/Kettu-compatible plugin that adds the `/iqmax text:` command. It sends the provided text to an OpenAI Chat Completions-compatible endpoint and posts the rewritten result back into the current channel.

## Install

Once GitHub Pages deployment has completed, paste this source URL into Kettu's plugin installer:

`https://muwrec.github.io/muwrec-plugins/iqmax`

Do not download the repository ZIP. The loader expects a plugin directory URL serving `manifest.json` and `index.js`.

## Configure

Open Discord Settings → Plugins → IQMax settings:

- Base URL, e.g. `https://api.openai.com/v1`
- API key (Bearer token; optional for local endpoints without auth)
- Model name
- Editable system prompt
- Temperature and max tokens

The plugin calls `POST {Base URL}/chat/completions`. For a local server, use its reachable address and keep in mind that cleartext HTTP should only be used on trusted private networks.

## Build / deploy

This repository builds all directories under `plugins/` and publishes to GitHub Pages on pushes to `master`. The workflow generates the final manifest (including SHA-256 hash) and `index.js`. Wait for the deploy workflow to finish before installing/updating the plugin.
