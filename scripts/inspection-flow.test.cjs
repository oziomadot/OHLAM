const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");
const React = require("react");
const { create, act } = require("react-test-renderer");
global.IS_REACT_ACT_ENVIRONMENT = true;
const root = path.join(__dirname, "..");
function source(file, mocks) {
  const js = ts.transpileModule(
    fs.readFileSync(path.join(root, file), "utf8"),
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        jsx: ts.JsxEmit.ReactJSX,
        esModuleInterop: true,
        target: ts.ScriptTarget.ES2022,
      },
    },
  ).outputText;
  const module = { exports: {} };
  const customRequire = (name) =>
    Object.prototype.hasOwnProperty.call(mocks, name)
      ? mocks[name]
      : require(name);
  vm.runInThisContext("(function(require,module,exports){" + js + "\n})", {
    filename: file,
  })(customRequire, module, module.exports);
  return module.exports;
}
function fixture(role = "customer") {
  return {
    appointment_id: 7,
    property_id: 9,
    revision: 3,
    viewer_role: role,
    inspection_method: "personal",
    appointment_label: "Appointment #7",
    property_label: "Property #9",
    message: "Inspect the property",
    attendee_name: "Customer",
    delegation: null,
    attendance: null,
    report: null,
    lister_report: null,
    viewer_report_submitted: false,
    customer_decision: null,
    payment_status: null,
    can_proceed_to_payment: false,
    beneficiary_confirmed: false,
    reasons: [],
    capabilities: {
      can_manage_delegation: false,
      can_accept_delegation: false,
      can_decline_delegation: false,
      can_record_arrival: false,
      can_submit_report: false,
      can_make_decision: false,
      can_proceed: false,
      can_manage_beneficiary: false,
    },
  };
}
async function mount(flow, extra = {}) {
  const calls = [];
  const pushes = [];
  const alerts = [];
  const service = {
    loadInspectionFlow: async () => flow,
    errorText: (e) => e.message,
    mutateInspectionFlow: async (id, kind, payload) => {
      calls.push({ id, kind, payload });
      return { flow: { ...flow, revision: flow.revision + 1 }, ...extra };
    },
    prepareInspectionSettlement: async (id, revision) => {
      calls.push({ id, revision, kind: "prepare" });
      return { settlement_id: 44 };
    },
  };
  const native = {
    View: "View",
    Text: "Text",
    TextInput: "TextInput",
    TouchableOpacity: "TouchableOpacity",
    ActivityIndicator: "ActivityIndicator",
    StyleSheet: { create: (x) => x },
    Alert: { alert: (...args) => alerts.push(args) },
    Share: { share: async (x) => calls.push(x) },
  };
  const router = { push: (x) => pushes.push(x) };
  const C = source("components/inspection/InspectionFlowCard.tsx", {
    "react-native": native,
    "expo-router": {
      useRouter: () => router,
      useFocusEffect: (callback) => React.useEffect(callback, [callback]),
    },
    "expo-location": {},
    "@/src/services/inspectionFlow": service,
  }).default;
  let renderer;
  await act(async () => {
    renderer = create(React.createElement(C, { appointmentId: 7 }));
  });
  const button = (title) =>
    renderer.root
      .findAllByType("TouchableOpacity")
      .find((n) =>
        n.findAllByType("Text").some((t) => t.children.join("") === title),
      );
  return { renderer, calls, pushes, alerts, button };
}
test("service validates the new unselected flow and rejects malformed responses", () => {
  const service = source("src/services/inspectionFlow.ts", {
    "@/src/services/api": {},
  });
  assert.equal(
    service.validateFlow({ ...fixture(), inspection_method: null }).revision,
    3,
  );
  assert.throws(() => service.validateFlow({ appointment_id: 7 }));
});
test("accepted customer can choose inspector, and a double tap submits only once", async () => {
  const f = fixture();
  f.inspection_method = null;
  f.capabilities.can_manage_delegation = true;
  const m = await mount(f);
  const b = m.button("I will attend personally");
  assert.ok(b);
  await act(async () => {
    b.props.onPress();
    b.props.onPress();
  });
  assert.equal(m.calls.length, 1);
  assert.equal(m.calls[0].kind, "personal");
  await act(async () => m.renderer.unmount());
});
test("representative cannot see customer decisions or payment actions", async () => {
  const f = fixture("representative");
  f.report = {
    id: 8,
    inspector_name: "Rep",
    outcome: "completed",
    explanation: "Done",
    ratings: {},
  };
  const m = await mount(f);
  assert.equal(m.button("Proceed to payment"), undefined);
  assert.equal(m.button("I don't want the property"), undefined);
  assert.equal(m.button("Open payment review"), undefined);
  await act(async () => m.renderer.unmount());
});
test("customer proceeds using the revision returned by the decision response", async () => {
  const f = fixture();
  f.capabilities.can_make_decision = true;
  f.capabilities.can_proceed = true;
  f.report = {
    id: 8,
    inspector_name: "Rep",
    outcome: "completed",
    explanation: "Done",
    ratings: {},
  };
  const m = await mount(f);
  await act(async () => m.button("Proceed to payment").props.onPress());
  assert.equal(m.calls[0].kind, "decision");
  assert.equal(m.calls[0].payload.report_id, 8);
  assert.equal(m.calls[1].kind, "prepare");
  assert.equal(m.calls[1].revision, 4);
  assert.deepEqual(m.pushes, ["/property-payment/44"]);
  await act(async () => m.renderer.unmount());
});
test("lister submits an attendee rating and is redirected to beneficiary confirmation", async () => {
  const f = fixture("lister");
  f.attendance = { location_verified: true, message: "Arrival verified" };
  f.capabilities.can_submit_report = true;
  const m = await mount(f, {
    redirect: "/property-payment/lister/add-beneficiary?appointmentId=7",
  });
  const rating = m.renderer.root
    .findAllByType("TouchableOpacity")
    .find((n) => n.props.accessibilityLabel === "Attendee: Customer: 5 of 5");
  await act(async () => rating.props.onPress());
  await act(async () => m.button("Submit inspection report").props.onPress());
  const submit = m.alerts[0][2].find((b) => b.text === "Submit");
  await act(async () => submit.onPress());
  assert.equal(m.calls[0].payload.attendee_rating, 5);
  assert.equal(m.calls[0].payload.property_rating, null);
  assert.deepEqual(m.pushes, [
    "/property-payment/lister/add-beneficiary?appointmentId=7",
  ]);
  await act(async () => m.renderer.unmount());
});

