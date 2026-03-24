# bb Commands - Detailed Reference

This is a comprehensive reference for all bb commands. This file is loaded when detailed command information is needed.

## Authentication

### Logging In
```bash
# Interactive login (prompts for method, credentials)
bb auth login

# Non-interactive with Atlassian API token (ATATT prefix auto-detected)
bb auth login -u your.email@example.com -t ATATT3xFfGF0...

# Non-interactive with app password
bb auth login -u username -t app_password

# Non-interactive with OAuth/workspace access token (Bearer)
bb auth login -t workspace_token_here

# Pipe token from file
bb auth login --stdin < token.txt

# Authenticate with self-hosted Bitbucket
bb auth login --hostname bitbucket.example.org
```

### Checking Auth Status
```bash
# Check default host
bb auth status

# Check specific host
bb auth status --hostname bitbucket.org

# Check all configured hosts
bb auth status --all

# Show full token (not masked)
bb auth status --show-token
```

## Pull Requests (PR)

### Listing Pull Requests
```bash
# List open PRs (default)
bb pr list -R workspace/repo

# Alias
bb pr ls -R workspace/repo

# Filter by state
bb pr list -R workspace/repo -s OPEN
bb pr list -R workspace/repo -s MERGED
bb pr list -R workspace/repo -s DECLINED
bb pr list -R workspace/repo -s SUPERSEDED

# Pagination
bb pr list -R workspace/repo -p 1 -P 10

# JSON output
bb pr list -R workspace/repo -F json
```

### Creating Pull Requests
```bash
# Interactive creation (auto-detects current branch)
bb pr create

# Create with title and description
bb pr create --title "Fix login bug" --description "Fixes the OAuth callback issue"

# Specify source branch explicitly
bb pr create --title "Feature" -s feature-branch

# Specify destination branch
bb pr create --title "Feature" -d develop

# Create as draft (adds DRAFT: prefix to title)
bb pr create --title "WIP: New feature" --draft

# Delete source branch after merge
bb pr create --title "Feature" --close-source-branch

# Add reviewers by UUID
bb pr create --title "Feature" --reviewer "{uuid1},{uuid2}"

# JSON output
bb pr create --title "Feature" -F json
```

### Viewing Pull Requests
```bash
# View PR details (title, description, reviewers, status)
bb pr view 123 -R workspace/repo

# Open in browser
bb pr view 123 -R workspace/repo -w

# JSON output
bb pr view 123 -R workspace/repo -F json
```

### Pull Request Diff
```bash
# View colorized diff
bb pr diff 123 -R workspace/repo

# Raw diff (pipeable to files or other tools)
bb pr diff 123 -R workspace/repo --raw

# No color
bb pr diff 123 -R workspace/repo --color never
```

### Reading Comments
```bash
# View all comments (general + inline)
bb pr comments 123 -R workspace/repo

# Alias
bb pr notes 123 -R workspace/repo

# Pagination
bb pr comments 123 -R workspace/repo -p 1 -P 50

# JSON output
bb pr comments 123 -R workspace/repo -F json
```

### Adding Comments
```bash
# Add a comment with message
bb pr comment 123 -m "Looks good to me!"

# Alias
bb pr note 123 -m "LGTM"

# Interactive (prompts for message)
bb pr comment 123

# JSON output
bb pr comment 123 -m "Comment" -F json
```

### Approving and Unapproving
```bash
# Approve a PR
bb pr approve 123 -R workspace/repo

# Remove approval
bb pr unapprove 123 -R workspace/repo
```

### Merging Pull Requests
```bash
# Merge with default strategy
bb pr merge 123 -R workspace/repo

# Merge with squash
bb pr merge 123 --strategy squash

# Merge with fast-forward
bb pr merge 123 --strategy fast_forward

# Merge commit (explicit)
bb pr merge 123 --strategy merge_commit

# Delete source branch after merge
bb pr merge 123 --close-source-branch

# Custom merge commit message
bb pr merge 123 -m "Merge feature X into main"

# JSON output
bb pr merge 123 -F json
```

### Declining Pull Requests
```bash
# Decline (close without merging)
bb pr decline 123 -R workspace/repo
```

### Checking Out PR Branches
```bash
# Checkout PR branch locally
bb pr checkout 123

# Alias
bb pr co 123
```

