# bb Troubleshooting Guide

Comprehensive troubleshooting guide for common bb CLI issues and errors.

## Installation Issues

### Command Not Found

**Error:**
```
command not found: bb
```

**Causes:**
- bb is not installed or not linked
- bb is not in PATH

**Solutions:**
1. Verify installation:
   ```bash
   which bb
   ```

2. If not linked, build and link from the bb-cli directory:
   ```bash
   cd /path/to/bb-cli
   npm run link
   ```

3. Verify npm global bin is in PATH:
   ```bash
   npm bin -g
   # Ensure this directory is in your PATH
   ```

### Build Errors

**Error:**
```
tsc: command not found
```

**Solution:**
Install dependencies first:
```bash
cd /path/to/bb-cli
npm install
npm run build
```

## Authentication Issues

### 401 Unauthorized

**Error:**
```
API error 401 Unauthorized: {"type": "error", "error": {"message": "Token is invalid, expired, or not supported for this endpoint."}}
```

**Causes:**
- Using an Atlassian API token (ATATT prefix) as a Bearer token instead of Basic Auth
- Token expired or revoked
- Wrong hostname

**Solutions:**
1. If your token starts with `ATATT`, it's an Atlassian API token and requires Basic Auth (username + token):
   ```bash
   bb auth login -u your.email@example.com -t ATATT3x...
   ```

2. Re-authenticate:
   ```bash
   bb auth login
   ```

3. Check current auth status:
   ```bash
   bb auth status
   ```

4. Verify token hasn't expired in Atlassian account settings

### Token Type Confusion

Bitbucket supports multiple token types. Using the wrong auth method causes 401 errors:

| Token Type | Prefix | Auth Method | How to Create |
|-----------|--------|-------------|---------------|
| App Password | (none) | Basic Auth (username + password) | Personal settings > App passwords |
| Atlassian API Token | `ATATT` | Basic Auth (email + token) | manage.atlassian.com > API tokens |
| Workspace Access Token | `bbwat_` | Bearer | Workspace settings > Access tokens |
| Repository Access Token | `bbrat_` | Bearer | Repo settings > Access tokens |
| OAuth Token | (varies) | Bearer | OAuth consumer flow |

**Key rule:** If you need a username to create it, it uses Basic Auth. If not, it uses Bearer.

### Authentication Verification Failure

**Error:**
```
Error: authentication failed. Credentials may be invalid.
```

bb verifies tokens by trying three endpoints in order:
1. `GET /user` — works with App Passwords and OAuth tokens
2. `GET /workspaces` — works with Workspace Access Tokens
3. `GET /repositories?role=member` — works with Repository Access Tokens

If all three fail, the token is truly invalid.

**Solutions:**
1. Verify the token works with curl:
   ```bash
   # For Basic Auth (app password / Atlassian API token)
   curl -u "username:token" https://api.bitbucket.org/2.0/user

   # For Bearer token
   curl -H "Authorization: Bearer TOKEN" https://api.bitbucket.org/2.0/user
   ```

2. Create a new token with correct scopes:
   - `repository` (read/write)
   - `pullrequest` (read/write)
   - `pipeline` (read/write)
   - `account` (read)

### Multiple Accounts

bb supports multiple Bitbucket instances:

```bash
# Authenticate with bitbucket.org
bb auth login --hostname bitbucket.org

# Authenticate with self-hosted Bitbucket
bb auth login --hostname bitbucket.example.org

# Check all accounts
bb auth status --all
```

## Repository Context Issues

### Could Not Determine Repository

**Error:**
```
Could not determine repository. Use -R workspace/repo or run from a git directory with a Bitbucket remote.
```

**Causes:**
- Running bb outside a Git repository
- Git repository has no Bitbucket remote
- Remote URL doesn't contain "bitbucket" in the hostname

**Solutions:**
1. Specify repository explicitly:
   ```bash
   bb pr list -R workspace/repo
   ```

2. Check your git remotes:
   ```bash
   git remote -v
   ```

3. Add a Bitbucket remote if missing:
   ```bash
   git remote add origin git@bitbucket.org:workspace/repo.git
   ```

### Wrong Repository Detected

**Issue:** bb operating on wrong repository

**Solution:**
1. Check current remotes:
   ```bash
   git remote -v
   ```

2. Specify correct repository:
   ```bash
   bb pr list -R workspace/correct-repo
   ```

3. bb picks the first remote with "bitbucket" in the hostname. If you have multiple Bitbucket remotes, use `-R` explicitly.

### Invalid Repo Format

**Error:**
```
Invalid repo format "something". Expected "workspace/repo".
```

**Solution:**
The `-R` flag requires `workspace/repo` format:
```bash
# Correct
bb pr list -R myworkspace/myrepo

# Wrong
bb pr list -R myrepo
bb pr list -R myworkspace/subgroup/myrepo
```

## Pull Request Issues

### PR Not Found (404)

**Error:**
```
API error 404 Not Found
```

**Causes:**
- Wrong PR ID
- Wrong workspace/repo
- No access to the repository

