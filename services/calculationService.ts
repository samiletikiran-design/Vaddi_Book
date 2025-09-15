
import { Lendie, Loan, RatePeriod, InterestType, EmiFrequency, UpcomingPayment, Repayment, RepaymentType } from '../types';

const getDaysBetween = (date1Str: string, date2Str: string): number => {
    const d1 = new Date(date1Str);
    const d2 = new Date(date2Str);
    // Add 1 to include the end date in calculation period
    const diffTime = Math.abs(d2.getTime() - d1.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export const calculateInterestForLoan = (loan: Loan, allRepaymentsForLoan: Repayment[], untilDateStr: string): number => {
    const { principal, interestRate, ratePeriod, interestType, loanDate } = loan;
    const untilDate = new Date(untilDateStr);
    
    if (untilDate < new Date(loanDate)) {
        return 0;
    }

    const principalRepayments = allRepaymentsForLoan
        .filter(r => r.type === RepaymentType.Principal || r.type === RepaymentType.PrincipalInterest)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    let totalInterest = 0;
    let currentPrincipal = principal;
    let periodStartDateStr = loanDate;
    
    for (const repayment of principalRepayments) {
        const repaymentDate = new Date(repayment.date);
        if (repaymentDate > untilDate) {
            break; 
        }
        
        if (repaymentDate < new Date(periodStartDateStr)) {
            currentPrincipal -= repayment.amount;
            continue;
        }

        const daysInSegment = getDaysBetween(periodStartDateStr, repayment.date);
        
        if (interestType === InterestType.Simple) {
            let dailyRate: number;
            switch (ratePeriod) {
                case RatePeriod.Weekly: dailyRate = (interestRate / 7) / 100; break;
                case RatePeriod.Monthly: dailyRate = (interestRate * 12 / 365) / 100; break;
                default: dailyRate = (interestRate / 365) / 100; break;
            }
            if (daysInSegment > 0) {
              totalInterest += currentPrincipal * dailyRate * daysInSegment;
            }
        } else { // Compound
            let periodRate = interestRate / 100;
            let daysInPeriod: number;
            switch (ratePeriod) {
                case RatePeriod.Weekly: daysInPeriod = 7; break;
                case RatePeriod.Monthly: daysInPeriod = 30.44; break;
                default: daysInPeriod = 365; break;
            }
            const periodsInSegment = Math.floor(daysInSegment / daysInPeriod);
            if (periodsInSegment > 0) {
              const compoundInterest = currentPrincipal * Math.pow((1 + periodRate), periodsInSegment) - currentPrincipal;
              totalInterest += compoundInterest;
            }
        }

        currentPrincipal -= repayment.amount;
        periodStartDateStr = repayment.date;
    }

    if (new Date(periodStartDateStr) <= untilDate) {
      const daysInFinalSegment = getDaysBetween(periodStartDateStr, untilDateStr);
      if (currentPrincipal > 0 && daysInFinalSegment > 0) {
        if (interestType === InterestType.Simple) {
          let dailyRate: number;
          switch (ratePeriod) {
              case RatePeriod.Weekly: dailyRate = (interestRate / 7) / 100; break;
              case RatePeriod.Monthly: dailyRate = (interestRate * 12 / 365) / 100; break;
              default: dailyRate = (interestRate / 365) / 100; break;
          }
          totalInterest += currentPrincipal * dailyRate * daysInFinalSegment;
        } else { // Compound
          let periodRate = interestRate / 100;
          let daysInPeriod: number;
          switch (ratePeriod) {
              case RatePeriod.Weekly: daysInPeriod = 7; break;
              case RatePeriod.Monthly: daysInPeriod = 30.44; break;
              default: daysInPeriod = 365; break;
          }
          const periodsInFinalSegment = Math.floor(daysInFinalSegment / daysInPeriod);
          if (periodsInFinalSegment > 0) {
            const compoundInterest = currentPrincipal * Math.pow((1 + periodRate), periodsInFinalSegment) - currentPrincipal;
            totalInterest += compoundInterest;
          }
        }
      }
    }
    
    return totalInterest;
};

export const calculateEmiAmount = (loan: Loan): number => {
    const { principal, interestRate, ratePeriod, tenure, emiFrequency } = loan;

    if (!loan.isEmi || !tenure || tenure <= 0) {
        return 0;
    }

    // 1. Calculate the effective annual interest rate as a decimal
    let annualRateDecimal: number;
    switch (ratePeriod) {
        case RatePeriod.Weekly:
            annualRateDecimal = (interestRate / 100) * 52;
            break;
        case RatePeriod.Monthly:
            annualRateDecimal = (interestRate / 100) * 12;
            break;
        case RatePeriod.Yearly:
        default:
            annualRateDecimal = interestRate / 100;
            break;
    }

    // 2. Calculate the interest rate for the specific EMI period
    let ratePerPeriod: number;
    switch (emiFrequency) {
        case EmiFrequency.Weekly:
            ratePerPeriod = annualRateDecimal / 52;
            break;
        case EmiFrequency.Monthly:
            ratePerPeriod = annualRateDecimal / 12;
            break;
        case EmiFrequency.Yearly:
        default:
            ratePerPeriod = annualRateDecimal;
            break;
    }

    // If there is no interest, EMI is just principal divided by tenure
    if (ratePerPeriod === 0) {
        return principal / tenure;
    }

    // EMI formula: P * r * (1+r)^n / ((1+r)^n - 1)
    const r = ratePerPeriod;
    const n = tenure;
    const P = principal;

    const numerator = P * r * Math.pow(1 + r, n);
    const denominator = Math.pow(1 + r, n) - 1;

    if (denominator === 0) {
        return 0; // Avoid division by zero
    }

    return numerator / denominator;
};


// Calculates total principal for ACTIVE loans only.
export const calculateTotalPrincipal = (lendie: Lendie): number => {
    return lendie.loans
        .filter(loan => !loan.isArchived && loan.status === 'ACTIVE')
        .reduce((acc, loan) => acc + loan.principal, 0);
};

// Calculates total repayments made towards ACTIVE loans only.
export const calculateTotalRepayments = (lendie: Lendie): number => {
    const activeLoanIds = new Set(
        lendie.loans
            .filter(loan => loan.status === 'ACTIVE' && !loan.isArchived)
            .map(loan => loan.id)
    );
    return lendie.repayments
        .filter(repayment => activeLoanIds.has(repayment.loanId))
        .reduce((acc, repayment) => acc + repayment.amount, 0);
};

export const calculateRepaymentsForLoan = (repaymentsForLoan: Repayment[]): number => {
    return repaymentsForLoan.reduce((acc, repayment) => acc + repayment.amount, 0);
};

// Calculates total interest for ACTIVE loans only.
export const calculateTotalInterest = (lendie: Lendie, untilDateStr: string): number => {
    return lendie.loans
        .filter(loan => !loan.isArchived && loan.status === 'ACTIVE')
        .reduce((acc, loan) => {
            const loanRepayments = lendie.repayments.filter(r => r.loanId === loan.id);
            return acc + calculateInterestForLoan(loan, loanRepayments, untilDateStr);
        }, 0);
};

export const getNextDueDate = (lendie: Lendie): string | null => {
    const today = new Date();
    today.setHours(0,0,0,0);

    const futureDueDates = lendie.loans
        .filter(loan => !loan.isArchived)
        .map(loan => loan.dueDate)
        .filter((date): date is string => !!date && new Date(date) >= today)
        .sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

    return futureDueDates.length > 0 ? futureDueDates[0] : null;
};

// Functions for global calculations on ACTIVE loans
export const calculateGrandTotalPrincipal = (lendies: Lendie[]): number => {
    return lendies.reduce((acc, lendie) => acc + calculateTotalPrincipal(lendie), 0);
};

export const calculateGrandTotalInterest = (lendies: Lendie[], untilDateStr: string): number => {
    return lendies.reduce((acc, lendie) => acc + calculateTotalInterest(lendie, untilDateStr), 0);
};

export const calculateGrandTotalRepayments = (lendies: Lendie[]): number => {
    return lendies.reduce((acc, lendie) => acc + calculateTotalRepayments(lendie), 0);
};

// Functions for LIFETIME global calculations (all loans)
export const calculateGrandLifetimeTotalPrincipal = (lendies: Lendie[]): number => {
    return lendies.reduce((acc, lendie) => {
        const lendiePrincipal = lendie.loans
            .filter(loan => !loan.isArchived)
            .reduce((sum, loan) => sum + loan.principal, 0);
        return acc + lendiePrincipal;
    }, 0);
};

export const calculateGrandLifetimeTotalInterest = (lendies: Lendie[], untilDateStr: string): number => {
    return lendies.reduce((acc, lendie) => {
        const lendieInterest = lendie.loans
            .filter(loan => !loan.isArchived)
            .reduce((sum, loan) => {
                const loanRepayments = lendie.repayments.filter(r => r.loanId === loan.id);
                return sum + calculateInterestForLoan(loan, loanRepayments, untilDateStr);
            }, 0);
        return acc + lendieInterest;
    }, 0);
};

export const calculateGrandLifetimeTotalRepayments = (lendies: Lendie[]): number => {
    return lendies.reduce((acc, lendie) => {
        const lendieRepayments = lendie.repayments.reduce((sum, repayment) => sum + repayment.amount, 0);
        return acc + lendieRepayments;
    }, 0);
};


const addPeriods = (date: Date, frequency: EmiFrequency, count: number): Date => {
    const newDate = new Date(date);
    switch (frequency) {
        case EmiFrequency.Weekly:
            newDate.setDate(newDate.getDate() + 7 * count);
            break;
        case EmiFrequency.Monthly:
            newDate.setMonth(newDate.getMonth() + count);
            break;
        case EmiFrequency.Yearly:
            newDate.setFullYear(newDate.getFullYear() + count);
            break;
    }
    return newDate;
};


export const getAllUpcomingPayments = (lendies: Lendie[], today: Date): UpcomingPayment[] => {
    const upcoming: UpcomingPayment[] = [];
    const windowEnd = new Date(today);
    windowEnd.setDate(today.getDate() + 30); // Look 30 days into the future

    lendies.forEach(lendie => {
        const loanRepayments = lendie.repayments;
        lendie.loans.forEach(loan => {
            if (loan.isArchived || loan.status !== 'ACTIVE') return;

            if (loan.isEmi && loan.tenure && loan.emiFrequency) {
                const emiAmount = calculateEmiAmount(loan);
                const loanStartDate = new Date(loan.loanDate);

                for (let i = 1; i <= loan.tenure; i++) {
                    const dueDate = addPeriods(loanStartDate, loan.emiFrequency, i);
                    
                    if (dueDate >= today && dueDate <= windowEnd) {
                        const previousDueDate = addPeriods(loanStartDate, loan.emiFrequency, i - 1);
                        
                        const paymentsThisPeriod = loanRepayments.filter(r => 
                            r.loanId === loan.id &&
                            new Date(r.date) > previousDueDate && 
                            new Date(r.date) <= dueDate
                        );
                        
                        const totalPaidThisPeriod = paymentsThisPeriod.reduce((sum, p) => sum + p.amount, 0);
                        
                        // If this installment has been paid, skip it.
                        if (totalPaidThisPeriod >= emiAmount) {
                            continue;
                        }

                        upcoming.push({
                            date: dueDate.toISOString().split('T')[0],
                            lendieId: lendie.id,
                            lendieName: lendie.name,
                            loanId: loan.id,
                            amount: emiAmount,
                            type: 'EMI',
                        });
                    }
                }
            } else if (loan.dueDate) {
                const dueDate = new Date(loan.dueDate);
                if (dueDate >= today && dueDate <= windowEnd) {
                     upcoming.push({
                        date: loan.dueDate,
                        lendieId: lendie.id,
                        lendieName: lendie.name,
                        loanId: loan.id,
                        amount: loan.principal, // Simplified to show principal for lumpsum
                        type: 'LUMPSUM',
                    });
                }
            }
        });
    });

    return upcoming.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
};
