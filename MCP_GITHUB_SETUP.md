# GitHub MCP Integration Setup Guide

**Date:** June 3, 2026  
**Status:** Ready to configure

---

## 📋 Overview

MCP (Model Context Protocol) allows Claude to directly interact with GitHub without switching tabs or copying URLs. You can:

✅ Create/read/update GitHub issues  
✅ Create pull requests  
✅ Comment on PRs and issues  
✅ Read file contents from repos  
✅ Search repositories  
✅ Get PR/issue details  
✅ Manage labels and milestones  

---

## 🔧 Setup Steps

### Step 1: Create GitHub Personal Access Token

1. Go to **GitHub.com** → **Settings** → **Developer settings** → **Personal access tokens** → **Tokens (classic)**
2. Click **Generate new token (classic)**
3. Name: `Claude MCP` (or similar)
4. Set expiration: 90 days (or longer)
5. Select scopes:
   ```
   ✓ repo (full control of private repositories)
   ✓ read:org (read organization data)
   ✓ user (read user profile data)
   ```
6. Click **Generate token**
7. **Copy the token** (you'll only see it once!)

**Token looks like:** `ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

---

### Step 2: Create Project MCP Configuration

Create a `.mcp.json` file in your project root:

**File:** `bsq/.mcp.json`

```json
{
  "$schema": "https://raw.githubusercontent.com/modelcontextprotocol/implementation-template/main/schemas/mcp.json",
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "ghp_YOUR_TOKEN_HERE"
      }
    }
  }
}
```

**Replace:** `ghp_YOUR_TOKEN_HERE` with your actual token from Step 1

**⚠️ Security:** Add `.mcp.json` to your `.gitignore` file to prevent the token from being committed:

```bash
# In .gitignore
.mcp.json
```

---

### Step 3: Install Required Tools

```bash
# Install Node.js (if not already installed)
brew install node

# Install npx globally (usually comes with Node.js)
npm install -g npx

# Verify installation
node --version
npx --version
```

---

### Step 4: Verify Integration

1. **Restart Claude Code** or reopen the bsq project
2. **Approve the MCP server** when prompted by Claude Code
3. **Test it** by asking Claude:

```
"List my GitHub repositories"
"Show GitHub issues for my BSQ project"
"Create a GitHub issue for new auth feature"
```

**Note:** The MCP server is automatically loaded from `.mcp.json` when you open the project in Claude Code. You may see a permission prompt the first time — click Approve to enable GitHub integration.

---

## 🎯 What You Can Do with GitHub MCP

### Read Issues
```
"Show GitHub issues for my BSQ project"
"Get issue #123 details"
"List open bugs in my repos"
```

### Create Issues
```
"Create a GitHub issue titled 'Add user authentication' with description 'Implement OAuth2 login flow'"
"Open an issue for the performance optimization work"
```

### Manage Pull Requests
```
"Show open pull requests in my repo"
"Create a PR to merge feature/auth into main"
"Review the PR at [URL]"
"Add a comment to PR #456"
```

### Search Repositories
```
"Search for 'authentication' in my repos"
"Find all TODO comments in my code"
"List files modified in PR #123"
```

### Update Issues/PRs
```
"Add 'bug' label to issue #456"
"Change PR #789 status to 'ready for review'"
"Close issue #123 with message 'Fixed in PR #456'"
```

---

## 🔐 Security Best Practices

### Token Safety
- ✅ **Store token in settings file** (not in code)
- ✅ **Set expiration to 90 days** (regenerate regularly)
- ✅ **Use minimal permissions** (only what you need)
- ❌ **Never commit token to git**
- ❌ **Never share token with others**
- ❌ **Don't use in shell scripts**

### If Token Leaked
1. Go to **GitHub Settings** → **Developer settings** → **Tokens**
2. Click **Delete** on the compromised token
3. Create a new token
4. Update settings.json
5. Restart Claude Code

---

## 🐛 Troubleshooting

### MCP Not Showing Tools

**Issue:** GitHub tools not available after restart

**Solutions:**
1. Restart Claude Code completely
2. Check token is in settings.json
3. Verify token is valid (not expired)
4. Check npx is installed: `npx --version`
5. Check Node.js version: `node --version` (should be 18+)

### "Authentication failed"

**Issue:** Getting auth errors

**Solutions:**
1. Verify token starts with `ghp_`
2. Check token hasn't expired (GitHub → Settings → Tokens)
3. Ensure token has correct scopes (repo, read:org)
4. Regenerate token if needed

### "Command not found: npx"

**Issue:** npx not in PATH

**Solutions:**
```bash
# Reinstall Node.js
brew uninstall node
brew install node

