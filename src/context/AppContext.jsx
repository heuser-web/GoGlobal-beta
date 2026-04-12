import { createContext, useContext, useState, useCallback, useEffect } from 'react'

const ThemeContext      = createContext();
const FavoritesContext  = createContext();
const MembershipContext = createContext();

const useTheme      = () => useContext(ThemeContext);
const useFavorites  = () => useContext(FavoritesContext);
const useMembership = () => useContext(MembershipContext);

// ─── Theme ────────────────────────────────────────────────────────────────────
function ThemeProvider({ children }) {
  const [dark, setDark] = useState(true);
  return (
    <ThemeContext.Provider value={{ dark, toggle: () => setDark(d => !d) }}>
      {children}
    </ThemeContext.Provider>
  );
}

// ─── Favorites ────────────────────────────────────────────────────────────────
function FavoritesProvider({ children }) {
  const [favorites, setFavorites] = useState([]);
  const addFav = useCallback((item) => {
    setFavorites(prev =>
      prev.find(f => f.id === item.id)
        ? prev.filter(f => f.id !== item.id)
        : [...prev, item]
    );
  }, []);

  const isFav = useCallback((id) =>
    favorites.some(f => f.id === id),
    [favorites]
  );

  return (
    <FavoritesContext.Provider value={{ favorites, addFav, isFav }}>
      {children}
    </FavoritesContext.Provider>
  );
}

// ─── Membership ───────────────────────────────────────────────────────────────
// tier:         'free' | 'local' | 'everywhere'
// selectedCity: city name string (GoLocal only)
// usage:        { romantic: { count, weekStart }, platonic: { count, weekStart },
//                events: { count, weekStart }, happyHours: { count, weekStart } }
//
// All state is persisted to localStorage so it survives page refresh.

const MEMBERSHIP_KEY = 'gg_membership';
const MS_PER_WEEK    = 7 * 24 * 60 * 60 * 1000;

function freshUsage() {
  const weekStart = Date.now();
  return {
    romantic:    { count: 0, weekStart },
    platonic:    { count: 0, weekStart },
    events:      { count: 0, weekStart },
    happyHours:  { count: 0, weekStart },
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem(MEMBERSHIP_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function saveState(state) {
  try {
    localStorage.setItem(MEMBERSHIP_KEY, JSON.stringify(state));
  } catch { /* storage full — ignore */ }
}

// Returns the usage bucket, resetting it if the 7-day window has passed.
function getOrResetBucket(usage, key) {
  const bucket = usage?.[key] ?? { count: 0, weekStart: Date.now() };
  if (Date.now() - bucket.weekStart >= MS_PER_WEEK) {
    return { count: 0, weekStart: Date.now() };
  }
  return bucket;
}

function MembershipProvider({ children }) {
  const [tier, setTierRaw]               = useState('free');
  const [selectedCity, setSelectedCityRaw] = useState(null);
  const [usage, setUsageRaw]             = useState(freshUsage);

  // Hydrate from localStorage on mount
  useEffect(() => {
    const saved = loadState();
    if (!saved) return;
    if (saved.tier)         setTierRaw(saved.tier);
    if (saved.selectedCity) setSelectedCityRaw(saved.selectedCity);
    if (saved.usage)        setUsageRaw(saved.usage);
  }, []);

  // Persist whenever anything changes
  const persist = useCallback((nextTier, nextCity, nextUsage) => {
    saveState({ tier: nextTier, selectedCity: nextCity, usage: nextUsage });
  }, []);

  const setTier = useCallback((t, city = null) => {
    setTierRaw(t);
    setSelectedCityRaw(city);
    setUsageRaw(u => { persist(t, city, u); return u; });
  }, [persist]);

  const setSelectedCity = useCallback((city) => {
    setSelectedCityRaw(city);
    setTierRaw(t => { persist(t, city, usage); return t; });
  }, [persist, usage]);

  // ── Free-tier consumption helpers ──────────────────────────────────────────
  // Returns { allowed: bool, remaining: number|null }
  const canUse = useCallback((feature) => {
    if (tier !== 'free') return { allowed: true, remaining: null };

    const LIMITS = { romantic: 1, platonic: 1, events: 10, happyHours: 10 };
    const limit  = LIMITS[feature];
    if (limit === undefined) return { allowed: true, remaining: null };

    const bucket = getOrResetBucket(usage, feature);
    return { allowed: bucket.count < limit, remaining: Math.max(0, limit - bucket.count) };
  }, [tier, usage]);

  // Call this when the user actually consumes a free-tier slot
  const consume = useCallback((feature) => {
    if (tier !== 'free') return;
    setUsageRaw(prev => {
      const bucket  = getOrResetBucket(prev, feature);
      const updated = { ...prev, [feature]: { ...bucket, count: bucket.count + 1 } };
      persist(tier, selectedCity, updated);
      return updated;
    });
  }, [tier, selectedCity, persist]);

  // ── City access ────────────────────────────────────────────────────────────
  // Returns true if the user can access content for the given city name
  const canAccessCity = useCallback((cityName) => {
    if (tier === 'everywhere') return true;
    if (tier === 'local')      return selectedCity === cityName;
    // Free tier — only Las Vegas for now (the live city)
    return cityName === 'Las Vegas';
  }, [tier, selectedCity]);

  return (
    <MembershipContext.Provider value={{
      tier, selectedCity,
      setTier, setSelectedCity,
      canUse, consume, canAccessCity,
    }}>
      {children}
    </MembershipContext.Provider>
  );
}

export { ThemeProvider, FavoritesProvider, MembershipProvider, useTheme, useFavorites, useMembership }
