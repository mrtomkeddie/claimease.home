import { loadStripe } from '@stripe/stripe-js';

// Initialize Stripe with publishable key
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export { stripePromise };

// Product configuration
export const STRIPE_PRODUCTS = {
  STANDARD: {
    priceId: process.env.NEXT_PUBLIC_STRIPE_STANDARD_PRICE_ID!,
    name: 'ClaimEase Standard',
    price: 49,
    currency: 'GBP',
    features: [
      'One full PIP claim',
      'Export answers (PDF/Word)',
      'Free appeal support'
    ]
  },
  PRO: {
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID!,
    name: 'ClaimEase Pro',
    price: 79,
    currency: 'GBP',
    features: [
      'Unlimited PIP claims',
      'Upload medical documents',
      'Free appeal support for every claim'
    ]
  }
} as const;

export type PlanType = keyof typeof STRIPE_PRODUCTS;