### Updating Pull Requests
```bash
# Update title
bb pr update 123 --title "New title"

# Update description
bb pr update 123 --description "Updated description"

# Change destination branch
bb pr update 123 -d develop

# Set close source branch
bb pr update 123 --close-source-branch

# Keep source branch
bb pr update 123 --no-close-source-branch

# JSON output
bb pr update 123 --title "New" -F json
```

## Pipelines (CI/CD)

### Listing Pipelines
```bash
# List recent pipelines (sorted by newest first)
bb pipeline list -R workspace/repo

# Aliases
bb ci list -R workspace/repo
bb ci ls -R workspace/repo

# Pagination
bb ci list -p 1 -P 10

# JSON output
bb ci list -F json
```

### Viewing Pipeline Details
```bash
# View pipeline steps and their status
bb pipeline view 42 -R workspace/repo
bb ci view 42

# JSON output (includes pipeline + steps)
bb ci view 42 -F json
```

### Triggering Pipelines
```bash
# Trigger pipeline on current branch
bb pipeline run
bb ci run

# Trigger on specific branch
bb ci run --branch main
bb ci run -b develop

# Trigger custom pipeline
bb ci run --pattern "deploy-staging"

# JSON output
bb ci run -F json
```

### Stopping Pipelines
```bash
# Stop a running pipeline
bb pipeline stop 42
bb ci stop 42

# Alias
bb ci cancel 42
```

### Viewing Pipeline Logs
```bash
# View logs for all steps
bb pipeline logs 42
bb ci logs 42

# View logs for a specific step
bb ci logs 42 -s "Build"
bb ci logs 42 --step "Run tests"

# Alias
bb ci trace 42
```

## Raw API Access

### GET Requests
```bash
# Simple GET
bb api /repositories/workspace/repo

# With query parameters
bb api "/repositories/workspace/repo/pullrequests?state=OPEN&pagelen=10"

# Auto-paginate (fetches all pages, returns combined values array)
bb api --paginate /repositories/workspace/repo/pullrequests

# Include response headers (printed to stderr)
bb api --include /repositories/workspace/repo
```

### POST Requests
```bash
# POST with field flags
bb api --method POST /repositories/workspace/repo/issues \
  --field title="Bug report" \
  --field priority="major" \
  --field kind="bug"

# POST with JSON body from file
bb api --method POST /repositories/workspace/repo/pullrequests --input pr.json

# POST with body from stdin
echo '{"title":"Test","source":{"branch":{"name":"feature"}}}' | \
  bb api --method POST /repositories/workspace/repo/pullrequests --input -
```

### PUT and DELETE Requests
```bash
# PUT to update
bb api --method PUT /repositories/workspace/repo/pullrequests/123 \
  --field title="Updated title"

# DELETE
bb api --method DELETE /repositories/workspace/repo/issues/456
```

## Common Flags Across Commands

Most bb commands support these common flags:

- `--help`, `-h` - Show help for command
- `--repo`, `-R` - Specify repository (format: `workspace/repo`)
- `--output`, `-F` - Output format: `text`, `json`
- `--page`, `-p` - Page number for paginated results
- `--per-page`, `-P` - Number of items per page

PR-specific:
- `--web`, `-w` - Open in web browser (pr view)

Pipeline-specific:
- `--branch`, `-b` - Target branch (pipeline run)
- `--step`, `-s` - Step name (pipeline logs)

API-specific:
- `--method` - HTTP method (GET, POST, PUT, DELETE)
- `--field` - Request body fields (key=value, repeatable)
- `--input` - Read body from file or stdin (-)
- `--paginate` - Auto-fetch all pages
- `--include` - Show response headers

## Output Formats

All list/view commands support JSON output:

```bash
# JSON output for scripting
bb pr list -F json | jq '.values[] | {id, title, state}'

# Pipe to other tools
bb pr view 123 -F json | jq '.description'

# Pipeline info
bb ci list -F json | jq '.values[] | {build_number, state}'
```

## Environment Variables

```bash
BB_TOKEN=xxx                       # API token (Bearer, takes precedence)
BITBUCKET_TOKEN=xxx                # Alternative env var name
NO_COLOR=1                         # Disable colored output
```

## Configuration

Credentials stored at `~/.config/bb-cli/config.json`:
```json
{
  "hosts": {
    "bitbucket.org": {
      "auth_type": "app_password",
      "token": "...",
      "username": "user@example.com",
      "user": "Display Name"
    }
  }
}
```
