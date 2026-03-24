---
name: bb-skill
description: Bitbucket CLI expertise for managing pull requests, pipelines, and repositories from the command line
---

# Bitbucket CLI (bb) Skill

Provides guidance for using `bb`, a lightweight Bitbucket CLI that mirrors glab's UX, to perform Bitbucket operations from the terminal.

## When to Use This Skill

Invoke when the user needs to:

- Create, review, or manage pull requests
- Monitor or trigger CI/CD pipelines
- Make authenticated Bitbucket API calls
- Perform any Bitbucket operation from the command line

## Prerequisites

Verify bb installation before executing commands:

```bash
bb --version
```

If not installed, the user needs to build and link the CLI:

```bash
cd /path/to/bb-cli && npm run link
```

## Authentication Quick Start

Most bb operations require authentication:

```bash
# Interactive authentication (supports App Password, Atlassian API Token, OAuth)
bb auth login

# Non-interactive with Atlassian API token (auto-detects ATATT prefix)
bb auth login -u your.email@example.com -t ATATT3x...

# Non-interactive with app password
bb auth login -u username -t app_password_here

# Check authentication status
bb auth status

# Using environment variables (takes precedence over stored config)
export BB_TOKEN=your-token
# or
export BITBUCKET_TOKEN=your-token
```

### Token Types

bb supports three authentication methods:

1. **App Password** — Create at Personal settings > App passwords. Uses Basic Auth (username + password).
2. **Atlassian API Token** — Create at manage.atlassian.com > API tokens. Starts with `ATATT` prefix. Uses Basic Auth (email + token). bb auto-detects this prefix.
3. **OAuth / Workspace Access Token** — Bearer token for workspace/repo/project scoped access.

Credentials are stored in `~/.config/bb-cli/config.json` with `0600` permissions.

## Core Workflows

### Creating a Pull Request

```bash
# 1. Ensure branch is pushed
git push -u origin feature-branch

# 2. Create PR (auto-detects current branch)
bb pr create --title "Add feature" --description "Implements X"

# With destination branch
bb pr create --title "Fix bug" --destination main

# Create as draft
bb pr create --title "WIP: Feature" --draft

# Close source branch after merge
bb pr create --title "Feature" --close-source-branch
```

### Reviewing Pull Requests

```bash
# 1. List open PRs
bb pr list -R workspace/repo

# 2. View PR details (title, description, reviewers, status)
bb pr view 123 -R workspace/repo

# 3. Checkout PR branch locally to test
bb pr checkout 123

# 4. View the diff
bb pr diff 123

# 5. Read comments
bb pr comments 123

# 6. After testing, approve
bb pr approve 123

# 7. Add review comments
bb pr comment 123 -m "Looks good, just one suggestion"

# 8. Merge
bb pr merge 123 --strategy squash
```

### Monitoring CI/CD Pipelines

```bash
# List recent pipelines
bb pipeline list -R workspace/repo
# or using the ci alias
bb ci list

# View pipeline steps and status
bb ci view 42

# View logs for a specific step
bb ci logs 42 -s "Build"

# Trigger a new pipeline
bb ci run --branch main

# Stop a running pipeline
bb ci stop 42
```

## Common Patterns

### Working Outside Repository Context

When not in a Git repository with a Bitbucket remote, specify the repository:

```bash
bb pr list -R workspace/repo
bb ci list -R workspace/repo
```

### Automation and Scripting

Use JSON output for parsing:

```bash
bb pr list -R workspace/repo -F json | jq '.values[] | .title'
bb ci list -R workspace/repo -F json
```

### Using the API Command

The `bb api` command provides direct Bitbucket REST API v2 access:

```bash
# Basic GET request
bb api /repositories/workspace/repo

# POST with data
bb api --method POST /repositories/workspace/repo/issues --field title="Bug" --field priority="major"

# Auto-fetch all pages
bb api --paginate /repositories/workspace/repo/pullrequests

# Include response headers
bb api --include /repositories/workspace/repo

# Read body from file
bb api --method POST /repositories/workspace/repo/pullrequests --input pr-body.json

# Read body from stdin
echo '{"title":"Bug"}' | bb api --method POST /repositories/workspace/repo/issues --input -
```

### Merge Strategies

Bitbucket supports three merge strategies:

```bash
bb pr merge 123 --strategy merge_commit   # Default merge commit
bb pr merge 123 --strategy squash         # Squash all commits
bb pr merge 123 --strategy fast_forward   # Fast-forward (no merge commit)
```

## Best Practices

1. **Verify authentication** before executing commands: `bb auth status`
2. **Use `--help`** to explore command options: `bb <command> --help`
3. **Check repository context** when commands fail: `git remote -v`
4. **Use `-F json`** for scripting and automation
5. **Use `bb api`** as an escape hatch for anything not covered by built-in commands

## Common Commands Quick Reference

**Pull Requests:**

- `bb pr list` - List open PRs
- `bb pr create` - Create new PR
- `bb pr view <id>` - View PR details
- `bb pr checkout <id>` - Test PR locally
- `bb pr approve <id>` - Approve PR
- `bb pr merge <id>` - Merge PR
- `bb pr comment <id> -m "msg"` - Add comment

**Pipelines:**

- `bb ci list` - List pipelines
- `bb ci view <build#>` - View pipeline steps
- `bb ci run` - Trigger pipeline
- `bb ci logs <build#>` - View logs
- `bb ci stop <build#>` - Stop pipeline

**API:**

- `bb api <path>` - GET request
- `bb api --method POST <path> --field key=value` - POST with data
- `bb api --paginate <path>` - Auto-paginate

## Progressive Disclosure

For detailed command documentation, refer to:

- **references/commands-detailed.md** - Comprehensive command reference with all flags and options
- **references/quick-reference.md** - Condensed command cheat sheet
- **references/troubleshooting.md** - Detailed error scenarios and solutions

Load these references when:

- User needs specific flag or option details
- Troubleshooting authentication or connection issues
- Working with advanced features (API, pipelines, merge strategies, etc.)

## Common Issues Quick Fixes

**"command not found: bb"** - Run `npm run link` from the bb-cli directory

**"Not authenticated"** - Run `bb auth login`

**"401 Unauthorized"** - Token may be expired or wrong type. Atlassian API tokens (ATATT prefix) need Basic Auth with username.

**"Could not determine repository"** - Navigate to a git repo with Bitbucket remote or use `-R workspace/repo`

**"API error 404"** - Verify workspace/repo name and access permissions

For detailed troubleshooting, load **references/troubleshooting.md**.

## Notes

- bb auto-detects repository context from Git remotes (looks for `bitbucket` in hostname)
- Most commands support `-w` / `--web` flag to open in browser
- Use `-F json` for scripting and automation
- Multiple Bitbucket instances can be authenticated simultaneously
- `pipeline` is aliased as `ci` — both work interchangeably
- `pr comments` reads comments, `pr comment` writes a comment
- `pr checkout` is aliased as `pr co`
