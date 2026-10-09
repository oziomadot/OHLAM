import API from '@/src/services/api';

// Leave false until the Laravel endpoints in BACKEND-CONTRACT.md are implemented.
export const INSPECTION_FLOW_ENABLED = false;
export type Id = string | number;
export type Outcome = 'completed' | 'not_completed' | 'problem';
export type Decision = 'proceed' | 'clarification' | 'decline' | 'problem';
export type InspectionReport = {
  id: Id;
  inspector_name: string;
  on_behalf_of_customer: boolean;
  outcome: Outcome;
  claim_status: 'inspection_claim_pending' | 'inspection_claim_approved' | 'inspection_claim_rejected';
  explanation: string;
  reason_code: string | null;
  property_rating: number | null;
  property_review: string | null;
  lister_rating: number | null;
  lister_review: string | null;
  submitted_at: string;
};
export type InspectionFlow = {
  appointment_id: Id;
  revision: number; // Used by Laravel to reject decisions on a changed report.
  viewer_role: 'customer' | 'lister' | 'representative' | 'guest';
  inspection_method: 'personal' | 'delegated';
  appointment_label: string;
  message: string;
  delegation: null | {
    id: Id;
    representative_name: string;
    status: 'invited' | 'accepted' | 'declined' | 'revoked' | 'expired';
  };
  attendance: null | {
    id: Id;
    location_verified: boolean;
    recorded_at: string;
    message: string;
  };
  viewer_report_submitted: boolean;
  report: InspectionReport | null;
  customer_decision: null | { decision: Decision; note: string | null; decided_at: string };
  payment_status: string | null;
  can_proceed_to_payment: boolean;
  capabilities: {
    can_manage_delegation: boolean;
    can_accept_delegation: boolean;
    can_decline_delegation: boolean;
    can_record_arrival: boolean;
    can_submit_report: boolean;
    can_make_decision: boolean;
    can_request_correction: boolean;
    can_submit_service_review: boolean;
    can_request_account_details: boolean;
  };
  service_review_submitted: boolean;
  public_review: null | { google_review_url: string; share_text: string };
};
export type ReportInput = {
  revision: number;
  attendance_id: Id | null;
  outcome: Outcome;
  reason_code: string | null;
  explanation: string;
  property_rating: number | null;
  property_review: string | null;
  lister_rating: number | null;
  lister_review: string | null;
};
export type FlowAction =
  | { kind: 'arrival'; payload: { revision: number; captured_latitude: number; captured_longitude: number; accuracy_metres: number; captured_at: string; mocked: boolean | null } }
  | { kind: 'report'; payload: ReportInput }
  | { kind: 'decision'; payload: { revision: number; report_id: Id; decision: Decision; note: string | null } }
  | { kind: 'delegation'; payload: { revision: number; representative_type: 'registered' | 'guest'; representative_name: string; representative_phone: string; representative_user_id: string | null; contact_permission_confirmed: true } }
  | { kind: 'revoke-delegation'; payload: { revision: number; delegation_id: Id } }
  | { kind: 'personal'; payload: { revision: number } }
  | { kind: 'accept-delegation' | 'decline-delegation'; payload: { revision: number; delegation_id: Id } }
  | { kind: 'correction'; payload: { revision: number; report_id: Id; explanation: string } }
  | { kind: 'service-review'; payload: { rating: number; review: string } }
  | { kind: 'request-account-details'; payload: { revision: number } };

export function validateFlow(value: unknown): InspectionFlow {
  const f = value as InspectionFlow;
  if (!f || !f.appointment_id || !Number.isInteger(f.revision) ||
      !['customer', 'lister', 'representative', 'guest'].includes(f.viewer_role) ||
      !['personal', 'delegated'].includes(f.inspection_method) ||
      typeof f.viewer_report_submitted !== 'boolean' || typeof f.can_proceed_to_payment !== 'boolean' ||
      !f.capabilities || typeof f.capabilities.can_submit_report !== 'boolean') {
    throw new Error('Inspection flow response is incomplete. Update the Laravel response before enabling this screen.');
  }
  return f;
}
export function errorText(error: unknown): string {
  const e = error as { response?: { status?: number; data?: { message?: string; errors?: Record<string, string[]> } }; message?: string };
  const errors = Object.values(e.response?.data?.errors ?? {}).flat();
  return errors[0] || e.response?.data?.message || e.message || 'Unable to complete this action. Please try again.';
}
const root = (id: Id) => `/appointments/${encodeURIComponent(String(id))}/inspection-flow`;
export async function loadInspectionFlow(id: Id): Promise<InspectionFlow> {
  const response = await API.get(root(id));
  return validateFlow(response.data?.data);
}
export async function mutateInspectionFlow(id: Id, action: FlowAction): Promise<void> {
  // Do not use automatic retries for mutations. On an uncertain result, reload.
  await API.post(`${root(id)}/${action.kind}`, action.payload);
}
export async function prepareInspectionSettlement(id: Id, revision: number): Promise<{ settlement_id: Id; state: 'ready' | 'awaiting_account_details' | 'processing' | 'paid' }> {
  const response = await API.post(`${root(id)}/prepare-payment`, { revision });
  const result = response.data?.data;
  if (!result?.settlement_id || !['ready', 'awaiting_account_details', 'processing', 'paid'].includes(result.state)) {
    throw new Error('Laravel did not return a valid settlement. Payment cannot be opened.');
  }
  return result;
}
