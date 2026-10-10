import API from '@/src/services/api';
export type Transaction = {
  id: number; appointment_id: number; property_id: number; role: 'customer' | 'lister'; status: string; reference: string;
  can_accept_handover: boolean; can_confirm_handover: boolean;
  can_confirm_availability: boolean; confirmation_due_at: string | null; released_at: string | null;
  handover: null | { revision: number; status: string; proposed_by: number; scheduled_at: string; note: string; completed_by: number[] };
  allocations: { id: number; label: string; amount_kobo: number; status: string; account_name: string; bank_name: string; masked_account_number: string }[];
};
export const transactionLabels: Record<string, string> = {
  property_payment_pending: 'Checkout pending', property_payment_initializing: 'Preparing checkout', property_payment_uncertain: 'Checking checkout',
  property_payment_awaiting_availability: 'Payment received — awaiting lister availability confirmation', property_payment_distributing: 'Recipient payments processing',
  property_payment_distribution_attention: 'Recipient payments being checked', property_payment_released: 'Recipients paid — arrange handover',
  property_payment_refund_required: 'Property unavailable — refund requested', property_payment_refund_pending: 'Refund processing',
  property_payment_refund_attention: 'Refund needs support review', property_payment_refunded: 'Refund completed',
  property_payment_checkout_expired: 'Checkout expired', property_payment_secured: 'Payment received — contact support for the existing transaction',
};
export const loadTransaction = async (id: string) => (await API.get<{ data: Transaction }>(`/property-transactions/${encodeURIComponent(id)}`)).data.data;
