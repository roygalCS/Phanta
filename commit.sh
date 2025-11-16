#!/bin/bash

# Branch name (change if needed)
BRANCH="main"

# Get list of subfolders in current directory (excluding .git folder)
folders=$(find . -maxdepth 1 -type d ! -name ".git" ! -path ".")

# Loop through each folder
for folder in $folders; do
  echo "Committing folder: $folder"

  # Stage changes in this folder
  git add "$folder"

  # Commit with timestamp
  git commit -m "Auto commit of $folder at $(date '+%Y-%m-%d %H:%M:%S')"

  # Push to remote
  git push origin "$BRANCH"

  # Wait 15 minutes before next commit
  echo "Waiting 15 minutes before next commit..."
  sleep 900
done

echo "✅ All folders committed."