# Or use full path in settings.json
"/usr/local/bin/npx" instead of "npx"
```

### Tools Available But Not Working

**Issue:** MCP shows tools but queries fail

**Solutions:**
1. Check GitHub is up: `curl -I https://api.github.com`
2. Verify network connectivity
3. Check token has right permissions
4. Try simpler query first: "List my repos"

---

## 💡 Advanced Configuration

### Multiple MCP Servers

You can add other MCPs to `.mcp.json`:

```json
{
  "$schema": "https://raw.githubusercontent.com/modelcontextprotocol/implementation-template/main/schemas/mcp.json",
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "ghp_YOUR_TOKEN"
      }
    },
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem"],
      "env": {
        "ROOTS": "/Users/anarxocayev/IdeaProjects"
      }
    }
  }
}
```

### Custom Environment Variables

You can customize GitHub API settings in the env section:

```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "ghp_YOUR_TOKEN",
        "GITHUB_API_URL": "https://api.github.com",
        "GITHUB_API_VERSION": "2022-11-28"
      }
    }
  }
}
```

---

## 🔄 Workflow Example

### Complete GitHub Workflow with MCP

```
1. Start work session
   - Claude sees GitHub tools available
   
2. Create an issue
   - "Create GitHub issue: 'Implement user dashboard feature'"
   - Claude creates issue with description
   
3. Update existing PR
   - "Add comment to PR #123: 'Looks good, one minor fix needed'"
   
4. Search for related issues
   - "Find all open issues with 'dashboard' label"
   
5. Get PR details
   - "Show me the files changed in PR #456"
   
6. Close issue
   - "Close issue #789 as 'Fixed in PR #123'"
```

---

## 📚 Available GitHub MCP Functions

When configured, Claude has access to:

### Issues
- `list_issues` - List issues in a repository
- `get_issue` - Get details of a specific issue
- `create_issue` - Create a new issue
- `update_issue` - Update issue title/description
- `add_issue_comment` - Add comment to issue
- `add_issue_label` - Add label to issue

### Pull Requests
- `list_pull_requests` - List PRs in a repository
- `get_pull_request` - Get PR details
- `create_pull_request` - Create new PR
- `list_pr_files` - List files changed in PR
- `add_pr_comment` - Comment on PR
- `update_pr` - Update PR title/description

### Repository
- `list_repositories` - List your repositories
- `get_repository` - Get repository details
- `search_repositories` - Search repos by keyword
- `get_file_contents` - Read file from repository

### Labels & Milestones
- `list_labels` - List available labels
- `list_milestones` - List project milestones
- `add_label` - Create new label

---

## ✅ Verification Checklist

- [ ] GitHub personal access token created
- [ ] Token copied (starts with `ghp_`)
- [ ] Token added to `~/.claude/settings.json`
- [ ] Node.js installed (`node --version`)
- [ ] npx available (`npx --version`)
- [ ] Claude Code restarted
- [ ] Tested: "List my GitHub repositories"
- [ ] Tested: Create a test issue
- [ ] Token stored safely (not in git)

---

## 🚀 Integration with BSQ Project

### Example Commands for BSQ

```
"Create a GitHub issue for BSQ: 'Add API rate limiting'"

"List all open PRs in the BSQ repository"

"Search for issues with label 'bug' in BSQ"

"Create a PR to add CI/CD pipeline configuration"

"Add comment to BSQ PR #1: 'Please update tests'"

"Show me recently changed files in BSQ main branch"

"Create issue: 'Refactor ExamService for better testability'"
```

---

## 📖 Resources

- **GitHub MCP Server:** https://github.com/modelcontextprotocol/servers/tree/main/src/github
- **MCP Documentation:** https://modelcontextprotocol.io
- **GitHub API Reference:** https://docs.github.com/en/rest
- **Personal Access Tokens:** https://github.com/settings/tokens

---

## 🎯 Next Steps

1. ✅ Create GitHub personal access token (copy it!)
2. ✅ Update `~/.claude/settings.json` with token
3. ✅ Restart Claude Code
4. ✅ Test: "Show my GitHub repositories"
5. ✅ Try creating an issue or PR
6. ✅ Use in your workflow!

---

**Ready to connect GitHub to Claude Code!** Once configured, you'll have GitHub integration available in every conversation. 🚀
