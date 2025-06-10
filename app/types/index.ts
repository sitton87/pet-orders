// app/types/index.ts

export interface Supplier {
  id: string;
  name: string;
  country: string;
  city: string;
  address?: string;
  phone?: string;
  email: string;
  contactPerson?: string;
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

  // productCategory String, עכשיו relation
  supplierCategories?: Array<{
    id: string;
    category: {
      id: string;
      name: string;
      description?: string;
    };
  }>;

  connection?: string;

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
