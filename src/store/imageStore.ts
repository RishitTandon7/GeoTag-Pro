import { create } from 'zustand';
import { useAuthStore } from './authStore';
import { persist } from 'zustand/middleware';
import { supabase } from '../lib/supabase';

interface ImageLimits {
  free: number;
  loggedInFree: number;
  premium: number;
  friend: number;
}

const IMAGE_LIMITS: ImageLimits = {
  free: 1,
  loggedInFree: 15,
  premium: Infinity,
  friend: Infinity
};

interface ImageStore {
  editedImages: string[];
  addEditedImage: (imageId: string) => boolean;
  addGeneratedImage: () => boolean;
  resetEditedImages: () => void;
  canEditMoreImages: () => boolean;
  getRemainingEdits: () => number;
  getImageLimit: () => number;
  syncWithServer: () => Promise<void>;
}

// Create store with persistence
export const useImageStore = create<ImageStore>()(
  persist(
    (set, get) => ({
      editedImages: [],
      
      addEditedImage: (imageId: string) => {
        // Get remaining edits
        const remaining = get().getRemainingEdits();
        
        if (remaining <= 0) {
          return false;
        }
        
        set(state => ({
          editedImages: [...state.editedImages, imageId]
        }));

        // If user is logged in, attempt to sync with server
        const { user } = useAuthStore.getState();
        if (user) {
          get().syncWithServer();
        }
        
        return true;
      },
      
      addGeneratedImage: () => {
        const { user } = useAuthStore.getState();
        const currentCount = get().editedImages.length;
        const limit = get().getImageLimit();
        
        if (currentCount >= limit) {
          return false;
        }
        
        set(state => ({
          editedImages: [...state.editedImages, crypto.randomUUID()]
        }));

        // If user is logged in, attempt to sync with server
        if (user) {
          get().syncWithServer();
        }
        
        return true;
      },
      
      resetEditedImages: () => {
        set({ editedImages: [] });
      },
      
      canEditMoreImages: () => {
        const remaining = get().getRemainingEdits();
        return remaining > 0;
      },
      
      getImageLimit: () => {
        const { user } = useAuthStore.getState();
        
        if (!user) {
          return IMAGE_LIMITS.free;
        }
        
        // Check for Premium or Friend plan
        if (user.profile?.subscription_tier === 'premium' || 
            user.profile?.subscription_tier === 'friend') {
          return IMAGE_LIMITS[user.profile.subscription_tier];
        }
        
        // Logged in free user
        return IMAGE_LIMITS.loggedInFree;
      },
      
      getRemainingEdits: () => {
        const limit = get().getImageLimit();
        const editCount = get().editedImages.length;
        
        if (limit === Infinity) {
          return Infinity;
        }
        
        return Math.max(0, limit - editCount);
      },

      // New function to sync usage with server
      syncWithServer: async () => {
        const { user } = useAuthStore.getState();
        if (!user) return;

        try {
          // First get the server-side count
          const { data: usageData, error: fetchError } = await supabase
            .from('user_usage')
            .select('downloads_used')
            .eq('user_id', user.id)
            .maybeSingle(); // Use maybeSingle instead of single to handle no rows case

          // If user has no record yet, create one with current counts
          if (!usageData) {
            const { error: insertError } = await supabase
              .from('user_usage')
              .insert({
                user_id: user.id,
                downloads_used: get().editedImages.length,
                last_updated: new Date().toISOString()
              });

            if (insertError) {
              console.error('Error inserting usage data:', insertError);
            }
            return;
          }

          // If server has higher count, use that instead (prevents circumvention)
          const serverCount = usageData.downloads_used || 0;
          const clientCount = get().editedImages.length;
          const finalCount = Math.max(serverCount, clientCount);

          // Update local state if needed
          if (serverCount > clientCount) {
            // Generate enough random IDs to match the server count
            const newIds = Array.from({ length: serverCount - clientCount }, 
              () => crypto.randomUUID());
            
            set(state => ({
              editedImages: [...state.editedImages, ...newIds]
            }));
          }
          // Update server if local count is higher
          else if (clientCount > serverCount) {
            const { error: updateError } = await supabase
              .from('user_usage')
              .update({
                downloads_used: clientCount,
                last_updated: new Date().toISOString()
              })
              .eq('user_id', user.id);

            if (updateError) {
              console.error('Error updating usage data:', updateError);
            }
          }
        } catch (error) {
          console.error('Error syncing with server:', error);
        }
      }
    }),
    {
      name: 'geotag-image-storage', // unique name for localStorage
      // Only persist the editedImages array
      partialize: (state) => ({ editedImages: state.editedImages }),
    }
  )
);