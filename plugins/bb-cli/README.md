# handbook-bb

Bitbucket CLI (bb) expertise for Claude Code, providing guidance for managing pull requests, pipelines, and repositories from the command line.

## Features

- **Pull Request Management**: Create, review, approve, merge, and decline PRs
- **CI/CD Pipeline Operations**: Monitor, trigger, stop, and view logs for pipelines
- **Code Review**: View diffs, read and write comments, approve/unapprove PRs
- **Raw API Access**: Direct Bitbucket REST API v2 access for advanced operations

## Prerequisites

Install the Bitbucket CLI before using this plugin:

```bash
npm install -g @ganeshgaxy/bb-cli
```

Authenticate with Bitbucket:

```bash
bb auth login
```

### Authentication Methods

| Method | How to create | Usage |
|--------|--------------|-------|
| **App Password** | Personal settings > App passwords | `bb auth login -u user -t password` |
| **Atlassian API Token** | manage.atlassian.com > API tokens | `bb auth login -u email -t ATATT3x...` |
| **OAuth / Access Token** | Workspace/Repo settings > Access tokens | `bb auth login -t token` |

## Usage

The skill activates automatically when you ask about Bitbucket operations:

- "Create a pull request for this branch"
- "List open PRs in my repo"
- "Check the pipeline status"
- "How do I approve a PR?"
- "Show me the diff for PR #42"

## Skill Structure

```
skills/
└── bb-skill/
    ├── SKILL.md                    # Main skill with core workflows
    └── references/
        ├── commands-detailed.md    # Comprehensive command reference
        ├── quick-reference.md      # Condensed cheat sheet
        └── troubleshooting.md      # Error scenarios and solutions
```

## Common Workflows

### Create a Pull Request

```bash
git push -u origin feature-branch
bb pr create --title "Add feature" --description "Implements X"
```

### Review and Approve PR

```bash
bb pr list
bb pr checkout 123
bb pr diff 123
bb pr approve 123
bb pr merge 123 --strategy squash
```

### Monitor CI/CD Pipeline

```bash
bb ci list
bb ci view 42
bb ci logs 42 -s "Build"
```

### Raw API Access

```bash
bb api /repositories/workspace/repo
bb api --method POST /path --field title="Bug"
bb api --paginate /repositories/workspace/repo/pullrequests
```

## Available Commands

| Command | Description |
|---------|-------------|
| `bb auth login` | Authenticate with Bitbucket |
| `bb auth status` | View authentication status |
| `bb pr list` | List pull requests |
| `bb pr view <id>` | View PR details |
| `bb pr create` | Create new PR |
| `bb pr diff <id>` | View PR diff |
| `bb pr comments <id>` | Read PR comments |
| `bb pr comment <id>` | Add comment to PR |
| `bb pr approve <id>` | Approve PR |
| `bb pr unapprove <id>` | Remove approval |
| `bb pr merge <id>` | Merge PR |
| `bb pr decline <id>` | Decline (close) PR |
| `bb pr checkout <id>` | Checkout PR branch |
| `bb pr update <id>` | Update PR fields |
| `bb ci list` | List pipelines |
| `bb ci view <build#>` | View pipeline steps |
| `bb ci run` | Trigger pipeline |
| `bb ci stop <build#>` | Stop pipeline |
| `bb ci logs <build#>` | View step logs |
| `bb api <path>` | Make authenticated API request |

## License

MIT
