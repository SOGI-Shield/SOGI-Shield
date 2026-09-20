import { execSync } from 'child_process';

const PROTECTED_BRANCHES = new Set(['main', 'beta']);

function runCommand(cmd) {
  try {
    return execSync(cmd, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
  } catch {
    return '';
  }
}

function getRepoInfo() {
  const remoteUrl = runCommand('git remote get-url origin');
  const match = remoteUrl.match(/github\.com[:/]([^/]+)\/([^/.]+)/);
  if (match) {
    return { owner: match[1], repo: match[2] };
  }
  return null;
}

async function fetchClosedPrBranches(owner, repo) {
  const closedBranches = new Map(); // branchName -> info
  try {
    const url = `https://api.github.com/repos/${owner}/${repo}/pulls?state=closed&per_page=100`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'cleanup-branches-script',
        ...(process.env.GITHUB_TOKEN ? { Authorization: `token ${process.env.GITHUB_TOKEN}` } : {})
      }
    });

    if (!response.ok) {
      console.warn(`[!] GitHub API returned status ${response.status}. Falling back to git detection.`);
      return closedBranches;
    }

    const prs = await response.json();
    if (Array.isArray(prs)) {
      for (const pr of prs) {
        const base = pr.base?.ref;
        const head = pr.head?.ref;
        // Check if PR targeted main or beta
        if (head && (base === 'main' || base === 'beta')) {
          closedBranches.set(head, {
            number: pr.number,
            base,
            merged: Boolean(pr.merged_at)
          });
        }
      }
    }
  } catch (err) {
    console.warn('[!] Failed to query GitHub API:', err.message);
  }
  return closedBranches;
}

function getMergedBranches() {
  const merged = new Set();
  for (const target of ['origin/main', 'origin/beta', 'main', 'beta']) {
    const output = runCommand(`git branch --merged ${target}`);
    if (output) {
      output.split('\n')
        .map(b => b.replace(/^[*+]\s+/, '').trim())
        .filter(Boolean)
        .forEach(b => merged.add(b));
    }
  }
  return merged;
}

function getGoneBranches() {
  const gone = new Set();
  const output = runCommand('git branch -vv');
  if (output) {
    for (const line of output.split('\n')) {
      if (line.includes(': gone]')) {
        const match = line.match(/^[*+]?\s*([^\s]+)/);
        if (match && match[1]) {
          gone.add(match[1]);
        }
      }
    }
  }
  return gone;
}

async function main() {
  const isDryRun = process.argv.includes('--dry-run');

  console.log('🔍 Fetching latest remote references...');
  runCommand('git fetch --prune');

  const currentBranch = runCommand('git branch --show-current');
  const allBranchesRaw = runCommand('git for-each-ref --format="%(refname:short)" refs/heads/');
  const localBranches = allBranchesRaw.split('\n').map(b => b.trim()).filter(Boolean);

  const repoInfo = getRepoInfo();
  let closedPrs = new Map();
  if (repoInfo) {
    console.log(`🌐 Checking closed PRs on GitHub (${repoInfo.owner}/${repoInfo.repo}) for main and beta...`);
    closedPrs = await fetchClosedPrBranches(repoInfo.owner, repoInfo.repo);
  }

  const mergedBranches = getMergedBranches();
  const goneBranches = getGoneBranches();

  const toDelete = [];
  const kept = [];

  for (const branch of localBranches) {
    if (PROTECTED_BRANCHES.has(branch)) {
      kept.push({ branch, reason: 'Protected branch (main/beta)' });
      continue;
    }
    if (branch === currentBranch) {
      kept.push({ branch, reason: 'Currently active branch' });
      continue;
    }

    if (closedPrs.has(branch)) {
      const info = closedPrs.get(branch);
      toDelete.push({
        branch,
        reason: `PR #${info.number} closed (${info.merged ? 'merged' : 'closed'} into ${info.base})`
      });
    } else if (mergedBranches.has(branch)) {
      toDelete.push({
        branch,
        reason: 'Already merged into main or beta'
      });
    } else if (goneBranches.has(branch)) {
      toDelete.push({
        branch,
        reason: 'Remote tracking branch was deleted (: gone)'
      });
    } else {
      kept.push({ branch, reason: 'Active / unmerged branch' });
    }
  }

  console.log('\n--- 📋 Local Branches Status ---');
  if (kept.length > 0) {
    console.log('\n✅ Kept:');
    kept.forEach(k => console.log(`  - ${k.branch} (${k.reason})`));
  }

  if (toDelete.length === 0) {
    console.log('\n🎉 No old or closed PR branches to delete locally.');
    return;
  }

  console.log(`\n🗑️  Branches to delete (${toDelete.length}):`);
  for (const item of toDelete) {
    if (isDryRun) {
      console.log(`  - [DRY RUN] Would delete ${item.branch} [${item.reason}]`);
    } else {
      const res = runCommand(`git branch -D ${item.branch}`);
      console.log(`  - Deleted ${item.branch} [${item.reason}]`);
    }
  }

  console.log(isDryRun ? '\n(Dry run finished, no branches deleted)' : '\n✨ Branch cleanup complete!');
}

main();
