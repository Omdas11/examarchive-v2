# Appwrite Setup Guide

This guide explains how to configure Appwrite authentication for ExamArchive.

## Prerequisites

- An Appwrite Cloud account (https://cloud.appwrite.io)
- A GitHub OAuth application

## Step 1: Create Appwrite Project

1. Go to https://cloud.appwrite.io/console
2. Create a new project or select an existing one
3. Note your **Project ID** from the Settings page

## Step 2: Configure GitHub OAuth

1. In your Appwrite project, go to **Auth** → **Settings**
2. Click **Add Platform** → **Web**
3. Add your domain (e.g., `https://yourdomain.com` or `http://localhost:8000` for local testing)
4. Go to **Auth** → **Providers** and enable **GitHub**
5. Create a GitHub OAuth App:
   - Go to GitHub Settings → Developer settings → OAuth Apps
   - Create a new OAuth App
   - Set **Authorization callback URL** to your Appwrite endpoint + `/v1/account/sessions/oauth2/callback/github/YOUR_PROJECT_ID`
   - Example: `https://cloud.appwrite.io/v1/account/sessions/oauth2/callback/github/YOUR_PROJECT_ID`
6. Copy the **Client ID** and **Client Secret** from GitHub
7. Paste them into Appwrite's GitHub provider settings

## Step 3: Update ExamArchive Configuration

1. Open `js/appwrite.js`
2. Replace `YOUR_PROJECT_ID` with your actual Appwrite project ID:
   ```javascript
   const APPWRITE_PROJECT_ID = "your-actual-project-id";
   ```

## Step 4: Test Authentication

1. Open your ExamArchive site
2. Click the avatar or Login button
3. Click "Continue with GitHub"
4. Authorize the application
5. You should be redirected back and logged in

## Features

ExamArchive uses Appwrite for:

- **Authentication**: GitHub OAuth login
- **Session Management**: Secure session handling
- **User Preferences**: Store user settings (display name, avatar URL, etc.)

## Troubleshooting

### "Appwrite SDK not available" error
- Ensure the Appwrite CDN script is loaded before appwrite.js
- Check browser console for network errors

### OAuth redirect fails
- Verify your callback URL is correctly configured in both GitHub and Appwrite
- Ensure your domain is added as a platform in Appwrite

### User preferences not saving
- Check that the user is authenticated
- Verify console logs for API errors
- Ensure your Appwrite project has the correct permissions

## Security Notes

- Never commit your Appwrite project ID to public repositories if using sensitive data
- Keep your GitHub OAuth client secret secure
- Use environment variables for production deployments

## Local Development

For local testing:
1. Add `http://localhost:8000` (or your local port) as a platform in Appwrite
2. Update GitHub OAuth callback URL to include localhost
3. Serve the site locally (e.g., `python3 -m http.server`)

## Production Deployment

1. Ensure your production domain is added to Appwrite platforms
2. Update GitHub OAuth with production callback URL
3. Test authentication flow in production environment

## Support

For Appwrite-specific issues, consult:
- Appwrite Documentation: https://appwrite.io/docs
- Appwrite Discord: https://appwrite.io/discord
