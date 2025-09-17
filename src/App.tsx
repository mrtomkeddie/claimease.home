import { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useUser } from '@/contexts/UserContext';
import { TopMenu } from '@/components/TopMenu';
import { FooterSlim } from '@/components/FooterSlim';
import { ClaimForm } from '@/components/claim-form';
import SavedClaims from '@/components/SavedClaims';
import { Button } from '@/components/ui/button';
import { List, Plus } from 'lucide-react';
import { UpsellModal } from '@/components/UpsellModal';
import { Onboarding } from '@/components/onboarding';
import AccountLayout from '@/pages/AccountLayout';
import AccountPage from '@/pages/AccountPage';
import ContactPage from '@/pages/ContactPage';
import PrintPage from '@/pages/PrintPage';
import PrivacyPage from '@/pages/PrivacyPage';
import TermsPage from '@/pages/TermsPage';
import type { User } from '@/contexts/UserContext';

type ViewMode = 'saved-claims' | 'claim-form';

function HomePage() {
  const { user, setUser, canCreateClaim, incrementClaimCount } = useUser();
  const [viewMode, setViewMode] = useState<ViewMode>('saved-claims');
  const [showUpsellModal, setShowUpsellModal] = useState(false);

  const handleCreateClaim = () => {
    if (!canCreateClaim()) {
      setShowUpsellModal(true);
      return;
    }
    setViewMode('claim-form');
  };

  const handleClaimSaved = () => {
    incrementClaimCount();
    setViewMode('saved-claims');
  };

  // Show onboarding if no user
  if (!user) {
    return <Onboarding onComplete={(newUser: User) => setUser(newUser)} />;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <TopMenu />
      <main className="container mx-auto px-4 pt-20 md:pt-24 pb-12 flex-1">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Your Claims
              </h1>
              <p className="text-gray-600">
                Manage your warranty claims and create new ones
              </p>
            </div>
            
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'saved-claims' ? 'default' : 'outline'}
                onClick={() => setViewMode('saved-claims')}
                className="flex items-center gap-2"
              >
                <List className="h-4 w-4" />
                Saved Claims
              </Button>
              <Button
                variant={viewMode === 'claim-form' ? 'default' : 'outline'}
                onClick={handleCreateClaim}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                New Claim
              </Button>
            </div>
          </div>

          {viewMode === 'saved-claims' ? (
            <SavedClaims />
          ) : (
            <ClaimForm onClaimSaved={handleClaimSaved} />
          )}
        </div>
      </main>
      <FooterSlim />
      
      <UpsellModal 
        isOpen={showUpsellModal}
        onClose={() => setShowUpsellModal(false)}
        onPurchase={() => {
          setShowUpsellModal(false);
          setViewMode('claim-form');
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/account" element={<AccountLayout><AccountPage /></AccountLayout>} />
      <Route path="/contact" element={<ContactPage />} />
      <Route path="/print" element={<PrintPage />} />
      <Route path="/privacy" element={<PrivacyPage />} />
      <Route path="/terms" element={<TermsPage />} />
    </Routes>
  );
}