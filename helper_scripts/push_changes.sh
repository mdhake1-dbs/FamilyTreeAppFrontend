#!/bin/bash
# This script commits and pushes changes to GitHub

set -e
cd $HOME/family-tree-vault/helper_scripts || exit 1
# Load credentials
if [ ! -f github_credentials.env ]; then
  echo "github_credentials.env not found!"
  exit 1
fi
source github_credentials.env

cd $HOME/family-tree-vault || exit 1

# Check if .git exists
if [ ! -d .git ]; then
  echo "Git repository not initialized. Run setup_git.sh first."
  exit 1
fi

# Stage, commit, and push
git add .
git commit -m "Submission Ready App with Google-API"
git branch -M main
git push -u origin main

echo "Changes pushed successfully to https://github.com/${GITHUB_USERNAME}/${REPO_NAME}"

