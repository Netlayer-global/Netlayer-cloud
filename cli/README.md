# NetLayer Cloud CLI

The official command-line interface for [NetLayer Cloud](https://netlayer.com).
Manage servers, look up the catalog, and check your account from any terminal.

## Install

From the repo while we're pre-publish:

```bash
cd cli
npm install
npm run build
npm link
```

Once published:

```bash
npm install -g @netlayer/cli
```

## Quick start

```bash
nl login                  # opens an interactive auth prompt
nl whoami                 # confirm you're authenticated
nl plans                  # browse available plans
nl regions                # browse regions
nl server create          # interactive deploy wizard
nl server list            # see your fleet
nl server power <id> stop # power actions
nl server destroy <id>    # tear down (with confirmation)
```

## Configuration

All state lives in the OS config directory:

```bash
nl config show            # see current config
nl config set api-url https://api.netlayer.com
nl config set api-key nlt_xxx
```

Environment variables are read on first run:

- `NETLAYER_API_URL` — defaults to `http://localhost:5000/api`
- `NETLAYER_API_KEY` — overrides the saved key for one-off commands

## Non-interactive use

Every interactive prompt has a flag equivalent. CI pipelines should stick to
flags + `--yes` to skip confirmations:

```bash
nl server create \
  --name web-01 \
  --region bom1 \
  --plan c3.large \
  --os ubuntu-22-04
```

## Aliases

`nl` is shorthand for `netlayer`; `server`, `servers`, and `srv` all work.

## License

MIT
