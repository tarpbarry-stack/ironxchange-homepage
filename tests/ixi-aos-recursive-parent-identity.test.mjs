import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  resolveAosWorkspaceParentName
} from "../lib/mos/ixiAosHierarchyContract.mjs";


test("a root AOS card uses only persisted customer parent presentation", () => {
  assert.equal(
    resolveAosWorkspaceParentName({
      object: {
        objectId: "root-1",
        displayName: "STAR & SONS",
        metadata: {
          parentDisplayName: "STALE ENTITY NAME"
        }
      }
    }),
    "STALE ENTITY NAME"
  );
});


test("a root object type does not manufacture a platform parent noun", () => {
  assert.equal(
    resolveAosWorkspaceParentName({
      object: {
        objectId: "owner-person-1",
        objectType: "person",
        displayName: "IXI DADDY"
      }
    }),
    ""
  );
});


test("a child resolves line 1 from its live parent's customer-defined name", () => {
  const child = {
    objectId: "child-1",
    directContainerId: "parent-1",
    displayName: "WHEEL LOADERS",
    metadata: {
      parentDisplayName: "OLD EQUIPMENT NAME"
    }
  };

  assert.equal(
    resolveAosWorkspaceParentName({
      object: child,
      parentObject: {
        objectId: "parent-1",
        displayName: "STAR & SONS EQUIPMENT"
      }
    }),
    "STAR & SONS EQUIPMENT"
  );

  assert.equal(
    resolveAosWorkspaceParentName({
      object: child,
      parentObject: {
        objectId: "parent-1",
        displayName: "EQUIPMENT INVENTORY"
      }
    }),
    "EQUIPMENT INVENTORY"
  );
});


test("a linked child uses its stored parent snapshot only while live parent data is unavailable", () => {
  assert.equal(
    resolveAosWorkspaceParentName({
      object: {
        objectId: "child-2",
        directContainerId: "parent-2",
        metadata: {
          parentDisplayName: "SERVICE DEPARTMENT"
        }
      }
    }),
    "SERVICE DEPARTMENT"
  );

  assert.equal(
    resolveAosWorkspaceParentName({
      object: {
        objectId: "child-3",
        directContainerId: "missing-parent"
      }
    }),
    ""
  );
});


test("AOS creation and rendering share the recursive parent contract", async () => {
  const [creation, board, page, legacyCard] = await Promise.all([
    readFile(new URL("../components/ixi-mos/object-creation/useIXIMosObjectCreation.js", import.meta.url), "utf8"),
    readFile(new URL("../components/ixi-mos/workspace/IXIAosWorkspaceBoard.jsx", import.meta.url), "utf8"),
    readFile(new URL("../pages/aos/work.js", import.meta.url), "utf8"),
    readFile(new URL("../components/ixi-mos/IXIMosObjectCard.jsx", import.meta.url), "utf8")
  ]);

  assert.doesNotMatch(creation, /IXI_AOS_SYSTEM_INDEX_LABEL/u);
  assert.match(creation, /parentObjectId:\s*destinationContainerId/u);
  assert.match(creation, /parentDisplayName:\s*getAosHierarchyDisplayName\(\s*container\s*\)/u);
  assert.match(board, /resolveAosWorkspaceParentName\(\{\s*object:\s*item,\s*parentObject\s*\}\)/u);
  assert.match(page, /resolveAosWorkspaceParentName\(\{\s*object,\s*parentObject\s*\}\)/u);
  assert.doesNotMatch(page, /parentDisplayName:\s*String\(\s*aosEntity/u);
  assert.match(legacyCard, /resolveAosWorkspaceParentName/u);
});
