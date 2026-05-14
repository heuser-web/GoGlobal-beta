import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ModernPricingPage } from '@/components/ui/animated-glassy-pricing';

// ─── Plan → Stripe plan ID mapping ──────────────────────────────────────────
const STRIPE_PLAN_ID = {
  'Local Pass':    'local-pass',
  'GoEverywhere':  'go-everywhere',
};

// ─── GoGlobal Membership Tiers ───────────────────────────────────────────────
const goglobalPlans = [
  {
    planName: 'Explorer',
    description: 'Dip your toes in. One city, curated essentials — no card needed.',
    price: '0',
    features: [
      "Access to one city's hidden gems",
      '1 spin per week — Friendship segment',
      '1 spin per week — Platonic segment',
    ],
    limitations: [
      'Reviews not available',
      'Midway Meetup not available',
      'One city only',
    ],
    buttonText: 'Start for Free',
    isPopular: false,
  },
  {
    planName: 'Local Pass',
    description: 'Go all-in on your city. Every feature, every spin, every review.',
    price: '5',
    features: [
      "Full access to one city's gems",
      'Unlimited spins — all segments',
      'Reviews fully unlocked',
      'Midway Meetup enabled',
      'Priority city updates',
    ],
    limitations: [],
    buttonText: 'Get Local Pass',
    isPopular: true,
    badge: 'Most Popular',
  },
  {
    planName: 'GoEverywhere',
    description: 'The whole world is your playground. Every city, every feature, no limits.',
    price: '10',
    features: [
      'All cities unlocked',
      'Unlimited spins — all segments',
      'Reviews fully unlocked',
      'Midway Meetup enabled',
      'Early access to new cities',
      'Premium Romey concierge',
    ],
    limitations: [],
    buttonText: 'Go Everywhere',
    isPopular: false,
  },
];

// ─── Checkout toast ───────────────────────────────────────────────────────────
function CheckoutToast({ status, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 5000);
    return () => clearTimeout(t);
  }, [onClose]);

  const isSuccess = status === 'success';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        style={{
          position: 'fixed', bottom: 32, left: '50%', transform: 'translateX(-50%)',
          zIndex: 9999,
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '14px 22px',
          borderRadius: 100,
          background: isSuccess
            ? 'linear-gradient(135deg, rgba(48,209,88,0.15), rgba(48,209,88,0.08))'
            : 'rgba(255,255,255,0.06)',
          border: `1px solid ${isSuccess ? 'rgba(48,209,88,0.4)' : 'rgba(255,255,255,0.1)'}`,
          backdropFilter: 'blur(24px)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          whiteSpace: 'nowrap',
        }}
      >
        <span style={{ fontSize: 18 }}>{isSuccess ? '🎉' : '↩️'}</span>
        <span style={{
          fontFamily: 'var(--font-body, sans-serif)', fontSize: 14, fontWeight: 500,
          color: isSuccess ? '#30D158' : 'rgba(255,255,255,0.7)',
        }}>
          {isSuccess
            ? 'Welcome to GoGlobal! Your plan is now active.'
            : 'No worries — your plan is still waiting when you\'re ready.'}
        </span>
      </motion.div>
    </AnimatePresence>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
const PricingPage = () => {
  const [loadingPlan, setLoadingPlan] = useState(null);
  const [checkoutStatus, setCheckoutStatus] = useState(null); // 'success' | 'cancelled' | null

  // Read Stripe redirect result from URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const result = params.get('checkout');
    if (result === 'success') {
      const sessionId = params.get('session_id');
      if (sessionId) {
        fetch(`/api/checkout-session?session_id=${encodeURIComponent(sessionId)}`)
          .then(res => res.ok ? setCheckoutStatus('success') : setCheckoutStatus('cancelled'))
          .catch(() => setCheckoutStatus('cancelled'));
      } else {
        setCheckoutStatus('cancelled');
      }
      window.history.replaceState({}, '', window.location.pathname);
    } else if (result === 'cancelled') {
      setCheckoutStatus(result);
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const handleSelect = async (planName) => {
    // Free plan — no Stripe needed
    if (planName === 'Explorer') return;

    const stripePlan = STRIPE_PLAN_ID[planName];
    if (!stripePlan) return;

    setLoadingPlan(planName);
    try {
      const res = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: stripePlan }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Server error ${res.status}`);
      }

      const { url } = await res.json();
      window.location.href = url;
    } catch (err) {
      console.error('[Checkout]', err.message);
      setLoadingPlan(null);
    }
  };

  const plans = goglobalPlans.map(plan => ({
    ...plan,
    buttonText: loadingPlan === plan.planName ? 'Redirecting…' : plan.buttonText,
    onButtonClick: () => handleSelect(plan.planName),
  }));

  return (
    <>
      <ModernPricingPage
        title={
          <>
            One pass.{' '}
            <span style={{ color: '#FF2D55' }}>Infinite</span>{' '}
            experiences.
          </>
        }
        subtitle="Start free and explore your city. Upgrade when you're ready to unlock everything GoGlobal has to offer."
        plans={plans}
        showAnimatedBackground={true}
      />

      {checkoutStatus && (
        <CheckoutToast
          status={checkoutStatus}
          onClose={() => setCheckoutStatus(null)}
        />
      )}
    </>
  );
};

export default PricingPage;
