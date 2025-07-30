#!/bin/bash

echo "🚀 GitHub Repository Setup for E-Pass Management System"
echo "======================================================"
echo ""

# Check if git is configured
if ! git config --global user.name > /dev/null 2>&1; then
    echo "❌ Git user.name not configured"
    echo "Please run: git config --global user.name 'Your Name'"
    exit 1
fi

if ! git config --global user.email > /dev/null 2>&1; then
    echo "❌ Git user.email not configured"
    echo "Please run: git config --global user.email 'your.email@example.com'"
    exit 1
fi

echo "✅ Git configuration verified"
echo ""

# Get GitHub username
read -p "Enter your GitHub username: " GITHUB_USERNAME

if [ -z "$GITHUB_USERNAME" ]; then
    echo "❌ GitHub username is required"
    exit 1
fi

echo ""
echo "📋 Next Steps:"
echo "=============="
echo ""
echo "1. Go to https://github.com/new"
echo "2. Repository name: e-pass-management-system"
echo "3. Description: Digital outpass management system for college girls' hostel"
echo "4. Choose Public or Private"
echo "5. DO NOT initialize with README, .gitignore, or license"
echo "6. Click 'Create repository'"
echo ""
echo "After creating the repository, run these commands:"
echo ""

# Generate the commands
echo "git remote add origin https://github.com/$GITHUB_USERNAME/e-pass-management-system.git"
echo "git branch -M main"
echo "git push -u origin main"
echo ""

echo "🎉 Your repository will be available at:"
echo "https://github.com/$GITHUB_USERNAME/e-pass-management-system"
echo ""

read -p "Press Enter when you've created the repository on GitHub..." 