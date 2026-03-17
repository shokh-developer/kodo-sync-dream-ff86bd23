import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface SubscriptionState {
  subscribed: boolean;
  productId: string | null;
  subscriptionEnd: string | null;
  loading: boolean;
}

// Update these with your actual Stripe product/price IDs
export const TIERS = {
  pro: {
    price_id: "price_PRO_MONTHLY", // Replace with real Stripe price ID
    product_id: "prod_PRO", // Replace with real Stripe product ID
    name: "Pro",
    price: 9.99,
  },
  team: {
    price_id: "price_TEAM_MONTHLY", // Replace with real Stripe price ID
    product_id: "prod_TEAM", // Replace with real Stripe product ID
    name: "Team",
    price: 29.99,
  },
} as const;

export function useSubscription() {
  const [state, setState] = useState<SubscriptionState>({
    subscribed: false,
    productId: null,
    subscriptionEnd: null,
    loading: true,
  });

  const checkSubscription = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setState({ subscribed: false, productId: null, subscriptionEnd: null, loading: false });
        return;
      }

      const { data, error } = await supabase.functions.invoke("check-subscription");
      if (error) throw error;

      setState({
        subscribed: data.subscribed || false,
        productId: data.product_id || null,
        subscriptionEnd: data.subscription_end || null,
        loading: false,
      });
    } catch {
      setState(prev => ({ ...prev, loading: false }));
    }
  }, []);

  useEffect(() => {
    checkSubscription();
    const interval = setInterval(checkSubscription, 60000);
    return () => clearInterval(interval);
  }, [checkSubscription]);

  const getCurrentTier = () => {
    if (!state.subscribed || !state.productId) return "free";
    if (state.productId === TIERS.team.product_id) return "team";
    if (state.productId === TIERS.pro.product_id) return "pro";
    return "free";
  };

  const checkout = async (priceId: string) => {
    const { data, error } = await supabase.functions.invoke("create-checkout", {
      body: { priceId },
    });
    if (error) throw error;
    if (data?.url) window.open(data.url, "_blank");
  };

  const manageSubscription = async () => {
    const { data, error } = await supabase.functions.invoke("customer-portal");
    if (error) throw error;
    if (data?.url) window.open(data.url, "_blank");
  };

  return {
    ...state,
    currentTier: getCurrentTier(),
    checkout,
    manageSubscription,
    refresh: checkSubscription,
  };
}
