# Platform (Reddit-Style App)

 this project is a Reddit-style mobile app 
## 🚀 Features

- **Global Feed**: See all posts from the community
- **Personalized Feed**: Posts tailored to your interests (tags, follows)
- **Create Post**: Add title, description, tags, images, and location
- **User Profiles**: View and edit your profile, see your posts in a grid
- **Reactions**: Like/love posts
- **Follow Users**: Influence your personalized feed
- **Modern UI**: Mobile-first, scrollable feeds, Instagram-like profile grid

---

## 🛠️ Tech Stack

- **Frontend**: React Native (Expo)
- **Backend**: Supabase (Postgres DB + Auth)
- **Icons/UI**: Lucide, custom styles
- **State/Logic**: React Context, hooks

---

## 🗄️ Database Schema (Supabase)

- **profiles**: User info (id, username, full name, avatar, etc.)
- **posts**: Posts (id, title, description, author_id, location, images, timestamps)
- **tags**: Tag list
- **post_tags**: Many-to-many post/tag relation
- **follows**: User follows
- **user_preferences**: User's preferred tags
- **reactions**: Likes/loves on posts

**RLS (Row Level Security):**
- Users can only modify their own data
- Public can read posts/profiles, only authenticated users can create/modify their own content

---

## 📱 User Flow

1. **Sign Up / Login**: Google Auth via Supabase
2. **Global Feed**: See all posts from all users
3. **Personalized Feed**: See posts based on your tags and follows
4. **Create Post**: Add new posts with title, description, tags, images, location
5. **Profile**: View/edit your info, see your posts in a grid, sign out
6. **Interact**: React to posts, follow users, discover content

---

## 🎯 Assignment Requirements & How This App Delivers

| Requirement                        | How This App Delivers                                                                 |
|-------------------------------------|--------------------------------------------------------------------------------------|
| Google Sign-In (Supabase Auth)      | Implemented with session management and deep linking                                 |
| Global Feed                        | All posts shown, with author, tags, images, etc.                                     |
| Personalized Feed                  | Posts filtered by user’s preferences and follows                                     |
| Create Post                        | Form for title, description, tags, images, location; posts saved to Supabase         |
| Post Details                       | Each post shows title, description, tags, author, timestamp, (optional) location/img |
| Profile                            | User info, stats, and grid of user’s posts                                           |
| Data Modeling                      | Well-structured schema with RLS for security                                         |
| Modern UI/UX                       | Clean, mobile-friendly design, scrollable feeds, and profile grid                    |

---

## 💡 Personalization Logic
- Personalized feed is based on user’s preferred tags and followed users.
- Users can set their preferences and follow others to influence their feed.

---

## 🏗️ How to Run

1. **Clone the repo**
2. **Set up Supabase**: Create a project, run the migrations, and set your environment variables
3. **Install dependencies**: `npm install`
4. **Start the app**: `npx expo start`

---

## 📝 Notes
- Deep linking for Google Auth may behave differently in Expo Go vs. custom builds. If you have issues, try hardcoding the redirect URL as a workaround.
- All sensitive operations are protected by Supabase RLS.

---

## 👨‍💻 What You’ll See
- **Full-stack, Reddit-style mobile app**
- Secure Google Auth
- Public and personalized feeds
- Post creation and tagging
- User profiles and post grids
- Reactions and following
- Modern, mobile-first UI

---

**Built for the Anicca Labs Full Stack Developer Assignment.**
