# Appwrite Setup Guide

This guide explains how to configure Appwrite authentication for ExamArchive.

## Prerequisites

- An Appwrite Cloud account (https://cloud.appwrite.io)
- A GitHub OAuth application

## Step 1: Create Appwrite Project

1. Go to https://cloud.appwrite.io/console
2. Create a new project or select an existing one
3. Note your **Project ID** from the Settings page

## Step 2: Configure GitHub OAuth and Platforms

### Add Platforms in Appwrite

1. In your Appwrite project, go to **Auth** → **Settings**
2. Click **Add Platform** → **Web**
3. Add the following platforms:
   - **Production**: `https://omdas11.github.io/examarchive-v2`
   - **Local Development**: `http://localhost:8000` or `http://localhost:8080`
   - **Custom Domain** (if using): `https://examarchive.dev`

### Configure GitHub OAuth Provider

1. Go to **Auth** → **Providers** and enable **GitHub**
2. Create a GitHub OAuth App:
   - Go to GitHub Settings → Developer settings → OAuth Apps
   - Create a new OAuth App with these settings:
     - **Homepage URL**: `https://omdas11.github.io/examarchive-v2`
     - **Authorization callback URL**: `https://sgp.cloud.appwrite.io/v1/account/sessions/oauth2/callback/github/6978b0e3000761212146`
3. Copy the **Client ID** and **Client Secret** from GitHub
4. Paste them into Appwrite's GitHub provider settings

**Note**: The code automatically handles different environments:
- GitHub Pages: Uses `https://omdas11.github.io/examarchive-v2`
- localhost: Uses `http://localhost:[port]`
- examarchive.dev: Uses `https://examarchive.dev`

## Step 3: Verify Configuration

The project is already configured with:
- **Project ID**: `6978b0e3000761212146`
- **Endpoint**: `https://sgp.cloud.appwrite.io/v1`
- **OAuth Provider**: GitHub

The code in `js/appwrite.js` automatically detects the environment and uses the correct redirect URL.

## Step 4: Test Authentication

1. Open your ExamArchive site at one of the configured URLs:
   - **Production**: https://omdas11.github.io/examarchive-v2/login.html
   - **Local**: http://localhost:8000/login.html
2. Click "Continue with GitHub" button
3. Authorize the application on GitHub
4. You should be redirected back to the home page and see your avatar

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
