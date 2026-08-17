import { evaluateIXIAuthority } from "./IXIAuthorityEvaluator";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

export function runIXIAuthoritySelfTest() {
  const actor = {
    principalId: "principal_001",
    passportId: "P-ACTOR",
    roles: ["field-tech"],
    groups: ["service"],
    entityPassportIds: ["P-ENTITY"],
    authenticated: true
  };

  const policies = [
    {
      policyId: "pol_parent",
      target: { passportId: "P-PARENT" },
      inheritance: { propagateToChildren: true },
      rules: [
        {
          ruleId: "parent-view",
          effect: "allow",
          subject: { type: "role", id: "field-tech" },
          capabilities: ["aos.view"],
          scope: { type: "target-and-descendants", passportId: "P-PARENT" }
        },
        {
          ruleId: "parent-financial-deny",
          effect: "deny",
          subject: { type: "role", id: "field-tech" },
          capabilities: ["financial.view"],
          scope: { type: "target-and-descendants", passportId: "P-PARENT" }
        }
      ]
    },
    {
      policyId: "pol_target",
      target: { passportId: "P-TARGET" },
      rules: [
        {
          ruleId: "target-financial-allow",
          effect: "allow",
          subject: { type: "principal", id: "principal_001" },
          capabilities: ["financial.view"],
          scope: { type: "target", passportId: "P-TARGET" }
        }
      ]
    }
  ];

  const base = {
    actor,
    targetPassportId: "P-TARGET",
    ancestorPassportIds: ["P-PARENT"],
    entityPassportId: "P-ENTITY",
    policies
  };

  const inheritedView = evaluateIXIAuthority({ ...base, capability: "aos.view" });
  assert(inheritedView.allowed === true, "Expected inherited view allow.");
  assert(inheritedView.reason === "inherited-allow", "Expected inherited allow reason.");

  const targetOverride = evaluateIXIAuthority({ ...base, capability: "financial.view" });
  assert(targetOverride.allowed === true, "Expected explicit target allow to override ancestor deny by current precedence contract.");
  assert(targetOverride.reason === "explicit-target-allow", "Expected explicit target allow reason.");

  const defaultDeny = evaluateIXIAuthority({ ...base, capability: "aos.delete" });
  assert(defaultDeny.allowed === false, "Expected default deny.");
  assert(defaultDeny.reason === "default-deny", "Expected default deny reason.");

  const hardDeny = evaluateIXIAuthority({ ...base, capability: "aos.view", systemDeniedCapabilities: ["aos.view"] });
  assert(hardDeny.allowed === false, "Expected system hard deny.");
  assert(hardDeny.reason === "system-hard-deny", "Expected hard deny reason.");

  return {
    ok: true,
    inheritedView,
    targetOverride,
    defaultDeny,
    hardDeny
  };
}

export default runIXIAuthoritySelfTest;
