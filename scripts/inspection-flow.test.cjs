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
