#!/bin/bash

# Script to set up Phanta on GitHub
# Run this after creating the repo on GitHub

REPO_NAME="Phanta"
GITHUB_USER="roygalCS"

echo "🚀 Setting up Phanta GitHub repository..."
echo ""

# Check if git is initialized
if [ ! -d .git ]; then
    echo "Initializing git repository..."
    git init
fi

# Check if remote already exists
if git remote get-url origin > /dev/null 2>&1; then
    echo "⚠️  Remote 'origin' already exists. Removing it..."
    git remote remove origin
fi

# Add remote
echo "Adding GitHub remote..."
git remote add origin https://github.com/${GITHUB_USER}/${REPO_NAME}.git

# Add all files
echo "Staging files..."
git add .

# Check if there are changes to commit
if git diff --staged --quiet; then
    echo "No changes to commit."
else
    echo "Committing changes..."
    git commit -m "Initial commit: Phanta - AI-Powered Crypto Banking Assistant"
fi

# Set main branch
git branch -M main

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Create the repository on GitHub: https://github.com/new"
echo "   - Name: ${REPO_NAME}"
echo "   - Owner: ${GITHUB_USER}"
echo "   - Don't initialize with README"
echo ""
echo "2. Push the code:"
echo "   git push -u origin main"
echo ""
echo "Or if you have GitHub CLI installed:"
echo "   gh repo create ${GITHUB_USER}/${REPO_NAME} --public --source=. --remote=origin --push"

