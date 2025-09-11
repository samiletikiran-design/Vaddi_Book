import React, { useState, useEffect } from 'react';
import { Lendie, Loan, Repayment, User, CURRENCIES, UpcomingPayment } from './types';
import { LendieList } from './components/LendieList';
import { LendieDashboard } from './components/LendieDashboard';
import { LoanDetailsPage } from './components/LoanDetailsPage';
import { ClosedLoansPage } from './components/ClosedLoansPage';
import { Modal } from './components/ui/Modal';
import { ProfileDropdown } from './components/ui/ProfileDropdown';
import { AddLendieAndLoanForm } from './components/AddLoanForm';
import { AddNewLoanForm } from './components/AddNewLoanForm';
import { AddRepaymentForm } from './components/AddRepaymentForm';
import { EditLoanForm } from './components/EditLoanForm';
import { EditRepaymentForm } from './components/EditRepaymentForm';
import { EditLendieForm } from './components/EditLendieForm';
import { EditAccountForm } from './components/EditAccountForm';
import { GlobalSummaryDashboard } from './components/GlobalSummaryDashboard';
import { OTPLogin } from './components/OTPLogin';
import { InterestCalculator } from './components/InterestCalculator';
import { UpcomingPayments } from './components/UpcomingPayments';
import {
    calculateGrandTotalPrincipal,
    calculateGrandTotalInterest,
    calculateGrandTotalRepayments,
    getAllUpcomingPayments,
    calculateInterestForLoan,
    calculateRepaymentsForLoan,
} from './services/calculationService';
import { supabase } from './lib/supabase';

// Import services based on Supabase availability
const useSupabase = !!supabase;

const importServices = async () => {
  if (useSupabase) {
    return await import('./services/supabaseService');
  } else {
    return await import('./services/localStorageService');
  }
};

type ViewState = 
  | { name: 'LIST' }
  | { name: 'DASHBOARD'; lendieId: string }
  | { name: 'LOAN_DETAILS'; lendieId: string; loanId: string }
  | { name: 'CLOSED_LOANS'; lendieId: string };

type ModalState = 'NONE' | 'ADD_LENDIE_LOAN' | 'ADD_LOAN' | 'ADD_REPAYMENT' | 'EDIT_LOAN' | 'EDIT_LENDIE' | 'EDIT_ACCOUNT' | 'INTEREST_CALCULATOR' | 'EDIT_REPAYMENT';

const getLendiesWithUpdatedLoanStatuses = (lendiesToUpdate: Lendie[]): Lendie[] => {
    const today = new Date().toISOString().split('T')[0];
    return lendiesToUpdate.map(lendie => ({
        ...lendie,
        loans: lendie.loans.map(loan => {
            const repaymentsForLoan = lendie.repayments.filter(r => r.loanId === loan.id);
            const interestAccrued = calculateInterestForLoan(loan, repaymentsForLoan, today);
            const amountPaid = calculateRepaymentsForLoan(repaymentsForLoan);
            const outstandingBalance = (loan.principal + interestAccrued) - amountPaid;

            // Close the loan if the outstanding balance is less than 1 currency unit.
            const newStatus = outstandingBalance < 1 ? 'CLOSED' : 'ACTIVE';
            
            return { ...loan, status: newStatus };
        }),
    }));
};


