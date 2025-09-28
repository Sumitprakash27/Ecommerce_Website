@echo off
echo ========================================
echo   E-COMMERCE APP - GITHUB UPLOAD
echo ========================================
echo.
echo STEP 1: Create GitHub Repository
echo 1. Go to https://github.com
echo 2. Click "New repository"
echo 3. Name: ecommerce-web-app
echo 4. Make it PUBLIC
echo 5. Click "Create repository"
echo.
echo STEP 2: Copy the repository URL
echo It will look like: https://github.com/YOUR-USERNAME/ecommerce-web-app.git
echo.
echo STEP 3: Run this script after creating the repo
echo.
pause
echo.
echo Enter your GitHub username:
set /p username=
echo.
echo Pushing to GitHub...
git remote add origin https://github.com/%username%/ecommerce-web-app.git
git branch -M main
git push -u origin main
echo.
echo ========================================
echo   SUCCESS! Your code is on GitHub!
echo ========================================
echo.
echo Next: Deploy to Railway for live website
echo 1. Go to https://railway.app
echo 2. Sign up with GitHub
echo 3. Deploy your repository
echo 4. Get live URL to share with team
echo.
pause