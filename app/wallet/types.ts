export interface Transaction {
  _id: string;
  type: string;
  amount: number;
  status: string;
  description: string;
  createdAt: string;
  trip?: {
    _id: string;
    name: string;
  };
  expense?: {
    _id: string;
    title: string;
  };
}

export interface WalletData {
  wallet: {
    balance: number;
  };
  transactions: Transaction[];
}

export interface CheckoutFormProps {
  amount: number;
  transactionId: string;
  onSuccess: () => void;
}

export interface RazorpayCheckoutProps {
  amount: number;
  transactionId: string;
  orderId: string;
  keyId: string;
  prefill: any;
  onSuccess: () => void;
}
