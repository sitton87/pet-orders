// app/types/index.ts

export interface Supplier {
  id: string;
  name: string;
  country: string;
  city: string;
  address?: string;
  phone?: string;
  email: string;
  contactPerson?: string; // 🔧 שונה ל-contactPerson להתאמה לסכמה
  contactPhone?: string;
  contactPosition?: string;
  contactEmail?: string;
  productionTimeWeeks: number;
  shippingTimeWeeks: number;
  hasAdvancePayment: boolean;
  advancePercentage?: number;
  currency: string;
  notes?: string;
  paymentTerms?: string;
  minimumOrder?: number;
  // שדות מסמכים
  importLicense?: string;
  licenseExpiry?: string;
  feedLicense?: string;
  feedLicenseExpiry?: string;
  bankName?: string;
  beneficiary?: string;
  iban?: string;
  bic?: string;

  // 🆕 השדות החדשים:
  productCategory?: string; // קטגוריית מוצרים
  connection?: string; // קישור/חיבור (URL, מייל, טלפון)

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