async function mountTransaction(data) {
  const calls = [], alerts = [];
  const api = { get: async () => ({ data: { data } }), post: async (url, payload) => { calls.push({ url, payload }); return { data: { data } }; } };
  const service = source('src/services/propertyTransactions.ts', { '@/src/services/api': { default: api, __esModule: true } });
  const C = source('app/(tabs)/property-payment/transaction/[paymentId].tsx', {
    'react-native': { View: 'View', Text: 'Text', TextInput: 'TextInput', ScrollView: 'ScrollView', ActivityIndicator: 'ActivityIndicator', AppState: { addEventListener: () => ({ remove() {} }) }, Alert: { alert: (...a) => alerts.push(a) } },
    'expo-router': { useLocalSearchParams: () => ({ paymentId: '1' }), useRouter: () => ({ push() {} }), useFocusEffect: cb => React.useEffect(cb, [cb]) },
    'components/Protected': { default: ({ children }) => children, __esModule: true },
    'components/inspection/InspectionFlowCard': { ActionButton: 'ActionButton' },
    '@/src/services/api': { default: api, __esModule: true }, '@/src/services/inspectionFlow': { errorText: e => e.message }, '@/src/services/propertyTransactions': service,
  }).default;
  let renderer; await act(async () => { renderer = require("react-test-renderer").create(React.createElement(C)); });
  return { renderer, calls, alerts };
}
test('customer cannot authorise payouts from the transaction screen', async () => {
  const m = await mountTransaction({ id: 1, property_id: 2, appointment_id: 3, reference: 'REF', status: 'property_payment_awaiting_availability', allocations: [], handover: null, can_confirm_availability: false });
  assert.equal(m.renderer.root.findAllByProps({ title: 'Property is available — authorise payouts' }).length, 0);
  await act(async () => m.renderer.unmount());
});
test('lister confirms availability before the payout action and duplicate taps submit once', async () => {
  const m = await mountTransaction({ id: 1, property_id: 2, appointment_id: 3, reference: 'REF', status: 'property_payment_awaiting_availability', allocations: [], handover: null, can_confirm_availability: true });
  await act(async () => m.renderer.root.findByProps({ title: 'Property is available — authorise payouts' }).props.onPress());
  assert.equal(m.calls.length, 0);
  await act(async () => { m.alerts[0][2][1].onPress(); m.alerts[0][2][1].onPress(); });
  assert.deepEqual(m.calls, [{ url: '/property-transactions/1/availability', payload: { available: true, details_confirmed: true } }]);
  await act(async () => m.renderer.unmount());
});
test('beneficiary screen shows every charge and confirms exact amounts with selected recipient versions', async () => {
  const calls = [], alerts = [];
  const data = { revision: 8, property_id: 2, allocation_revision: 3, total_amount: '105', locked: false, allocation_confirmed: false, items: [{ id: 1, type: 'property_amount', label: 'Rent', amount: '100', beneficiary_id: 7 }, { id: 2, type: 'agent_fee', label: 'Agent net 82%', amount: '4.10', beneficiary_id: 7 }, { id: 3, type: 'agent_fee_platform_share', label: 'OHLAM share 18%', amount: '0.90', beneficiary_id: null }], beneficiaries: [{ id: 7, beneficiary_type: 'owner', declared_name: 'Owner', account_name: 'Owner', bank_name: 'Bank', masked_account_number: '****1234', bank_verified: true, version: 'v1' }] };
  const api = { get: async url => ({ data: { data: url === '/wallet/banks' ? [] : data } }), post: async (url, payload) => { calls.push({ url, payload }); return { data: {} }; } };
  function Picker({ children, ...props }) { return React.createElement('Picker', props, children); } Picker.Item = 'PickerItem';
  const C = source('app/(tabs)/property-payment/lister/add-beneficiary.tsx', {
    'react-native': { View: 'View', Text: 'Text', TextInput: 'TextInput', ScrollView: 'ScrollView', ActivityIndicator: 'ActivityIndicator', StyleSheet: { create: s => s }, Alert: { alert: (...a) => alerts.push(a) } },
    'expo-router': { useLocalSearchParams: () => ({ appointmentId: '3' }), useRouter: () => ({ replace() {} }), useFocusEffect: cb => React.useEffect(cb, [cb]) },
    '@react-native-picker/picker': { Picker }, 'components/Protected': { default: ({ children }) => children, __esModule: true },
    'components/inspection/InspectionFlowCard': { ActionButton: 'ActionButton' }, '@/src/services/api': { default: api, __esModule: true }, '@/src/services/inspectionFlow': { errorText: e => e.message },
  }).default;
  let renderer; await act(async () => { renderer = create(React.createElement(C)); });
  const button = renderer.root.findByProps({ title: 'Confirm all recipients and amounts' }); assert.equal(button.props.disabled, false);
  await act(async () => button.props.onPress());
  await act(async () => alerts[0][2][1].onPress());
  assert.deepEqual(calls[0], { url: '/appointments/3/beneficiary/allocations', payload: { revision: 8, allocation_revision: 3, details_correct: true, items: [{ id: 1, amount: '100', beneficiary_id: 7, version: 'v1' }, { id: 2, amount: '4.10', beneficiary_id: 7, version: 'v1' }, { id: 3, amount: '0.90', beneficiary_id: null, version: null }] } });
  await act(async () => renderer.unmount());
});
