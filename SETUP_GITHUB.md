# Setting up Phanta on GitHub

## Steps to create the GitHub repo:

1. **Create the repository on GitHub:**
   ```bash
   # Go to https://github.com/new
   # Repository name: Phanta
   # Owner: roygalCS
   # Description: AI-Powered Crypto Banking Assistant for Solana
   # Public or Private (your choice)
   # Don't initialize with README (we have one)
   ```

2. **Push the code:**
   ```bash
   # Navigate to your project directory
   cd /path/to/your/project
   
   # Run the setup script
   ./setup-github.sh
   
   # Or manually:
   git add .
   git commit -m "Initial commit: Phanta - AI-Powered Crypto Banking"
   git remote add origin https://github.com/roygalCS/Phanta.git
   git branch -M main
   git push -u origin main
   ```

## Folder Name

The folder has been renamed to "Phanta" and all code uses "Phanta".