**Solutions:**
1. Verify PR exists:
   ```bash
   bb pr list -R workspace/repo
   ```

2. Check workspace and repo names match exactly (case-sensitive)

3. Verify you have repository access

### Cannot Merge: Conflicts

If `bb pr merge` fails due to conflicts:

1. Checkout the PR branch:
   ```bash
   bb pr checkout 123
   ```

2. Merge target branch locally:
   ```bash
   git fetch origin main
   git merge origin/main
   ```

3. Resolve conflicts and push:
   ```bash
   git add .
   git commit
   git push
   ```

4. Try merging again:
   ```bash
   bb pr merge 123
   ```

### Source Branch Already Has PR

If creating a PR fails because one already exists:

1. List PRs to find the existing one:
   ```bash
   bb pr list -R workspace/repo
   ```

2. Update the existing PR instead:
   ```bash
   bb pr update 456 --title "Updated title"
   ```

## Pipeline Issues

### Pipeline Not Found

**Error:**
```
Pipeline #99 not found
```

**Causes:**
- Build number doesn't exist
- Pipeline was deleted
- bb searches the most recent 100 pipelines — older ones won't be found

**Solutions:**
1. List recent pipelines:
   ```bash
   bb ci list
   ```

2. For very old pipelines, use the API directly:
   ```bash
   bb api "/repositories/workspace/repo/pipelines/?pagelen=100&page=2"
   ```

### Cannot Trigger Pipeline

**Error on `bb ci run`:**

**Causes:**
- Pipelines not enabled for the repository
- No `bitbucket-pipelines.yml` in the branch
- Insufficient permissions

**Solutions:**
1. Verify pipelines are enabled in Bitbucket repository settings

2. Check that `bitbucket-pipelines.yml` exists on the target branch:
   ```bash
   git ls-files bitbucket-pipelines.yml
   ```

3. Ensure your token has `pipeline` scope

### No Logs Available

**Message:**
```
(no logs available)
```

**Causes:**
- Step hasn't started yet
- Step was skipped
- Logs were cleaned up

**Solution:**
Wait for the step to complete, or check pipeline status:
```bash
bb ci view 42
```

## Network and Connection Issues

### Connection Timeout

**Error:**
```
fetch failed
```

**Solutions:**
1. Check network connection:
   ```bash
   curl -I https://api.bitbucket.org/2.0/
   ```

2. For self-hosted, verify hostname is reachable:
   ```bash
   curl -I https://bitbucket.example.org
   ```

3. Check proxy settings if behind a corporate proxy

### Rate Limiting

**Error:**
```
API error 429 Too Many Requests
```

**Solution:**
Wait and retry. Bitbucket Cloud has rate limits:
- 1000 requests per hour for authenticated requests
- Use `--paginate` carefully on large repos

## Configuration Issues

### Config File Corruption

**Error:**
```
SyntaxError: Unexpected token in JSON
```

**Solutions:**
1. Check config file:
   ```bash
   cat ~/.config/bb-cli/config.json
   ```

2. Backup and recreate:
   ```bash
   mv ~/.config/bb-cli/config.json ~/.config/bb-cli/config.json.bak
   bb auth login
   ```

### Permissions on Config File

Config should have `0600` permissions (readable only by owner):
```bash
ls -la ~/.config/bb-cli/config.json
# Should show: -rw-------

# Fix if needed:
chmod 600 ~/.config/bb-cli/config.json
```

## API Command Issues

### Invalid Field Format

**Error:**
```
Invalid field format: "something". Use key=value.
```

**Solution:**
Fields must be in `key=value` format:
```bash
# Correct
bb api --method POST /path --field title="My Title"

# Wrong
bb api --method POST /path --field "title: My Title"
```

### Paginated Response Not Combined

If `--paginate` returns unexpected format, the endpoint may not use standard Bitbucket pagination (with `values` array and `next` URL). In that case, paginate manually:

```bash
bb api "/repositories/workspace/repo/pullrequests?page=1&pagelen=50"
bb api "/repositories/workspace/repo/pullrequests?page=2&pagelen=50"
```

## General Troubleshooting Steps

When encountering any error:

1. **Check version:**
   ```bash
   bb --version
   ```

2. **Check authentication:**
   ```bash
   bb auth status
   ```

3. **Verify repository context:**
   ```bash
   git remote -v
   ```

4. **Use --help:**
   ```bash
   bb <command> --help
   ```

5. **Try with JSON output** to see raw API response:
   ```bash
   bb pr list -F json
   ```

6. **Test with raw API** to isolate the issue:
   ```bash
   bb api /repositories/workspace/repo
   ```

7. **Check Bitbucket status:**
   Visit https://bitbucket.status.atlassian.com/

## Getting Additional Help

1. Run `bb <command> --help` for command-specific options
2. Use `bb api` to access any Bitbucket REST API v2 endpoint directly
3. Bitbucket REST API docs: https://developer.atlassian.com/cloud/bitbucket/rest/
4. For self-hosted: https://developer.atlassian.com/server/bitbucket/rest/
