type Profile = {
  subscription_tier?: string | null;
  subscription_status?: string | null;
  stripe_current_period_end?: string | null;
};

export function isPaidUser(profile: Profile | null): boolean {
  if (!profile) return false;
  if (profile.subscription_tier === "pilot" || profile.subscription_tier === "partnership") {
    // If there's a period end, check it hasn't expired
    if (profile.stripe_current_period_end) {
      return new Date(profile.stripe_current_period_end) > new Date();
    }
    // If no period end but tier is set (e.g. manually set), allow access
    return true;
  }
  return false;
}
