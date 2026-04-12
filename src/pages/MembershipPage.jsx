import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Check, X, Globe, MapPin, Zap, Star, Lock, Unlock,
  ChevronRight, Loader2, Crown, Building2, ArrowLeft,
  RefreshCw, Sparkles, Users, Calendar, Heart, Laugh,
  Navigation, Gem
} from 'lucide-react';
import { useMembership, useTheme } from '../context/AppContext';
import { CITIES } from '../data/constants';

// ─── Design tokens ────────────────────────────────────────────────────────────
const ROSE    = '#FF2D55';
const GOLD    = '#C9A84C';
const ELEC    = '#5E5CE6';

// ─── Stripe plan IDs (must match server/index.js) ────────────────────────────
const STRIPE_PLAN = {
  local:      'local-pass',
  everywhere: 'go-everywhere',
};

// ─── Tier definitions ─────────────────────────────────────────────────────────
const TIERS = [
  {
    id:          'free',
    name:        'Explorer',
    price:       null,
    accent:      'rgba(255,255,255,0.5)',
    accentSolid: 'rgba(255,255,255,0.12)',
    tagline:     'Start exploring, no card needed.',
    badge:       null,
    features: [
      { icon: Gem,        label: 'Hidden Gems — Las Vegas',            included: true  },
      { icon: Heart,      label: '1 Romance spin per week',            included: true  },
      { icon: Laugh,      label: '1 Squad spin per week',              included: true  },
      { icon: Calendar,   label: '10 Events · refreshes weekly',       included: true  },
      { icon: Zap,        label: '10 Happy Hours · refreshes weekly',  included: true  },
      { icon: Navigation, label: 'Midway Meetup',                      included: false },
      { icon: Star,       label: 'Reviews',                            included: false },
      { icon: Globe,      label: 'Multiple cities',                    included: false },
    ],
  },
  {
    id:          'local',
    name:        'GoLocal',
    price:       15,
    accent:      ROSE,
    accentSolid: `${ROSE}22`,
    tagline:     'Every feature. One city. Your city.',
    badge:       'Most Popular',
    features: [
      { icon: Gem,        label: 'Hidden Gems — your city',            included: true },
      { icon: Heart,      label: 'Unlimited Romance spins',            included: true },
      { icon: Laugh,      label: 'Unlimited Squad spins',              included: true },
      { icon: Calendar,   label: 'All events & happy hours',           included: true },
      { icon: Navigation, label: 'Midway Meetup',                      included: true },
      { icon: Star,       label: 'Reviews fully unlocked',             included: true },
      { icon: RefreshCw,  label: 'Priority city updates',              included: true },
      { icon: Globe,      label: 'Multiple cities',                    included: false },
    ],
  },
  {
    id:          'everywhere',
    name:        'GoEverywhere',
    price:       25,
    accent:      GOLD,
    accentSolid: `${GOLD}22`,
    tagline:     'Every city. Every feature. No limits.',
    badge:       'Best Value',
    features: [
      { icon: Globe,      label: 'All 12 cities unlocked',             included: true },
      { icon: Gem,        label: 'Hidden Gems in every city',          included: true },
      { icon: Heart,      label: 'Unlimited Romance spins',            included: true },
      { icon: Laugh,      label: 'Unlimited Squad spins',              included: true },
      { icon: Calendar,   label: 'All events & happy hours',           included: true },
      { icon: Navigation, label: 'Midway Meetup',                      included: true },
      { icon: Star,       label: 'Reviews fully unlocked',             included: true },
      { icon: Sparkles,   label: 'Early access to new cities',         included: true },
    ],
  },
];

