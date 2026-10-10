import API from "@/src/services/api";
export type Id = string | number;
export const INSPECTION_FLOW_ENABLED = true;
export type Outcome = "completed" | "not_completed";
export type Report = {
  id: number;
  inspector_name: string;
  outcome: Outcome;
  explanation: string | null;
  reason_code: string | null;
  submitted_at: string;
  ratings: Record<string, { rating: number; review: string | null }>;
};
export type InspectionFlow = {
  appointment_id: Id;
  property_id: Id;
  revision: number;
  viewer_role: "customer" | "lister" | "representative" | "guest";
  inspection_method: "personal" | "delegated" | null;
  appointment_label: string;
  property_label: string;
  message: string;
  attendee_name: string;
  delegation: null | {
    id: number;
    representative_name: string;
    status: string;
  };
  attendance: null | {
    location_verified: boolean;
    recorded_at: string;
    message: string;
  };
  report: Report | null;
  lister_report: Report | null;
  viewer_report_submitted: boolean;
  customer_decision: null | {
    decision: "proceed" | "decline";
    note: string | null;
    decided_at: string;
  };
  payment_status: string | null;
  can_proceed_to_payment: boolean;
  beneficiary_confirmed: boolean;
  capabilities: {
    can_manage_delegation: boolean;
    can_accept_delegation: boolean;
    can_decline_delegation: boolean;
    can_record_arrival: boolean;
    can_submit_report: boolean;
    can_make_decision: boolean;
    can_proceed: boolean;
    can_manage_beneficiary: boolean;
  };
  reasons: { code: string; name: string }[];
};
export type ActionResult = {
  flow: InspectionFlow;
  guest_invitation_url?: string;
  redirect?: string;
};
export function errorText(error: unknown): string {
  const e = error as {
    response?: {
      data?: { message?: string; errors?: Record<string, string[]> };
    };
    message?: string;
  };
  return (
    Object.values(e.response?.data?.errors ?? {}).flat()[0] ||
    e.response?.data?.message ||
    e.message ||
    "Unable to complete this action. Please try again."
  );
}
export function validateFlow(value: unknown): InspectionFlow {
  const f = value as InspectionFlow;
  if (
    !f ||
    !f.appointment_id ||
    !Number.isInteger(f.revision) ||
    !["customer", "lister", "representative", "guest"].includes(
      f.viewer_role,
    ) ||
    ![null, "personal", "delegated"].includes(f.inspection_method) ||
    !f.capabilities ||
    typeof f.capabilities.can_submit_report !== "boolean" ||
    !Array.isArray(f.reasons)
  )
    throw new Error("The inspection service returned an incomplete response.");
  return f;
}
const root = (id: Id) =>
  `/appointments/${encodeURIComponent(String(id))}/inspection-flow`;
export async function loadInspectionFlow(id: Id): Promise<InspectionFlow> {
  const response = await API.get<{ data: unknown }>(root(id));
  return validateFlow(response.data.data);
}
export async function mutateInspectionFlow(
  id: Id,
  kind: string,
  payload: Record<string, unknown>,
): Promise<ActionResult> {
  const response = await API.post<{ data: ActionResult }>(
    `${root(id)}/${kind}`,
    payload,
  );
  return { ...response.data.data, flow: validateFlow(response.data.data.flow) };
}
export type SettlementView = {
  id: Id;
  settlement_id: Id;
  appointment_id: Id;
  property_label: string;
  currency: string;
  total_amount: string;
  state: "ready" | "awaiting_account_details" | "processing" | "paid";
  items: { type: string; label: string; amount: string }[];
  beneficiary: null | {
    account_name: string;
    bank_name: string;
    masked_account_number: string;
  };
  payment: null | {
    id: Id;
    status: string;
    reference: string;
    authorization_url: string | null;
  };
};
export async function prepareInspectionSettlement(
  id: Id,
  revision: number,
): Promise<SettlementView> {
  const response = await API.post<{ data: SettlementView }>(
    `${root(id)}/prepare-payment`,
    { revision },
  );
  if (!response.data.data?.settlement_id)
    throw new Error("The payment review could not be prepared.");
  return response.data.data;
}
