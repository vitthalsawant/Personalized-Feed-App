import { Tabs, Redirect } from 'expo-router';
import { Chrome as Home, Heart, Plus, User, FileText, Users } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';

export default function TabLayout() {
  const { user, loading } = useAuth();

  if (loading) {
    return null;
  }

  if (!user) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#3b82f6',
        tabBarInactiveTintColor: '#64748b',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#e2e8f0',
          paddingTop: 12,
          paddingBottom: 20,
          height: 85,
          paddingHorizontal: 16,
          elevation: 12,
          shadowColor: '#000',
          shadowOffset: {
            width: 0,
            height: -3,
          },
          shadowOpacity: 0.15,
          shadowRadius: 6,
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontFamily: 'Inter-Medium',
          marginTop: 6,
          marginBottom: 4,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Global',
          tabBarIcon: ({ size, color }) => (
            <Home size={size} color={color} />
          ),
          tabBarIconStyle: {
            marginTop: 4,
          },
        }}
      />
      <Tabs.Screen
        name="personalized"
        options={{
          title: 'For You',
          tabBarIcon: ({ size, color }) => (
            <Heart size={size} color={color} />
          ),
          tabBarIconStyle: {
            marginTop: 4,
          },
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          title: 'Create',
          tabBarIcon: ({ size, color }) => (
            <Plus size={size} color={color} />
          ),
          tabBarIconStyle: {
            marginTop: 4,
          },
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ size, color }) => (
            <User size={size} color={color} />
          ),
          tabBarIconStyle: {
            marginTop: 4,
          },
        }}
      />
      <Tabs.Screen
        name="user-posts"
        options={{
          href: null, // Hide from tab bar
        }}
      />
      <Tabs.Screen
        name="following"
        options={{
          href: null, // Hide from tab bar
        }}
      />
    </Tabs>
  );
}