// ─── Small helpers ────────────────────────────────────────────────────────────
function FeatureRow({ icon: Icon, label, included, accent }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '7px 0',
      opacity: included ? 1 : 0.35,
    }}>
      <div style={{
        width: 22, height: 22, borderRadius: 6, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: included ? `${accent}22` : 'rgba(255,255,255,0.04)',
      }}>
        {included
          ? <Check size={11} color={accent} strokeWidth={3} />
          : <X     size={11} color="rgba(255,255,255,0.3)" strokeWidth={2} />
        }
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
        <Icon size={13} color={included ? accent : 'rgba(255,255,255,0.25)'} />
        <span style={{
          fontFamily: 'var(--font-body)', fontSize: 13,
          color: included ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.3)',
        }}>
          {label}
        </span>
      </div>
    </div>
  );
}

// ─── Individual tier card ─────────────────────────────────────────────────────
function TierCard({ tier, isCurrent, onSelect, loading }) {
  const isPopular = tier.id === 'local';
  const isPremium = tier.id === 'everywhere';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      style={{
        position: 'relative',
        flex: '1 1 280px',
        maxWidth: 340,
        display: 'flex',
        flexDirection: 'column',
        padding: '28px 26px 24px',
        borderRadius: 24,
        background: isPopular
          ? `linear-gradient(145deg, rgba(255,45,85,0.12) 0%, rgba(255,45,85,0.04) 100%)`
          : isPremium
          ? `linear-gradient(145deg, rgba(201,168,76,0.10) 0%, rgba(201,168,76,0.03) 100%)`
          : 'rgba(255,255,255,0.03)',
        border: `1px solid ${isCurrent
          ? tier.accent
          : isPopular
          ? `${ROSE}40`
          : isPremium
          ? `${GOLD}30`
          : 'rgba(255,255,255,0.07)'}`,
        backdropFilter: 'blur(20px)',
        boxShadow: isCurrent
          ? `0 0 0 2px ${tier.accent}, 0 8px 48px ${tier.accent}20`
          : isPopular
          ? `0 8px 48px ${ROSE}18`
          : 'none',
        transform: isPopular ? 'scale(1.02)' : 'scale(1)',
      }}
    >
      {/* Popular / Best Value badge */}
      {tier.badge && (
        <div style={{
          position: 'absolute', top: -13, left: '50%', transform: 'translateX(-50%)',
          padding: '4px 14px', borderRadius: 100,
          background: isPopular ? ROSE : GOLD,
          fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 700,
          color: '#fff', whiteSpace: 'nowrap', letterSpacing: '0.06em',
          textTransform: 'uppercase',
        }}>
          {tier.badge}
        </div>
      )}

      {/* Active indicator */}
      {isCurrent && (
        <div style={{
          position: 'absolute', top: 16, right: 16,
          display: 'flex', alignItems: 'center', gap: 5,
          padding: '3px 10px', borderRadius: 100,
          background: `${tier.accent}18`,
          border: `1px solid ${tier.accent}40`,
        }}>
          <motion.div
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            style={{ width: 6, height: 6, borderRadius: '50%', background: tier.accent }}
          />
          <span style={{ fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 600, color: tier.accent, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Active
          </span>
        </div>
      )}

      {/* Plan name */}
      <h3 style={{
        fontFamily: 'var(--font-display)', fontWeight: 700,
        fontSize: 26, color: '#F5F5F7', margin: '0 0 6px',
        letterSpacing: '-0.02em',
      }}>
        {tier.name}
      </h3>
      <p style={{
        fontFamily: 'var(--font-body)', fontSize: 13,
        color: 'rgba(255,255,255,0.45)', margin: '0 0 20px', lineHeight: 1.5,
      }}>
        {tier.tagline}
      </p>

      {/* Price */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 22 }}>
        {tier.price ? (
          <>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 44, fontWeight: 300, color: '#fff', lineHeight: 1 }}>
              ${tier.price}
            </span>
            <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'rgba(255,255,255,0.35)' }}>
              / mo
            </span>
          </>
        ) : (
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 44, fontWeight: 300, color: '#fff', lineHeight: 1 }}>
            Free
          </span>
        )}
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: `linear-gradient(90deg, transparent, ${tier.accent}30, transparent)`, marginBottom: 18 }} />

      {/* Features */}
      <div style={{ flex: 1 }}>
        {tier.features.map((f, i) => (
          <FeatureRow key={i} {...f} accent={tier.accent} />
        ))}
      </div>

      {/* CTA */}
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={() => !isCurrent && onSelect(tier.id)}
        disabled={isCurrent || loading === tier.id}
        style={{
          marginTop: 24,
          width: '100%', padding: '13px',
          borderRadius: 100, border: 'none',
          background: isCurrent
            ? 'rgba(255,255,255,0.06)'
            : tier.price
            ? tier.accent
            : 'rgba(255,255,255,0.08)',
          color: isCurrent ? 'rgba(255,255,255,0.3)' : '#fff',
          fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 600,
          cursor: isCurrent ? 'default' : 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
          boxShadow: (!isCurrent && tier.price) ? `0 4px 20px ${tier.accent}40` : 'none',
          transition: 'box-shadow 0.2s',
        }}
      >
        {loading === tier.id ? (
          <><Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> Redirecting…</>
        ) : isCurrent ? (
          <><Check size={14} /> Current Plan</>
        ) : tier.id === 'free' ? (
          <>Start Free</>
        ) : (
          <>Upgrade · ${tier.price}/mo <ChevronRight size={14} /></>
        )}
      </motion.button>
    </motion.div>
  );
}

