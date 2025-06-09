// app/types/index.ts

export interface Supplier {
  id: string;
  name: string;
  country: string;
  city: string;
  address?: string;
  phone?: string;
  email: string;
  contactName?: string; // שונה מ-contactPerson
  contactPhone?: string;
  contactPosition?: string;
  contactEmail?: string;
  productionTimeWeeks: number; // שונה מ-productionTime
  shippingTimeWeeks: number; // שונה מ-shippingTime
  hasAdvancePayment: boolean;
  advancePercentage?: number;
  currency: string;
  notes?: string;
  paymentTerms?: string;
  minimumOrder?: number;
  // שדות מסמכים שהיו בקוד המקורי
  importLicense?: string;
  licenseExpiry?: string;
  feedLicense?: string;
  feedLicenseExpiry?: string;
  bankName?: string;
  beneficiary?: string;
  iban?: string;
  bic?: string;
  // שדות מערכת
  createdAt: string;
  updatedAt: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  supplierId: string;
  supplierName: string;
  etaFinal: string;
  status: string;
  totalAmount: number;
  advanceAmount: number;
  finalPaymentAmount: number;
  exchangeRate?: number;
  containerNumber?: string;
  customsCompanyId?: string;
  customsAgentId?: string;
  notes?: string;
  portReleaseCost?: number;
  originalCurrency: string;
  createdAt: string;
  updatedAt?: string;
}
