import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";

interface Profile {
  id: string;
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
}

interface AuthState {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
}

export const useAuth = () => {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    profile: null,
    loading: true,
  });

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Auth state changed:", event, session?.user?.email);
        
        setState(prev => ({
          ...prev,
          session,
          user: session?.user ?? null,
        }));

        if (session?.user) {
          // Fetch profile with setTimeout to avoid race condition
          setTimeout(async () => {
            const { data: profile, error } = await supabase
              .from("profiles")
              .select("*")
              .eq("user_id", session.user.id)
              .maybeSingle();
            
            if (error) {
              console.error("Error fetching profile:", error);
            }
            
            setState(prev => ({
              ...prev,
              profile: profile as Profile | null,
              loading: false,
            }));
          }, 100);
        } else {
          setState(prev => ({
            ...prev,
            profile: null,
            loading: false,
          }));
        }
      }
    );

    // THEN get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        setState(prev => ({ ...prev, loading: false }));
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithEmail = async (email: string, password: string) => {
    console.log("Signing in with email:", email);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      console.error("Sign in error:", error);
    }
    return { error };
  };

  const signUpWithEmail = async (email: string, password: string, displayName?: string) => {
    console.log("Signing up with email:", email);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: {
          full_name: displayName,
          display_name: displayName,
        },
      },
    });
    if (error) {
      console.error("Sign up error:", error);
    }
    return { error };
  };

  const signOut = async () => {
    console.log("Signing out");
    const { error } = await supabase.auth.signOut();
    setState({
      user: null,
      session: null,
      profile: null,
      loading: false,
    });
    return { error };
  };

  return {
    ...state,
    signInWithEmail,
    signUpWithEmail,
    signOut,
    isAuthenticated: !!state.user,
  };
};