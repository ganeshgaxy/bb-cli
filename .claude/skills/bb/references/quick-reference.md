# bb Quick Reference Guide

A condensed reference for the most commonly used Bitbucket CLI commands.

## Authentication

```bash
bb auth login                      # Interactive login
bb auth login -u email -t TOKEN    # Non-interactive (ATATT tokens auto-detected)
bb auth status                     # Check auth status
bb auth status --show-token        # Show full token
```

## Pull Requests

```bash
# Listing
bb pr list                         # All open PRs
bb pr list -s MERGED               # Merged PRs
bb pr list -F json                 # JSON output

# Creating
bb pr create                       # Interactive (auto-detects branch)
bb pr create --title "Fix" --description "Desc"
bb pr create --draft               # Draft PR
bb pr create -d main               # Specify destination

# Viewing & Managing
bb pr view 123                     # View PR details
bb pr view 123 -w                  # Open in browser
bb pr diff 123                     # View diff
bb pr diff 123 --raw               # Raw diff (pipeable)
bb pr comments 123                 # Read comments
bb pr comment 123 -m "LGTM"       # Add comment
bb pr checkout 123                 # Checkout branch
bb pr approve 123                  # Approve PR
bb pr unapprove 123                # Remove approval
bb pr merge 123                    # Merge PR
bb pr merge 123 --strategy squash  # Squash merge
bb pr decline 123                  # Close PR
bb pr update 123 --title "New"     # Update PR
```

## Pipelines (CI/CD)

```bash
# Viewing
bb ci list                         # List recent pipelines
bb ci view 42                      # View steps and status
bb ci logs 42                      # View all step logs
bb ci logs 42 -s "Build"           # View specific step log

# Managing
bb ci run                          # Trigger on current branch
bb ci run -b main                  # Trigger on specific branch
bb ci run --pattern deploy         # Trigger custom pipeline
bb ci stop 42                      # Stop pipeline
```

## API

```bash
bb api /repositories/ws/repo                    # GET
bb api --method POST /path --field title="Bug"  # POST
bb api --paginate /path                         # Auto-paginate
bb api --include /path                          # Show headers
```

## Common Flags

```bash
-h, --help                         # Show help
-R, --repo workspace/repo          # Specify repository
-F, --output json                  # JSON output
-p, --page 2                       # Page number
-P, --per-page 50                  # Items per page
-w, --web                          # Open in browser
```

## Environment Variables

```bash
BB_TOKEN=xxx                       # API token (takes precedence)
BITBUCKET_TOKEN=xxx                # Alternative name
NO_COLOR=1                         # Disable colors
```

## Complete Command List

- `bb auth login` - Authenticate with Bitbucket
- `bb auth status` - View authentication status
- `bb pr list` (alias: `ls`) - List pull requests
- `bb pr view` - View PR details
- `bb pr create` - Create new PR
- `bb pr diff` - View PR diff
- `bb pr comments` (alias: `notes`) - Read PR comments
- `bb pr comment` (alias: `note`) - Add comment to PR
- `bb pr approve` - Approve PR
- `bb pr unapprove` - Remove approval
- `bb pr merge` - Merge PR
- `bb pr decline` - Decline (close) PR
- `bb pr checkout` (alias: `co`) - Checkout PR branch
- `bb pr update` - Update PR fields
- `bb pipeline list` (alias: `ci ls`) - List pipelines
- `bb pipeline view` (alias: `ci view`) - View pipeline steps
- `bb pipeline run` (alias: `ci run`, `ci trigger`) - Trigger pipeline
- `bb pipeline stop` (alias: `ci stop`, `ci cancel`) - Stop pipeline
- `bb pipeline logs` (alias: `ci logs`, `ci trace`) - View step logs
- `bb api` - Make authenticated API requests

## Tips

1. Use `bb <command> --help` for detailed help
2. Commands auto-detect repository context from Bitbucket git remotes
3. Use `-R workspace/repo` when outside a repository
4. Use `-F json` for scripting and piping to `jq`
5. `pipeline` and `ci` are interchangeable
6. `bb api` is the escape hatch for any Bitbucket REST API v2 endpoint
7. ATATT-prefixed tokens are auto-detected as Atlassian API tokens
