import { supabase } from './supabase';

export const testSupabaseConnection = async () => {
  try {
    console.log('Testing Supabase connection...');
    
    // Test basic connection
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('Supabase connection error:', error);
      return { success: false, error };
    }
    
    console.log('Supabase connection successful');
    return { success: true, data };
  } catch (err) {
    console.error('Unexpected error:', err);
    return { success: false, error: err };
  }
};

export const testPostCreation = async (userId: string) => {
  try {
    console.log('Testing post creation for user:', userId);
    
    // Test if user can create a post
    const { data, error } = await supabase
      .from('posts')
      .insert({
        title: 'Test Post',
        description: 'This is a test post',
        author_id: userId,
        location: 'Test Location',
      })
      .select()
      .single();
    
    if (error) {
      console.error('Post creation test error:', error);
      return { success: false, error };
    }
    
    console.log('Post creation test successful:', data);
    
    // Clean up test post
    await supabase
      .from('posts')
      .delete()
      .eq('id', data.id);
    
    return { success: true, data };
  } catch (err) {
    console.error('Unexpected error in post creation test:', err);
    return { success: false, error: err };
  }
}; 