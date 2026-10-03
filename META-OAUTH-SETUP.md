# Meta OAuth Setup (Facebook + Instagram)

This guide shows how to set up Facebook + Instagram publishing through OAuth.

## Phase 1: Create a Meta App (15 minutes)

1. Go to https://developers.facebook.com/apps
2. Click **Create App**
3. Choose **Business** type
4. Fill in:
   - App name: `IndianPrograms`
   - Contact email: your email
   - Business account: link to your business or create one
5. Click **Create App**

## Phase 2: Configure OAuth (10 minutes)

1. In your new app's left sidebar, click **App Settings → Basic**
2. Note down:
   - **App ID** (will go in `META_APP_ID`)
   - **App Secret** (click "Show", will go in `META_APP_SECRET`)
3. Add to your `.env.local`:
   ```
   META_APP_ID=1234567890
   META_APP_SECRET=abcd1234...
   ```
4. In **App Settings → Basic**, scroll down and add:
   - **Privacy Policy URL**: `https://indianprograms.com/privacy`
   - **Terms of Service URL**: `https://indianprograms.com/terms`
   - **App Icon**: upload a 1024x1024 icon
5. Save changes

## Phase 3: Add Facebook Login + Instagram Permissions

1. From the dashboard, click **Add Product**
2. Find **Facebook Login** → **Set Up**
3. Choose **Web** platform
4. Enter your site URL: `http://localhost:3000` (for development) or `https://indianprograms.com` (for prod)
5. In **Facebook Login → Settings**, add **Valid OAuth Redirect URIs**:
   - `http://localhost:3000/api/social/oauth/meta/callback`
   - `https://indianprograms.com/api/social/oauth/meta/callback`
6. Save

## Phase 4: Add Test Users (Development)

Until your app is approved, only **test users** can grant the permissions you need.

1. Go to **App Roles → Test Users**
2. Click **Add → Create Test Users**
3. Or click **App Roles → Roles** and add yourself as **Administrator** or **Tester**

Test users (and admin/tester roles) can:
- Grant `pages_manage_posts` permission
- Grant `instagram_content_publish` permission
- Connect their Facebook Pages and Instagram Business accounts

**Important:** The Facebook Page must be a real Page (not a personal profile), and the Instagram account must be:
- A **Business** or **Creator** account
- Linked to a Facebook Page you manage

## Phase 5: Test the Connection

1. Restart your dev server (`npm run dev`)
2. Log in as the test user / admin
3. Go to `/social/accounts`
4. Click **Connect** next to Facebook
5. Facebook OAuth screen opens — grant all permissions
6. You'll be redirected back with a success message
7. All your Pages and linked Instagram accounts are now connected

## Phase 6: Submit for App Review (For Production)

To allow **any user** to connect their Facebook Pages, submit your app for review.

1. Go to **App Review → Permissions and Features**
2. Request these permissions:
   - `pages_show_list`
   - `pages_read_engagement`
   - `pages_manage_posts`
   - `instagram_basic`
   - `instagram_content_publish`
   - `business_management`
3. For each permission, you must provide:
   - **A description** of why your app needs it (e.g., "To publish event announcements to user's Facebook Pages")
   - **A screencast video** demonstrating the use case
   - **Step-by-step instructions** for the reviewer
4. Submit

**Approval timeline:** Usually 1-3 weeks. Meta is strict about videos showing the actual feature in action.

## Phase 7: Business Verification

For some permissions (especially `business_management`), you also need:
1. **Business Verification** — Meta verifies your business is real
2. Provide: business documents (incorporation papers, utility bill, tax document)
3. Takes 1-2 weeks

## Troubleshooting

**"This app is in development mode"**
- The user trying to connect isn't a test user/admin. Add them in App Roles.

**"Permission not granted"**
- The user clicked "Decline" or unchecked a permission. Disconnect and try again.

**"No pages found"**
- The user must be an admin of at least one Facebook Page.

**"Instagram account not linked"**
- The Instagram account must be a Business account linked to a Facebook Page they manage.

**"Token expired"**
- Long-lived page tokens last ~60 days. The scheduler should re-fetch tokens before they expire (TODO: implement token refresh).

## Real Posting Test

Once a test user has connected their Facebook Page:

1. Go to `/social/compose`
2. Write a post, select your Facebook page as the platform
3. Click **Post Now** (or schedule for 1 minute from now)
4. Run the scheduler: `npx tsx scripts/social-scheduler/index.ts`
5. Check the Facebook page — your post should be live!
6. Check `/social/queue` — the post status should show as Published

## What's Real vs Mock

| Platform | Status |
|----------|--------|
| Facebook | ✅ Real (Graph API v21) |
| Instagram | ✅ Real (Graph API v21, requires image) |
| Twitter / X | ⏳ Mock (real requires $100/mo API) |
| Threads | ⏳ Mock (uses Meta API, ready to add) |
| LinkedIn | ⏳ Mock (real requires app review) |
| TikTok | ⏳ Mock (real requires app review) |
| YouTube | ⏳ Mock (real requires app review) |
