'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Shield, Sparkles, CheckCircle, FileText, TrendingUp, ArrowRight, Lock, Database, Smartphone, HelpCircle } from 'lucide-react';
import { ClaimEaseLogo } from './ClaimEaseLogo';
import { Footer } from './Footer';
import type { User } from '@/contexts/UserContext';
import { UserTier } from '@/lib/constants';
import { poppins, gilroyHeavy } from '@/lib/fonts';
import { AnimatedSection } from './AnimatedSection';

interface OnboardingProps {
  onComplete: (user: User) => void;
}

export function Onboarding({ onComplete }: OnboardingProps) {
  const [formData, setFormData] = useState({
    email: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'standard' | 'pro'>('standard');
  const [errors, setErrors] = useState<{name?: string; email?: string}>({});

  // Animation refs
  const heroRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLDivElement>(null);
  const benefitsRef = useRef<HTMLDivElement>(null);
  const howItWorksRef = useRef<HTMLDivElement>(null);
  const pricingRef = useRef<HTMLDivElement>(null);
  const appealRef = useRef<HTMLDivElement>(null);
  const faqRef = useRef<HTMLDivElement>(null);
  // Dedicated refs to avoid reusing the same ref on multiple elements
  const heroLogoRef = useRef<HTMLDivElement>(null);
  const heroContentRef = useRef<HTMLDivElement>(null);
  // Root container ref to scope animation readiness
  const rootRef = useRef<HTMLDivElement>(null);

  // Intersection Observer for animations - REMOVED
  useEffect(() => {
    // Animation logic removed - all elements appear immediately
    return;
  }, []);

  const scrollToForm = () => {
    const el = document.getElementById('start-claim');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = (): boolean => {
    const newErrors: {email?: string} = {};
    
    if (!formData.email.trim()) {
      newErrors.email = 'Please enter your email address';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);

    try {
      // Redirect to app with email and plan parameters
      const appUrl = `https://app.claimease.co.uk/auth?email=${encodeURIComponent(formData.email)}&plan=${selectedPlan}`;
      window.location.href = appUrl;
    } catch (error) {
      console.error('Error redirecting to app:', error);
      alert('There was an error processing your request. Please try again.');
      setIsSubmitting(false);
    }
  };

  const features = [
    {
      icon: FileText,
      title: 'Built for PIP, not generic forms',
      description: 'Every question is tailored specifically to the PIP application. No jargon, no confusion.',
      color: 'text-primary'
    },
    {
      icon: Sparkles,
      title: 'AI-Optimised Answers',
      description: 'Your words are automatically rewritten into clear, professional, DWP-friendly phrasing.',
      color: 'text-primary'
    },
    {
      icon: TrendingUp,
      title: 'Evidence Integration',
      description: 'Highlight the challenges that matter most to the DWP: safety, repetition, reliability, and time.',
      color: 'text-primary'
    },
    {
      icon: Lock,
      title: 'Secure & Private',
      description: 'Your data is encrypted and never shared. You stay in control from start to finish.',
      color: 'text-primary'
    }
  ];

  return (
    <div className="min-h-screen bg-background" ref={rootRef}>

      <div className="relative">{/* removed overflow-hidden to allow sticky to work  */}
        <div className="absolute inset-0 gradient-dark-brand pointer-events-none"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-28 md:pb-12 flex flex-col min-h-screen">{/* extra bottom padding so mobile CTA doesn't overlap */}
            <div className="flex justify-center mb-4 sm:mb-6" ref={heroLogoRef}>
              <AnimatedSection animation="fade-in">
                <ClaimEaseLogo />
              </AnimatedSection>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 lg:gap-16 flex-1 lg:items-center pb-12 pt-4 sm:pt-6">
              <div className="lg:col-span-7 flex flex-col justify-center space-y-8 lg:space-y-12" ref={heroContentRef}>
                <AnimatedSection animation="slide-up" className="space-y-6 lg:space-y-8">
                    <div className="space-y-4">
                      <div className="inline-flex items-center px-4 py-2 bg-primary/10 rounded-full text-primary text-sm font-medium">
                        <Sparkles className="h-4 w-4 mr-2" />
                        AI-Powered PIP Assistance
                      </div>
                      <h1 className={`${gilroyHeavy.className} text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1] text-foreground max-w-4xl`}>
                        Struggling with your{' '}
                        <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                          PIP application?
                        </span>
                        <br />
                        We make it easier.
                      </h1>
                    </div>
                    <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed max-w-3xl">
                      Answer simple questions in plain English. Our AI transforms them into clear, DWP-friendly answers that strengthen your claim.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 pt-6">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center">
                          <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <span className="text-sm font-medium text-foreground">Built specifically for PIP claims</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center">
                          <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                          </svg>
                        </div>
                        <span className="text-sm font-medium text-foreground">Professional, DWP-friendly language</span>
                      </div>
                    </div>
                </AnimatedSection>
              </div>

              <div className="lg:col-span-5 flex items-start justify-center pt-4 sm:pt-6 lg:pt-8" ref={formRef}>
                <div className="w-full max-w-sm lg:sticky lg:top-24" id="start-claim">
                  <AnimatedSection animation="scale-in" delay={200}>
                    <Card className="w-full glass-effect backdrop-blur-lg border-primary/20 shadow-xl">
                    <CardHeader className="text-center space-y-2 pb-3">
                      <div className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center mx-auto glow-primary">
                        <Sparkles className="h-4 w-4 text-primary-foreground" />
                      </div>
                      <div className="space-y-1">
                        <CardTitle className={`${gilroyHeavy.className} text-base text-foreground`}>Get Started</CardTitle>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-5 px-5">
                      {/* Compact Plan Toggle */}
                      <div className="space-y-3">
                         <Label className="text-sm text-foreground font-semibold">STEP 1: Choose Your Plan</Label>
                         <div className="grid grid-cols-2 gap-2 p-1 bg-muted/30 rounded-lg">
                           <button
                             type="button"
                             onClick={() => setSelectedPlan('standard')}
                             className={`px-3 py-2 text-sm font-medium rounded-md transition-all ${
                               selectedPlan === 'standard'
                                 ? 'bg-primary text-primary-foreground shadow-sm'
                                 : 'text-muted-foreground hover:text-foreground'
                             }`}
                           >
                             Standard £49
                           </button>
                           <button
                             type="button"
                             onClick={() => setSelectedPlan('pro')}
                             className={`px-3 py-2 text-sm font-medium rounded-md transition-all ${
                               selectedPlan === 'pro'
                                 ? 'bg-accent text-accent-foreground shadow-sm'
                                 : 'text-muted-foreground hover:text-foreground'
                             }`}
                           >
                             Pro £79
                           </button>
                         </div>
                         {/* Compact Plan Benefits */}
                         <div className="bg-muted/20 rounded-lg p-3 text-xs">
                           {selectedPlan === 'standard' ? (
                             <div className="space-y-1">
                               <div className="flex items-center gap-2"><CheckCircle className="h-3 w-3 text-success" /><span>One full PIP claim</span></div>
                               <div className="flex items-center gap-2"><CheckCircle className="h-3 w-3 text-success" /><span>Export answers (PDF/Word)</span></div>
                               <div className="flex items-center gap-2"><CheckCircle className="h-3 w-3 text-success" /><span>Free appeal support</span></div>
                             </div>
                           ) : (
                             <div className="space-y-1">
                               <div className="flex items-center gap-2"><CheckCircle className="h-3 w-3 text-success" /><span>Unlimited PIP claims</span></div>
                               <div className="flex items-center gap-2"><CheckCircle className="h-3 w-3 text-success" /><span>Upload medical documents</span></div>
                               <div className="flex items-center gap-2"><CheckCircle className="h-3 w-3 text-success" /><span>Free appeal support for every claim</span></div>
                             </div>
                           )}
                         </div>
                      </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-3">
                          <div className="space-y-2">
                            <Label htmlFor="email" className="text-sm text-foreground font-semibold">STEP 2: Your Email Address</Label>
                            <Input
                              id="email"
                              type="email"
                              value={formData.email}
                              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                              placeholder="your.email@example.com"
                              required
                              className="text-sm py-2.5 bg-input/60 backdrop-blur-sm border-border/40 focus:border-primary focus:ring-primary/20 text-foreground"
                            />
                            {errors.email && (
                              <p className="text-xs text-red-500">{errors.email}</p>
                            )}
                          </div>
                        </div>

                        <Button 
                          type="submit" 
                          className="w-full text-sm py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground glow-primary hover-lift transition-all duration-200 group"
                          disabled={isSubmitting}
                        >
                          <Sparkles className="h-4 w-4 mr-2" />
                          <span className="text-sm">
                            {isSubmitting 
                              ? 'Redirecting...' 
                              : 'Continue to App'
                            }
                          </span>
                          <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                        </Button>

                        <div className="text-center">
                          <p className="text-xs text-muted-foreground">
                            By continuing, you agree to our{' '}
                            <a href="/terms" className="underline hover:text-foreground">Terms</a>{' '}
                            and{' '}
                            <a href="/privacy" className="underline hover:text-foreground">Privacy Policy</a>
                          </p>
                        </div>
                      </form>

                      <div className="flex items-center justify-center gap-3 text-xs text-muted-foreground pt-2 border-t border-border/20">
                        <div className="flex items-center gap-1">
                          <Lock className="h-3 w-3" />
                          <span>Secure</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Database className="h-3 w-3" />
                          <span>Private</span>
                        </div>
                      </div>

                    </CardContent>
                    </Card>
                  </AnimatedSection>
                </div>
              </div>
            </div>

            {/* Key Benefits Section */}
            <div className="mt-16 sm:mt-20 lg:mt-24 max-w-6xl mx-auto" ref={benefitsRef}>
              <AnimatedSection animation="slide-up" className="text-center space-y-3 sm:space-y-4 mb-8 sm:mb-10 lg:mb-12 px-4 sm:px-0">
                <h2 className={`${gilroyHeavy.className} text-2xl sm:text-3xl lg:text-4xl font-medium text-foreground`}>
                  Why Choose ClaimEase?
                </h2>
                <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
                  Built specifically for PIP applications with features that make the difference
                </p>
              </AnimatedSection>

              <AnimatedSection animation="stagger" className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 px-4 sm:px-0">
                {features.map((feature, index) => {
                  const Icon = feature.icon;
                  return (
                    <div key={index} className="flex items-start gap-3 sm:gap-4 rounded-2xl border border-border/50 bg-card/40 p-4 sm:p-6 hover:bg-card/60 transition-colors">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-card/60 flex items-center justify-center flex-shrink-0">
                        <Icon className={`h-4 w-4 sm:h-5 sm:w-5 ${feature.color}`} />
                      </div>
                      <div className="space-y-1 sm:space-y-2">
                        <h3 className="text-base sm:text-lg font-semibold text-foreground">{feature.title}</h3>
                        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">{feature.description}</p>
                      </div>
                    </div>
                  );
                })}
              </AnimatedSection>
            </div>

            {/* How It Works Section - Minimal Vertical Steps */}
            <div className="mt-20 sm:mt-24 lg:mt-32 max-w-4xl mx-auto px-4 sm:px-0" ref={howItWorksRef}>
              <AnimatedSection animation="slide-up" className="text-center space-y-3 sm:space-y-4 mb-12 sm:mb-14 lg:mb-16">
                <h2 className={`${gilroyHeavy.className} text-3xl lg:text-4xl font-medium text-foreground`}>
                  How it works
                </h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  Three simple steps to strengthen your PIP claim
                </p>
              </AnimatedSection>

              <div className="space-y-12">
                {/* Step 1 */}
                <AnimatedSection animation="slide-up" className="flex flex-col md:flex-row items-start gap-8">
                  <div className="flex-shrink-0 w-16 md:w-20">
                    <div className="text-6xl md:text-7xl font-light text-primary/20 leading-none">
                      01
                    </div>
                  </div>
                  <div className="flex-1 space-y-3">
                    <h3 className="text-xl md:text-2xl font-semibold text-foreground">
                      Answer simple questions
                    </h3>
                    <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
                      We'll guide you through plain English questions about your condition and daily challenges. No confusing jargon or complex forms to navigate.
                    </p>
                  </div>
                </AnimatedSection>

                {/* Step 2 */}
                <AnimatedSection animation="slide-up" delay={100} className="flex flex-col md:flex-row items-start gap-8">
                  <div className="flex-shrink-0 w-16 md:w-20">
                    <div className="text-6xl md:text-7xl font-light text-primary/20 leading-none">
                      02
                    </div>
                  </div>
                  <div className="flex-1 space-y-3">
                    <h3 className="text-xl md:text-2xl font-semibold text-foreground">
                      Get AI-optimised answers
                    </h3>
                    <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
                      Our AI transforms your responses into clear, DWP-friendly language that highlights your needs and maximizes your chances of approval.
                    </p>
                  </div>
                </AnimatedSection>

                {/* Step 3 */}
                <AnimatedSection animation="slide-up" delay={200} className="flex flex-col md:flex-row items-start gap-8">
                  <div className="flex-shrink-0 w-16 md:w-20">
                    <div className="text-6xl md:text-7xl font-light text-primary/20 leading-none">
                      03
                    </div>
                  </div>
                  <div className="flex-1 space-y-3">
                    <h3 className="text-xl md:text-2xl font-semibold text-foreground">
                      Export & submit with confidence
                    </h3>
                    <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
                      Download your completed answers as a PDF or Word document. Each response is clearly matched to the correct section of the PIP form, so you can copy them across quickly and accurately.
                    </p>
                  </div>
                </AnimatedSection>
              </div>
            </div>

            {/* Pricing Section */}
            <div className="mt-28 text-center space-y-8" ref={pricingRef}>
              <AnimatedSection animation="fade-in" className="space-y-4">
                <h2 className="text-2xl lg:text-3xl font-medium text-foreground">
                  Choose Your Plan
                </h2>
              </AnimatedSection>
              
              <AnimatedSection animation="stagger" className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                {/* ClaimEase Standard */}
                <Card className="glass-effect backdrop-blur-lg border-primary/30 relative flex flex-col hover:border-primary/50 transition-all duration-300 active:scale-[0.98] sm:active:scale-100">
                  <CardContent className="p-4 sm:p-6 flex flex-col flex-1">
                    <div className="text-center space-y-3">
                      <h3 className="text-lg sm:text-xl font-semibold text-foreground">ClaimEase Standard</h3>
                      <div className="text-2xl sm:text-3xl font-bold text-primary">£49</div>
                      <div className="text-sm text-muted-foreground">one-time</div>
                      <div className="text-sm text-muted-foreground/80">Perfect for your first PIP claim</div>
                    </div>
                    
                    <ul className="space-y-3 text-left flex-1 mt-6">
                      <li className="flex items-center gap-3">
                        <CheckCircle className="h-4 w-4 text-success flex-shrink-0" />
                        <span className="text-sm">One full PIP claim</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <CheckCircle className="h-4 w-4 text-success flex-shrink-0" />
                        <span className="text-sm">Export your answers (PDF/Word)</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <CheckCircle className="h-4 w-4 text-success flex-shrink-0" />
                        <span className="text-sm">Free appeal support if needed</span>
                      </li>
                    </ul>
                    
                    <Button onClick={scrollToForm} className="w-full bg-primary hover:bg-primary/90 active:bg-primary/80 text-primary-foreground mt-6 min-h-[44px] py-3 transition-all duration-200">
                      Start My Claim (£49) →
                    </Button>
                  </CardContent>
                </Card>

                {/* ClaimEase Pro */}
                <Card className="glass-effect backdrop-blur-lg border-accent/30 relative flex flex-col stagger-item hover:border-accent/50 transition-all duration-300 active:scale-[0.98] sm:active:scale-100">
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <div className="bg-accent text-accent-foreground px-3 py-1 rounded-full text-xs font-medium">
                      Most Popular
                    </div>
                  </div>
                  <CardContent className="p-4 sm:p-6 flex flex-col flex-1">
                    <div className="text-center space-y-3">
                      <h3 className="text-lg sm:text-xl font-semibold text-foreground">ClaimEase Pro</h3>
                      <div className="text-2xl sm:text-3xl font-bold text-accent">£79</div>
                      <div className="text-sm text-muted-foreground">one-time</div>
                      <div className="text-sm text-muted-foreground/80">For ongoing or complex cases</div>
                    </div>
                    
                    <ul className="space-y-3 text-left flex-1 mt-6">
                      <li className="flex items-center gap-3">
                        <CheckCircle className="h-4 w-4 text-success flex-shrink-0" />
                        <span className="text-sm">Unlimited PIP claims</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <CheckCircle className="h-4 w-4 text-success flex-shrink-0" />
                        <span className="text-sm">Upload medical documents (letters, prescriptions, evidence)</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <CheckCircle className="h-4 w-4 text-success flex-shrink-0" />
                        <span className="text-sm">Free appeal support for every claim</span>
                      </li>
                    </ul>
                    
                    <Button onClick={scrollToForm} className="w-full bg-accent hover:bg-accent/90 active:bg-accent/80 text-accent-foreground mt-6 min-h-[44px] py-3 transition-all duration-200">
                      Get Pro for £79 →
                    </Button>
                  </CardContent>
                </Card>
              </AnimatedSection>
            </div>

            {/* Appeal Promise Section moved below pricing */}
            <div className="mt-28 text-center space-y-6" ref={appealRef}>
              <AnimatedSection animation="slide-up" className="space-y-4">
                <h2 className="text-2xl lg:text-3xl font-medium text-accent">
                  And if your claim is rejected… we're still with you.
                </h2>
                <div className="max-w-3xl mx-auto space-y-4">
                  <p className="text-lg text-muted-foreground">
                    Over half of PIP decisions are overturned on appeal.
                  </p>
                  <p className="text-lg text-muted-foreground">
                    If that happens to you, ClaimEase will guide you step-by-step through the appeal process — free of charge.
                  </p>
                  <p className="text-lg font-medium text-foreground">
                    Because your benefits are too important to risk.
                  </p>
                </div>
              </AnimatedSection>
            </div>

            {/* FAQ Section */}
            <div className="mt-28 max-w-4xl mx-auto space-y-8" ref={faqRef}>
              <AnimatedSection animation="fade-in" className="text-center space-y-4">
                <h2 className="text-3xl md:text-4xl font-semibold text-foreground">
                  Frequently Asked Questions
                </h2>
                <p className="text-lg text-muted-foreground">
                  Get answers to common questions about ClaimEase
                </p>
              </AnimatedSection>
              
              <AnimatedSection animation="stagger" className="grid gap-6">
                <Card className="glass-effect backdrop-blur-sm">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                        <HelpCircle className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-lg mb-3 text-foreground">What if my claim is rejected?</h3>
                        <p className="text-muted-foreground">
                          Don't panic. Over half of PIP claims are overturned on appeal. If it happens, ClaimEase will guide you step-by-step through the appeal process — free of charge.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="glass-effect backdrop-blur-sm stagger-item">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                        <HelpCircle className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-lg mb-3 text-foreground">Is this legal?</h3>
                        <p className="text-muted-foreground">
                          Yes. ClaimEase doesn't give legal advice. We simply help you put your own experiences into clear, detailed answers that the DWP can easily understand.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="glass-effect backdrop-blur-sm stagger-item">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                        <HelpCircle className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-lg mb-3 text-foreground">Will you store my data?</h3>
                        <p className="text-muted-foreground">
                          No. Your answers are processed securely and never shared. You're always in control of your information.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="glass-effect backdrop-blur-sm stagger-item">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                        <HelpCircle className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-lg mb-3 text-foreground">Can ClaimEase guarantee my claim will be accepted?</h3>
                        <p className="text-muted-foreground">
                          No tool can promise that. What ClaimEase does is make sure your answers are clear, detailed, and focused on what the DWP looks for — giving you the strongest chance possible.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="glass-effect backdrop-blur-sm stagger-item">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                        <HelpCircle className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-lg mb-3 text-foreground">Can I add more claims later?</h3>
                        <p className="text-muted-foreground">
                          Your £49 plan covers one full PIP claim. For unlimited claims and additional features like document uploads, consider upgrading to ClaimEase Pro for £79. This gives you everything you need for ongoing or complex cases.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </AnimatedSection>
            </div>

            {/* Final CTA Section */}
            <div className="mt-28 text-center space-y-6">
              <AnimatedSection animation="slide-up" className="space-y-4">
                <h2 className="text-2xl lg:text-3xl font-medium text-foreground">
                  Don't risk losing the benefits you deserve.
                </h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  Start today — give your claim the best chance of success.
                </p>
              </AnimatedSection>
              
              <AnimatedSection animation="scale-in" delay={200}>
                <Button size="lg" onClick={scrollToForm} className="bg-primary hover:bg-primary/90 active:bg-primary/80 text-primary-foreground px-8 py-3 min-h-[44px] transition-all duration-200">
                  Start My Claim (£49) →
                </Button>
              </AnimatedSection>
            </div>

            {/* Mobile Sticky CTA */}
            <div className="md:hidden fixed bottom-4 left-0 right-0 flex justify-center z-50 px-4">
              <Button onClick={scrollToForm} className="px-6 py-3 bg-primary text-primary-foreground shadow-lg rounded-full min-h-[44px] hover:bg-primary/90 active:bg-primary/80 transition-all duration-200">
                Start My Claim (£49) →
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}