function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [lendies, setLendies] = useState<Lendie[]>([]);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<ViewState>({ name: 'LIST' });
  const [modal, setModal] = useState<ModalState>('NONE');
  const [editingLoan, setEditingLoan] = useState<Loan | null>(null);
  const [editingRepayment, setEditingRepayment] = useState<Repayment | null>(null);
  const [upcomingPayments, setUpcomingPayments] = useState<UpcomingPayment[]>([]);
  const [repaymentTargetLoanId, setRepaymentTargetLoanId] = useState<string | undefined>();
  const [services, setServices] = useState<any>(null);

  // Effect to check session and load user profile on initial mount
  useEffect(() => {
    const initServices = async () => {
      const serviceModule = await importServices();
      setServices(serviceModule);
    };
    initServices();

    const userMobile = sessionStorage.getItem('lenders-ledger-user-mobile');
    if (userMobile) {
        loadUserProfile(userMobile);
    }
  }, []);

  const loadUserProfile = async (mobile: string) => {
    if (!services) return;
    
    try {
      setLoading(true);
      const user = await services.getUser(mobile);
      if (user) {
        setCurrentUser(user);
        // Set user context for RLS (only if using Supabase)
        if (useSupabase && supabase) {
          await supabase.rpc('set_current_user_id', { user_id: mobile });
        }
      } else {
        handleLogout();
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
      handleLogout();
    } finally {
      setLoading(false);
    }
  };

  // Effect to load lendie data from Supabase when user is set
  useEffect(() => {
    if (currentUser && services) {
      loadLendiesData();
    } else {
      setLendies([]);
    }
  }, [currentUser, services]);

  const loadLendiesData = async () => {
    if (!currentUser || !services) return;
    
    try {
      setLoading(true);
      const lendiesData = await services.getLendies(currentUser.mobile);
      setLendies(lendiesData);
    } catch (error) {
      console.error('Error loading lendies data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Effect to recalculate upcoming payments when lendies change
  useEffect(() => {
    if (currentUser && lendies.length >= 0) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const payments = getAllUpcomingPayments(lendies, today);
      setUpcomingPayments(payments);
    }
  }, [lendies]);


  const handleLogin = async (mobile: string) => {
    if (!services) {
      alert('Services not initialized. Please refresh the page.');
      return;
    }
    
    try {
      setLoading(true);
      
      // Set user context for RLS (only if using Supabase)
      if (useSupabase && supabase) {
        const { error: contextError } = await supabase.rpc('set_current_user_id', { user_id: mobile });
        if (contextError) {
          console.error('Error setting user context:', contextError);
        }
      }
      
      let user = await services.getUser(mobile);
      if (!user) {
        // Create new user
        user = { mobile, name: 'Lender', currency: 'INR' };
        await services.createOrUpdateUser(user);
      }

      sessionStorage.setItem('lenders-ledger-user-mobile', mobile);
      setCurrentUser(user);
    } catch (error) {
      console.error('Error during login:', error);
      alert(`Login failed: ${error instanceof Error ? error.message : 'Please try again.'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('lenders-ledger-user-mobile');
    setCurrentUser(null);
    setView({ name: 'LIST' });
    setModal('NONE');
  };

  const handleSelectLendie = (lendieId: string) => {
    setView({ name: 'DASHBOARD', lendieId });
  };

  const handleBackToList = () => {
    setView({ name: 'LIST' });
  };
  
  const handleAddLendieAndLoan = async (lendieData: Omit<Lendie, 'id' | 'loans' | 'repayments'>, loanData: Omit<Loan, 'id'>) => {
    if (!currentUser || !services) return;
    
    try {
      setLoading(true);
      const lendieId = await services.createLendie(currentUser.mobile, lendieData);
      await services.createLoan(currentUser.mobile, lendieId, loanData);
      
      await loadLendiesData();
      setModal('NONE');
      setView({ name: 'DASHBOARD', lendieId });
    } catch (error) {
      console.error('Error adding lendie and loan:', error);
      alert('Failed to add lendie and loan. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddRepayment = async (lendieId: string, repaymentData: Omit<Repayment, 'id'>) => {
    if (!currentUser || !services) return;
    
    try {
      setLoading(true);
      await services.createRepayment(currentUser.mobile, repaymentData);
      await loadLendiesData();
      setModal('NONE');
      setRepaymentTargetLoanId(undefined);
    } catch (error) {
      console.error('Error adding repayment:', error);
      alert('Failed to add repayment. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleAddNewLoan = async (loanData: Omit<Loan, 'id'>) => {
    if (!currentUser || !services) return;
    if (view.name !== 'DASHBOARD') return;
    
    try {
      setLoading(true);
      await services.createLoan(currentUser.mobile, view.lendieId, loanData);
      await loadLendiesData();
      setModal('NONE');
    } catch (error) {
      console.error('Error adding loan:', error);
      alert('Failed to add loan. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEditLoanModal = (loan: Loan) => {
    setEditingLoan(loan);
    setModal('EDIT_LOAN');
  };

  const handleDeleteLoan = async (loanId: string) => {
     if (view.name !== 'DASHBOARD' && view.name !== 'LOAN_DETAILS') {
      return;
    }
    if (!services) return;
    
    if (window.confirm('Are you sure you want to archive this loan? It will be hidden from view and excluded from calculations.')) {
      try {
        setLoading(true);
        await services.updateLoan(currentUser?.mobile, loanId, { isArchived: true });
        await loadLendiesData();
      } catch (error) {
        console.error('Error archiving loan:', error);
        alert('Failed to archive loan. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleUpdateLoan = async (updatedLoan: Loan) => {
    if (view.name !== 'DASHBOARD' && view.name !== 'LOAN_DETAILS') return;
    if (!services) return;
    
    try {
      setLoading(true);
      await services.updateLoan(currentUser?.mobile, updatedLoan.id, updatedLoan);
      await loadLendiesData();
      setModal('NONE');
      setEditingLoan(null);
    } catch (error) {
      console.error('Error updating loan:', error);
      alert('Failed to update loan. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleOpenEditLendieModal = () => {
    if (view.name === 'DASHBOARD') {
      setModal('EDIT_LENDIE');
    }
  };

  const handleUpdateLendie = async (updatedData: Pick<Lendie, 'name' | 'mobile' | 'address' | 'photo'>) => {
    if (view.name !== 'DASHBOARD') return;
    if (!services) return;
    
    try {
      setLoading(true);
      await services.updateLendie(currentUser?.mobile, view.lendieId, updatedData);
      await loadLendiesData();
      setModal('NONE');
    } catch (error) {
      console.error('Error updating lendie:', error);
      alert('Failed to update lendie. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateAccount = async (updatedData: Pick<User, 'name' | 'currency'>) => {
    if (!currentUser || !services) return;

    try {
      setLoading(true);
      const updatedUser = { ...currentUser, ...updatedData };
      await services.createOrUpdateUser(updatedUser);
      setCurrentUser(updatedUser);
      setModal('NONE');
    } catch (error) {
      console.error('Error updating account:', error);
      alert('Failed to update account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenRepaymentModal = (loanId?: string) => {
    setRepaymentTargetLoanId(loanId);
    setModal('ADD_REPAYMENT');
  };

  const handleCloseRepaymentModal = () => {
    setModal('NONE');
    setRepaymentTargetLoanId(undefined);
  };

  // New navigation handlers
  const handleSelectLoan = (loanId: string) => {
    if (view.name === 'DASHBOARD' || view.name === 'CLOSED_LOANS') {
      setView({ name: 'LOAN_DETAILS', lendieId: view.lendieId, loanId });
    }
  };

  const handleBackToDashboard = () => {
    if (view.name === 'LOAN_DETAILS' || view.name === 'CLOSED_LOANS') {
      setView({ name: 'DASHBOARD', lendieId: view.lendieId });
    }
  };

  const handleViewClosedLoans = () => {
    if (view.name === 'DASHBOARD') {
      setView({ name: 'CLOSED_LOANS', lendieId: view.lendieId });
    }
  };

  // New Repayment CRUD handlers
  const handleOpenEditRepaymentModal = (repayment: Repayment) => {
    setEditingRepayment(repayment);
    setModal('EDIT_REPAYMENT');
  };

  const handleUpdateRepayment = async (updatedRepayment: Repayment) => {
    if (view.name !== 'LOAN_DETAILS') return;
    if (!services) return;
    
    try {
      setLoading(true);
      await services.updateRepayment(currentUser?.mobile, updatedRepayment.id, updatedRepayment);
      await loadLendiesData();
      setModal('NONE');
      setEditingRepayment(null);
    } catch (error) {
      console.error('Error updating repayment:', error);
      alert('Failed to update repayment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRepayment = async (repaymentId: string) => {
    if (view.name !== 'LOAN_DETAILS') return;
    if (!services) return;
    
    try {
      setLoading(true);
      await services.deleteRepayment(currentUser?.mobile, repaymentId);
      await loadLendiesData();
    } catch (error) {
      console.error('Error deleting repayment:', error);
      alert('Failed to delete repayment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser) {
    // Use simple login if Supabase is not available
    if (!useSupabase) {
      return <Login onLogin={handleLogin} />;
    }
    return <OTPLogin onLogin={handleLogin} />;
  }

  const renderContent = () => {
    if (view.name === 'LOAN_DETAILS') {
      const currentLendie = lendies.find(l => l.id === view.lendieId);
      const currentLoan = currentLendie?.loans.find(l => l.id === view.loanId);
      if (currentLendie && currentLoan) {
        return <LoanDetailsPage
            lendie={currentLendie}
            loan={currentLoan}
            currency={CURRENCIES[currentUser.currency]}
            onBack={handleBackToDashboard}
            onOpenEditLoanModal={handleOpenEditLoanModal}
            onDeleteLoan={handleDeleteLoan}
            onOpenEditRepaymentModal={handleOpenEditRepaymentModal}
            onDeleteRepayment={handleDeleteRepayment}
            onOpenRepaymentModal={handleOpenRepaymentModal}
        />
      }
    }
    else if (view.name === 'CLOSED_LOANS') {
        const currentLendie = lendies.find(l => l.id === view.lendieId);
        if (currentLendie) {
            return <ClosedLoansPage
                lendie={currentLendie}
                currency={CURRENCIES[currentUser.currency]}
                onBack={handleBackToDashboard}
                onSelectLoan={handleSelectLoan}
            />
        }
    }
    else if (view.name === 'DASHBOARD') {
      const currentLendie = lendies.find(l => l.id === view.lendieId);
      if (currentLendie) {
        return <LendieDashboard 
            lendie={currentLendie} 
            currency={CURRENCIES[currentUser.currency]}
            onBack={handleBackToList}
            onOpenAddLoanModal={() => setModal('ADD_LOAN')}
            onOpenRepaymentModal={handleOpenRepaymentModal}
            onSelectLoan={handleSelectLoan}
            onOpenEditLendieModal={handleOpenEditLendieModal}
            onViewClosedLoans={handleViewClosedLoans}
        />;
      }
    }
    
    const today = new Date().toISOString().split('T')[0];
    const totalLent = calculateGrandTotalPrincipal(lendies);
    const totalInterest = calculateGrandTotalInterest(lendies, today);
    const totalRepaid = calculateGrandTotalRepayments(lendies);

    return (
        <>
            <UpcomingPayments 
                payments={upcomingPayments} 
                currency={CURRENCIES[currentUser.currency]}
                onSelectLendie={handleSelectLendie}
            />
            <GlobalSummaryDashboard
                totalLent={totalLent}
                totalInterest={totalInterest}
                totalRepaid={totalRepaid}
                currency={CURRENCIES[currentUser.currency]}
            />
            <LendieList lendies={lendies} onSelectLendie={handleSelectLendie} currency={CURRENCIES[currentUser.currency]} />
        </>
    );
  };

  const currentLendieForModal = (view.name === 'DASHBOARD' || view.name === 'LOAN_DETAILS' || view.name === 'CLOSED_LOANS') ? lendies.find(l => l.id === view.lendieId) : undefined;
  const currentLoanForModal = (view.name === 'LOAN_DETAILS' && currentLendieForModal) ? currentLendieForModal.loans.find(l => l.id === view.loanId) : undefined;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 font-sans">
        <header className="bg-white shadow-sm">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
                <h1 className="text-2xl font-bold text-brand-primary">Lender's Ledger</h1>
                 <div className="flex items-center space-x-4">
                     {view.name === 'LIST' && (
                        <button onClick={() => setModal('ADD_LENDIE_LOAN')} className="px-4 py-2 bg-brand-primary rounded-md text-white hover:bg-sky-600 flex items-center space-x-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>
                           <span className="hidden sm:inline">{loading ? 'Loading...' : 'Add New Lendie'}</span>
                        </button>
                    )}
                    <button onClick={() => setModal('INTEREST_CALCULATOR')} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors" aria-label="Interest Calculator">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-600" viewBox="0 0 20 20" fill="currentColor">
                           <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V4a2 2 0 00-2-2H6zm1 2a1 1 0 00-1 1v2a1 1 0 001 1h6a1 1 0 001-1V5a1 1 0 00-1-1H7zM6 12a1 1 0 011-1h2a1 1 0 110 2H7a1 1 0 01-1-1zm5 1a1 1 0 100-2 1 1 0 000 2zM6 15a1 1 0 011-1h5a1 1 0 110 2H7a1 1 0 01-1-1z" clipRule="evenodd" />
                        </svg>
                    </button>
                    <ProfileDropdown 
                        userName={currentUser.name}
                        onEditAccount={() => setModal('EDIT_ACCOUNT')}
                        onLogout={handleLogout}
                    />
                </div>
            </div>
        </header>

        <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {renderContent()}
        </main>
        
        <Modal isOpen={modal === 'ADD_LENDIE_LOAN'} onClose={() => setModal('NONE')} title="Add New Lendie & Loan">
          <AddLendieAndLoanForm onAddLoan={handleAddLendieAndLoan} onClose={() => setModal('NONE')} />
        </Modal>
        
        {currentLendieForModal && (
            <>
                <Modal isOpen={modal === 'ADD_LOAN'} onClose={() => setModal('NONE')} title={`Add Loan for ${currentLendieForModal.name}`}>
                    <AddNewLoanForm onAddLoan={handleAddNewLoan} onClose={() => setModal('NONE')} />
                </Modal>
                <Modal isOpen={modal === 'ADD_REPAYMENT'} onClose={handleCloseRepaymentModal} title={`Record Repayment for ${currentLendieForModal.name}`}>
                    <AddRepaymentForm 
                        lendie={currentLendieForModal} 
                        onAddRepayment={handleAddRepayment} 
                        onClose={handleCloseRepaymentModal}
                        defaultLoanId={repaymentTargetLoanId}
                    />
                </Modal>
                 <Modal isOpen={modal === 'EDIT_LENDIE'} onClose={() => setModal('NONE')} title={`Edit Details for ${currentLendieForModal.name}`}>
                    <EditLendieForm lendieToEdit={currentLendieForModal} onUpdateLendie={handleUpdateLendie} onClose={() => setModal('NONE')} />
                </Modal>
            </>
        )}
        
        {editingLoan && (
             <Modal isOpen={modal === 'EDIT_LOAN'} onClose={() => { setModal('NONE'); setEditingLoan(null); }} title={`Edit Loan`}>
                <EditLoanForm loanToEdit={editingLoan} onUpdateLoan={handleUpdateLoan} onClose={() => { setModal('NONE'); setEditingLoan(null); }} />
            </Modal>
        )}

        {editingRepayment && currentLoanForModal && (
            <Modal isOpen={modal === 'EDIT_REPAYMENT'} onClose={() => { setModal('NONE'); setEditingRepayment(null); }} title="Edit Repayment">
                <EditRepaymentForm 
                    repaymentToEdit={editingRepayment} 
                    loan={currentLoanForModal}
                    onUpdateRepayment={handleUpdateRepayment}
                    onClose={() => { setModal('NONE'); setEditingRepayment(null); }}
                />
            </Modal>
        )}

        <Modal isOpen={modal === 'EDIT_ACCOUNT'} onClose={() => setModal('NONE')} title="My Account">
            <EditAccountForm user={currentUser} onUpdateAccount={handleUpdateAccount} onClose={() => setModal('NONE')} />
        </Modal>

        <Modal isOpen={modal === 'INTEREST_CALCULATOR'} onClose={() => setModal('NONE')} title="Interest Calculator">
            <InterestCalculator onClose={() => setModal('NONE')} currencySymbol={CURRENCIES[currentUser.currency]} />
        </Modal>

    </div>
  );
}

export default App;