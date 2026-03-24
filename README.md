# bb - Bitbucket CLI

A lightweight Bitbucket CLI that mirrors [glab](https://gitlab.com/gitlab-org/cli)'s UX. Manage pull requests, pipelines, and more from your terminal.

## Install

```bash
npm install -g @ganeshgaxy/bb-cli
```

Requires Node.js >= 18.

## Quick Start

```bash
# Authenticate (supports App Passwords, Atlassian API Tokens, OAuth tokens)
bb auth login

# List open pull requests
bb pr list -R workspace/repo

# Create a pull request
bb pr create --title "Fix bug" --description "Fixes #123"

# Review, approve, merge
bb pr view 42
bb pr approve 42
bb pr merge 42 --strategy squash

# Monitor pipelines
bb ci list
bb ci logs 15
```

## Authentication

bb supports three auth methods:

| Method | How to create | Auth type |
|--------|--------------|-----------|
| **App Password** | Personal settings > App passwords | Basic Auth |
| **Atlassian API Token** | manage.atlassian.com > API tokens | Basic Auth (auto-detected via `ATATT` prefix) |
| **OAuth / Access Token** | Workspace/Repo/Project settings > Access tokens | Bearer |

```bash
# Interactive
bb auth login

# Non-interactive
bb auth login -u your.email@example.com -t YOUR_TOKEN

# Environment variable (takes precedence)
export BB_TOKEN=your-token

# Verify
bb auth status
```

Credentials stored in `~/.config/bb-cli/config.json` (mode `0600`).

## Commands

### Pull Requests

```bash
bb pr list                         # List open PRs
bb pr create                       # Create PR (interactive)
bb pr view <id>                    # View PR details
bb pr diff <id>                    # View diff
bb pr comments <id>                # Read comments
bb pr comment <id> -m "LGTM"      # Add comment
bb pr approve <id>                 # Approve
bb pr unapprove <id>               # Remove approval
bb pr merge <id>                   # Merge
bb pr decline <id>                 # Close without merging
bb pr checkout <id>                # Checkout branch locally
bb pr update <id> --title "New"    # Update PR fields
```

### Pipelines

Aliased as both `bb pipeline` and `bb ci`:

```bash
bb ci list                         # List recent pipelines
bb ci view <build#>                # View steps and status
bb ci run                          # Trigger pipeline
bb ci run -b main --pattern deploy # Trigger custom pipeline
bb ci stop <build#>                # Stop running pipeline
bb ci logs <build#>                # View all step logs
bb ci logs <build#> -s "Build"     # View specific step
```

### Raw API

Escape hatch for any Bitbucket REST API v2 endpoint:

```bash
bb api /repositories/workspace/repo
bb api --method POST /path --field title="Bug"
bb api --paginate /path
```

## Common Flags

| Flag | Description |
|------|-------------|
| `-R, --repo workspace/repo` | Specify repository (auto-detected from git remote) |
| `-F, --output json` | JSON output for scripting |
| `-p, --page N` | Page number |
| `-P, --per-page N` | Items per page |
| `-w, --web` | Open in browser |

## License

MIT
