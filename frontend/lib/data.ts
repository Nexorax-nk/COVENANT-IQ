// Simple types for our hackathon
export type Loan = {
  id: string;
  borrower: string;
  amount: string;
  status: "Healthy" | "Watchlist" | "Critical";
  riskScore: number; // 0-100
  nextReview: string;
};

export const LOANS: Loan[] = [
  {
    id: "1",
    borrower: "TechFlow Logistics",
    amount: "$12,500,000",
    status: "Healthy",
    riskScore: 12,
    nextReview: "Oct 24, 2025",
  },
  {
    id: "2",
    borrower: "Oceanic Shipping Ltd",
    amount: "$45,000,000",
    status: "Critical",
    riskScore: 88,
    nextReview: "Dec 22, 2025",
  },
  {
    id: "3",
    borrower: "Alpha Construct Co",
    amount: "$8,200,000",
    status: "Watchlist",
    riskScore: 65,
    nextReview: "Nov 01, 2025",
  },
];

export const ALERTS = [
  { id: 1, message: "Oceanic Shipping: Debt-to-EBITDA projected to breach", type: "critical" },
  { id: 2, message: "Alpha Construct: Q3 Financials overdue by 2 days", type: "warning" },
];