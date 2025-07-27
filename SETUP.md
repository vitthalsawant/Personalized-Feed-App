# Setup Guide for Bolt Expo NativeWind

## Environment Variables Setup

To fix the post creation issue, you need to configure your Supabase environment variables:

1. Create a `.env` file in the root directory with the following content:

```
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url_here
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

2. Get these values from your Supabase project dashboard:
   - Go to https://supabase.com/dashboard/project/[YOUR-PROJECT-ID]/settings/api
   - Copy the "Project URL" and "anon public" key

## Database Setup

The database migrations have been updated to fix profile creation issues. Make sure to run the latest migration:

```bash
npx supabase db push
```

## Issues Fixed

1. **Profile Creation**: Added automatic profile creation for new users
2. **Post Creation**: Fixed RLS policies and added better error handling
3. **Debugging**: Added functions to debug post creation issues

## Common Issues and Solutions

### "Profile not found" Error
- The app now automatically creates profiles for users
- If you still get this error, sign out and sign in again

### "Permission denied" Error
- Make sure you're logged in
- Check that your Supabase environment variables are correct
- Ensure the database migrations have been applied

### Posts not saving
- Check the console logs for detailed error messages
- Make sure your Supabase project has the correct RLS policies
- Verify that the user has a profile in the database

## Testing

1. Start the app: `npx expo start`
2. Sign up or sign in with a user account
3. Try creating a post
4. Check the console logs for any error messages

If you still have issues, check the browser console or React Native debugger for detailed error messages. 