// ─── City picker overlay ──────────────────────────────────────────────────────
function CityPicker({ onSelect, onClose, currentCity }) {
  const [search, setSearch] = useState('');
  const filtered = CITIES.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.state.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(12px)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        padding: '0 16px 24px',
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{ type: 'spring', stiffness: 380, damping: 38 }}
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 600,
          background: 'rgba(14,14,18,0.98)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 28, overflow: 'hidden',
          maxHeight: '85vh', display: 'flex', flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div style={{ padding: '24px 24px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, color: '#F5F5F7', margin: 0 }}>
                Choose your city
              </h3>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'rgba(255,255,255,0.4)', margin: '4px 0 0' }}>
                GoLocal unlocks every feature for one city.
              </p>
            </div>
            <button
              onClick={onClose}
              style={{ background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: 10, width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'rgba(255,255,255,0.5)' }}
            >
              <X size={16} />
            </button>
          </div>
          {/* Search */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '10px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <MapPin size={14} color="rgba(255,255,255,0.3)" />
            <input
              autoFocus
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search cities…"
              style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', fontFamily: 'var(--font-body)', fontSize: 14, color: '#F5F5F7' }}
            />
          </div>
        </div>

        {/* City grid */}
        <div style={{ overflow: 'auto', padding: '16px 20px 24px', flex: 1 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: 10 }}>
            {filtered.map(city => {
              const isActive = city.name === currentCity;
              const isLive   = city.live;
              return (
                <motion.button
                  key={city.name}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => isLive && onSelect(city.name)}
                  style={{
                    padding: '14px 16px', borderRadius: 16, border: 'none',
                    background: isActive ? `${city.color}20` : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${isActive ? city.color + '60' : 'rgba(255,255,255,0.06)'}`,
                    cursor: isLive ? 'pointer' : 'not-allowed',
                    opacity: isLive ? 1 : 0.4,
                    textAlign: 'left',
                    transition: 'background 0.2s, border-color 0.2s',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 22 }}>{city.icon}</span>
                    {!isLive && <Lock size={11} color="rgba(255,255,255,0.3)" />}
                    {isActive && <Check size={12} color={city.color} strokeWidth={3} />}
                  </div>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, color: isActive ? city.color : '#F5F5F7', marginBottom: 2 }}>
                    {city.name}
                  </div>
                  <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>
                    {city.state}
                  </div>
                  {!isLive && (
                    <div style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: GOLD, marginTop: 4, fontWeight: 600 }}>
                      Coming soon
                    </div>
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Active membership summary ────────────────────────────────────────────────
function ActiveBanner({ tier, selectedCity, onManage }) {
  const tierDef = TIERS.find(t => t.id === tier);
  if (!tierDef) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: 12,
        padding: '14px 20px', borderRadius: 16, marginBottom: 48,
        background: `linear-gradient(135deg, ${tierDef.accent}14, ${tierDef.accent}06)`,
        border: `1px solid ${tierDef.accent}30`,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: `${tierDef.accent}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          {tier === 'free'       ? <Unlock   size={17} color={tierDef.accent} /> : null}
          {tier === 'local'      ? <MapPin   size={17} color={tierDef.accent} /> : null}
          {tier === 'everywhere' ? <Crown    size={17} color={tierDef.accent} /> : null}
        </div>
        <div>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 600, color: tierDef.accent, margin: 0, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
            Active Plan
          </p>
          <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: '#F5F5F7', margin: '2px 0 0' }}>
            {tierDef.name}
            {tier === 'local' && selectedCity ? ` · ${selectedCity}` : ''}
            {tier === 'everywhere' ? ' · All Cities' : ''}
          </p>
        </div>
      </div>
      {tier !== 'free' && (
        <a
          href="https://billing.stripe.com/p/login/test_eVa8yK0Ht9Z88HS144"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '8px 16px', borderRadius: 100,
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.1)',
            fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 500,
            color: 'rgba(255,255,255,0.6)', textDecoration: 'none',
          }}
        >
          Manage billing <ChevronRight size={12} />
        </a>
      )}
    </motion.div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function MembershipPage() {
  const { tier, selectedCity, setTier, setSelectedCity } = useMembership();
  const { dark } = useTheme();

  const [loading, setLoading]       = useState(null);  // tier id being processed
  const [showPicker, setShowPicker] = useState(false);
  const [toastMsg, setToastMsg]     = useState(null);

  // Handle Stripe return URL params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const result = params.get('checkout');
    const plan   = params.get('plan');

    if (result === 'success' && plan) {
      const newTier = plan === 'local-pass' ? 'local' : 'everywhere';
      setTier(newTier, newTier === 'local' ? (selectedCity || null) : null);
      setToastMsg('🎉  Welcome! Your plan is now active.');
      if (newTier === 'local' && !selectedCity) setShowPicker(true);
    } else if (result === 'cancelled') {
      setToastMsg('↩️  No changes made — your plan is still waiting.');
    }

    if (result) {
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []); // eslint-disable-line

  // Auto-dismiss toast
  useEffect(() => {
    if (!toastMsg) return;
    const t = setTimeout(() => setToastMsg(null), 5000);
    return () => clearTimeout(t);
  }, [toastMsg]);

  const handleSelect = async (tierId) => {
    // Free — just set locally, no Stripe
    if (tierId === 'free') {
      setTier('free', null);
      setToastMsg('✅  Switched to Explorer (free).');
      return;
    }

    // GoLocal — need city first, THEN checkout
    if (tierId === 'local') {
      setShowPicker(true);
      return;
    }

    // GoEverywhere — straight to Stripe
    await startCheckout(tierId, null);
  };

  const handleCityPicked = async (cityName) => {
    setShowPicker(false);
    // If already on GoLocal just update city
    if (tier === 'local') {
      setSelectedCity(cityName);
      setToastMsg(`📍  City updated to ${cityName}.`);
      return;
    }
    // Otherwise start checkout for GoLocal
    await startCheckout('local', cityName);
  };

  const startCheckout = async (tierId, city) => {
    setLoading(tierId);
    try {
      const res = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: STRIPE_PLAN[tierId] }),
      });
      if (!res.ok) throw new Error('Server error');
      const { url } = await res.json();
      // Stash chosen city in sessionStorage so we can restore after redirect
      if (city) sessionStorage.setItem('gg_pending_city', city);
      window.location.href = url;
    } catch (err) {
      console.error('[Checkout]', err);
      setToastMsg('⚠️  Could not connect to payment. Try again.');
      setLoading(null);
    }
  };

  // Restore pending city after successful checkout
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('checkout') === 'success') {
      const pendingCity = sessionStorage.getItem('gg_pending_city');
      if (pendingCity) {
        setSelectedCity(pendingCity);
        sessionStorage.removeItem('gg_pending_city');
      }
    }
  }, []); // eslint-disable-line

  const tp = dark ? '#F5F5F7' : '#1D1D1F';
  const tm = dark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)';

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '56px 24px 96px' }}>

      {/* ── Page header ────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        style={{ textAlign: 'center', marginBottom: 64 }}
      >
        <motion.span
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '5px 16px', borderRadius: 100,
            background: `${ROSE}12`, color: ROSE,
            fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 600,
            letterSpacing: '0.08em', textTransform: 'uppercase',
            border: `1px solid ${ROSE}25`, marginBottom: 20,
          }}
        >
          <Crown size={11} /> GoGlobal Membership
        </motion.span>

        <h1 style={{
          fontFamily: 'var(--font-display)', fontWeight: 700,
          fontSize: 'clamp(32px, 5vw, 52px)', lineHeight: 1.05,
          color: tp, margin: '0 0 16px', letterSpacing: '-0.03em',
        }}>
          Choose your pass.
          <br />
          <span style={{ color: ROSE }}>Unlock your city.</span>
        </h1>
        <p style={{
          fontFamily: 'var(--font-body)', fontSize: 17, color: tm,
          maxWidth: 480, margin: '0 auto', lineHeight: 1.6,
        }}>
          Start free, go local, or go everywhere — cancel anytime, no fine print.
        </p>
      </motion.div>

      {/* ── Active plan banner ─────────────────────────────────── */}
      <ActiveBanner tier={tier} selectedCity={selectedCity} />

      {/* ── Tier cards ─────────────────────────────────────────── */}
      <div style={{
        display: 'flex', flexWrap: 'wrap',
        gap: 20, justifyContent: 'center',
        alignItems: 'stretch',
      }}>
        {TIERS.map((t, i) => (
          <TierCard
            key={t.id}
            tier={t}
            isCurrent={tier === t.id}
            onSelect={handleSelect}
            loading={loading}
            delay={i * 0.08}
          />
        ))}
      </div>

      {/* ── GoLocal city change link ────────────────────────────── */}
      {tier === 'local' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{ textAlign: 'center', marginTop: 32 }}
        >
          <button
            onClick={() => setShowPicker(true)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 7,
              padding: '9px 20px', borderRadius: 100, border: 'none',
              background: 'rgba(255,255,255,0.05)',
              fontFamily: 'var(--font-body)', fontSize: 13,
              color: 'rgba(255,255,255,0.5)', cursor: 'pointer',
            }}
          >
            <MapPin size={13} />
            Change city · currently <strong style={{ color: ROSE }}>{selectedCity || 'none set'}</strong>
          </button>
        </motion.div>
      )}

      {/* ── Fine print ─────────────────────────────────────────── */}
      <motion.p
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
        style={{
          textAlign: 'center', marginTop: 52,
          fontFamily: 'var(--font-body)', fontSize: 12,
          color: 'rgba(255,255,255,0.2)', lineHeight: 1.7,
        }}
      >
        Cancel anytime · Stripe-secured · Billed monthly · New cities added regularly
      </motion.p>

      {/* ── City picker sheet ───────────────────────────────────── */}
      <AnimatePresence>
        {showPicker && (
          <CityPicker
            currentCity={selectedCity}
            onSelect={handleCityPicked}
            onClose={() => setShowPicker(false)}
          />
        )}
      </AnimatePresence>

      {/* ── Toast ──────────────────────────────────────────────── */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            key="toast"
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            style={{
              position: 'fixed', bottom: 32, left: '50%', transform: 'translateX(-50%)',
              zIndex: 999,
              padding: '13px 22px', borderRadius: 100,
              background: 'rgba(20,20,24,0.95)',
              backdropFilter: 'blur(24px)',
              border: '1px solid rgba(255,255,255,0.12)',
              boxShadow: '0 8px 40px rgba(0,0,0,0.5)',
              fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 500,
              color: '#F5F5F7', whiteSpace: 'nowrap',
            }}
          >
            {toastMsg}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
