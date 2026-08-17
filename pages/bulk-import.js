import Head from "next/head";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

import {
  loadIXIMosEnvironment
} from "../lib/mos/loadIXIMosEnvironment";

import {
  parseAosBulkImportFile,
  getImportableDefinitionFields,
  createDefaultBulkMapping,
  validateBulkRow,
  buildBulkProvisioningInput
} from "../lib/mos/ixiAosBulkImportEngine";

import {
  findAosImportJobByFingerprint,
  createAosImportJob,
  executeAosImportJob,
  summarizeAosImportJob
} from "../lib/mos/ixiAosImportJobClient";

function clean(value) {
  return String(value ?? "").trim();
}

function safeObject(value) {
  return (
    value &&
    typeof value === "object" &&
    !Array.isArray(value)
  )
    ? value
    : {};
}

function buildServerRows({
  fileRecord,
  entityId,
  actorId,
  definition,
  mapping
}) {
  return fileRecord.rows.map(row => {
    const validation =
      validateBulkRow({
        row,
        entityId,
        definition,
        mapping
      });

    const built =
      validation.valid
        ? buildBulkProvisioningInput({
            importRecord:
              fileRecord,
            row,
            entityId,
            actorId,
            definition,
            mapping
          })
        : null;

    return {
      rowNumber:
        row.rowNumber,

      rowKey:
        `row:${row.rowNumber}`,

      values:
        safeObject(row.values),

      normalizedInput:
        built?.valid
          ? built.input
          : {},

      validation: {
        valid:
          validation.valid,
        errors:
          validation.errors || []
      },

      status:
        validation.valid
          ? "ready"
          : "invalid"
    };
  });
}

export default function BulkImportPage() {
  const router = useRouter();

  const [environment, setEnvironment] =
    useState(null);
  const [loadingEnvironment, setLoadingEnvironment] =
    useState(true);
  const [fileRecord, setFileRecord] =
    useState(null);
  const [selectedDefinitionId, setSelectedDefinitionId] =
    useState("");
  const [mapping, setMapping] =
    useState({
      displayNameColumn: "",
      businessIdentifierColumn: "",
      fieldMappings: {}
    });
  const [ledger, setLedger] =
    useState(null);
  const [busy, setBusy] =
    useState(false);
  const [notice, setNotice] =
    useState("");
  const [error, setError] =
    useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoadingEnvironment(true);
      setError("");

      try {
        const next =
          await loadIXIMosEnvironment({
            includeObjects: true
          });

        if (cancelled) {
          return;
        }

        if (!next?.isAuthenticated) {
          throw new Error(
            "Sign in before importing AOS objects."
          );
        }

        setEnvironment(next);
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError?.message ||
            "Could not load the AOS environment."
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingEnvironment(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  const definitions =
    useMemo(() =>
      Array.isArray(environment?.objectDefinitions)
        ? environment.objectDefinitions
            .filter(definition =>
              definition?.status !== "archived"
            )
        : [],
    [environment]
  );

  const selectedDefinition =
    useMemo(() =>
      definitions.find(definition =>
        String(definition?.definitionId) ===
        String(selectedDefinitionId)
      ) || null,
    [definitions, selectedDefinitionId]
  );

  const fields =
    useMemo(() =>
      getImportableDefinitionFields(
        selectedDefinition || {}
      ),
    [selectedDefinition]
  );

  const preview =
    useMemo(() => {
      if (
        !fileRecord ||
        !selectedDefinition
      ) {
        return {
          valid: 0,
          invalid: 0,
          rows: []
        };
      }

      const rows =
        fileRecord.rows
          .slice(0, 100)
          .map(row => ({
            row,
            validation:
              validateBulkRow({
                row,
                entityId:
                  environment?.entity?.entityId,
                definition:
                  selectedDefinition,
                mapping
              })
          }));

      let valid = 0;
      let invalid = 0;

      fileRecord.rows.forEach(row => {
        const result =
          validateBulkRow({
            row,
            entityId:
              environment?.entity?.entityId,
            definition:
              selectedDefinition,
            mapping
          });

        if (result.valid) {
          valid += 1;
        } else {
          invalid += 1;
        }
      });

      return {
        valid,
        invalid,
        rows
      };
    }, [
      fileRecord,
      selectedDefinition,
      mapping,
      environment
    ]);

  const summary =
    useMemo(() =>
      summarizeAosImportJob(ledger),
    [ledger]
  );

  const serverRowsByNumber =
    useMemo(() => {
      const map = new Map();

      (
        Array.isArray(ledger?.rows)
          ? ledger.rows
          : []
      ).forEach(row => {
        map.set(
          String(row?.rowNumber),
          row
        );
      });

      return map;
    }, [ledger]);

  async function handleFile(file) {
    if (!file) {
      return;
    }

    setBusy(true);
    setError("");
    setNotice("Reading and fingerprinting file…");

    try {
      const parsed =
        await parseAosBulkImportFile(file);

      setFileRecord(parsed);

      const entityId =
        environment?.entity?.entityId;

      const existing =
        entityId
          ? await findAosImportJobByFingerprint({
              entityId,
              fingerprint:
                parsed.fileHash
            })
          : null;

      setLedger(existing);

      if (
        existing?.definitionId &&
        definitions.some(definition =>
          String(definition?.definitionId) ===
          String(existing.definitionId)
        )
      ) {
        setSelectedDefinitionId(
          existing.definitionId
        );

        setMapping(
          safeObject(existing.mapping)
        );

        setNotice(
          "Existing AWS import job restored. Created rows retain their permanent Object and Passport identities."
        );
      } else {
        setMapping(
          createDefaultBulkMapping({
            headers:
              parsed.headers,
            definition:
              selectedDefinition
          })
        );

        setNotice(
          `${parsed.rows.length} rows loaded from ${parsed.sheetName}. No existing AWS import job was found for this file.`
        );
      }
    } catch (fileError) {
      setFileRecord(null);
      setLedger(null);
      setError(
        fileError?.message ||
        "Could not read the import file."
      );
      setNotice("");
    } finally {
      setBusy(false);
    }
  }

  function handleDefinitionChange(value) {
    const definition =
      definitions.find(item =>
        String(item?.definitionId) ===
        String(value)
      ) || null;

    setSelectedDefinitionId(value);

    if (
      ledger &&
      clean(ledger.definitionId) &&
      clean(ledger.definitionId) !== clean(value)
    ) {
      setError(
        "This file already has a durable AWS import job under another definition. Resume that job instead of remapping permanent rows."
      );
      setSelectedDefinitionId(
        ledger.definitionId
      );
      setMapping(
        safeObject(ledger.mapping)
      );
      return;
    }

    setError("");

    setMapping(current => ({
      ...createDefaultBulkMapping({
        headers:
          fileRecord?.headers || [],
        definition
      }),
      displayNameColumn:
        current.displayNameColumn || "",
      businessIdentifierColumn:
        current.businessIdentifierColumn || ""
    }));
  }

  function setFieldMapping(
    fieldId,
    columnKey
  ) {
    if (ledger) {
      setError(
        "Mapping is locked after the AWS import job exists. Resume the existing job."
      );
      return;
    }

    setMapping(current => ({
      ...current,
      fieldMappings: {
        ...safeObject(current.fieldMappings),
        [fieldId]:
          columnKey
      }
    }));
  }

  async function executeUntilSettled(job) {
    let current = job;
    let guard = 0;

    while (
      current &&
      (
        Number(current?.summary?.ready || 0) > 0 ||
        Number(current?.summary?.failedRetryable || 0) > 0
      ) &&
      guard < 500
    ) {
      const response =
        await executeAosImportJob({
          entityId:
            environment?.entity?.entityId,
          jobId:
            current.jobId,
          actorId:
            environment?.userId,
          limit: 20
        });

      current =
        response?.job ||
        current;

      setLedger(current);
      guard += 1;

      const retryable =
        Number(
          current?.summary?.failedRetryable || 0
        );

      const ready =
        Number(
          current?.summary?.ready || 0
        );

      if (
        ready === 0 &&
        retryable > 0
      ) {
        break;
      }
    }

    return current;
  }

  async function startImport() {
    if (
      !fileRecord ||
      !selectedDefinition
    ) {
      return;
    }

    setBusy(true);
    setError("");
    setNotice(
      ledger
        ? "Resuming AWS import job…"
        : "Creating authoritative AWS import job…"
    );

    try {
      let activeJob = ledger;

      if (!activeJob) {
        const entityId =
          environment?.entity?.entityId;

        const actorId =
          environment?.userId;

        const rows =
          buildServerRows({
            fileRecord,
            entityId,
            actorId,
            definition:
              selectedDefinition,
            mapping
          });

        const created =
          await createAosImportJob({
            entityId,
            actorId,

            sourceFile: {
              name:
                fileRecord.filename,
              size:
                fileRecord.size,
              type:
                fileRecord.extension === "csv"
                  ? "text/csv"
                  : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
              fingerprint:
                fileRecord.fileHash
            },

            definitionId:
              selectedDefinition.definitionId,
            definitionKey:
              selectedDefinition.definitionKey ||
              null,
            mapping,
            rows,

            metadata: {
              source:
                "aos-bulk-import",
              importContract:
                fileRecord.contractVersion,
              importId:
                fileRecord.importId,
              sheetName:
                fileRecord.sheetName
            }
          });

        activeJob =
          created?.job;

        if (!activeJob?.jobId) {
          throw new Error(
            "IX-Core did not return a valid import job."
          );
        }

        setLedger(activeJob);
      }

      setNotice(
        "Provisioning AWS import rows through the durable Object + Passport boundary…"
      );

      const finished =
        await executeUntilSettled(
          activeJob
        );

      setLedger(finished);

      const result =
        summarizeAosImportJob(
          finished
        );

      setNotice(
        `${result.created} objects provisioned with Passport identity. ${result.invalid} invalid rows. ${result.failed} failed rows. AWS job ${finished?.status || "updated"}.`
      );
    } catch (importError) {
      setError(
        importError?.message ||
        "Bulk import failed."
      );
    } finally {
      setBusy(false);
    }
  }

  const identifierSchema =
    safeObject(
      selectedDefinition?.businessIdentifierSchema
    );

  const mappingLocked =
    Boolean(ledger);

  return (
    <>
      <Head>
        <title>AOS Bulk Import | IronXchange</title>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1"
        />
      </Head>

      <main>
        <Navbar />

        <section className="shell">
          <header className="hero">
            <div>
              <span className="eyebrow">
                IXI AOS · DURABLE INTAKE
              </span>
              <h1>Bulk Import</h1>
              <p>
                CSV and Excel (.xlsx) intake through the same permanent AOS Object + Passport + TRAN$ACT provisioning boundary used by manual Save.
              </p>
            </div>

            <button
              type="button"
              className="secondary"
              onClick={() => router.push("/aos/work")}
            >
              AOS Work
            </button>
          </header>

          {error ? (
            <div className="notice error">
              {error}
            </div>
          ) : null}

          {notice ? (
            <div className="notice">
              {notice}
            </div>
          ) : null}

          <div className="grid">
            <section className="panel">
              <div className="panelTitle">
                <span>01</span>
                SOURCE FILE
              </div>

              <label className="drop">
                <input
                  type="file"
                  accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                  disabled={busy}
                  onChange={event =>
                    handleFile(
                      event.target.files?.[0]
                    )
                  }
                />
                <strong>
                  Choose CSV or XLSX
                </strong>
                <small>
                  The file is SHA-256 fingerprinted. Re-selecting the same file restores its authoritative AWS import job from any browser.
                </small>
              </label>

              {fileRecord ? (
                <div className="facts">
                  <div><b>FILE</b><span>{fileRecord.filename}</span></div>
                  <div><b>SHEET</b><span>{fileRecord.sheetName}</span></div>
                  <div><b>ROWS</b><span>{fileRecord.rows.length}</span></div>
                  <div><b>IMPORT</b><span>{ledger?.jobId || fileRecord.importId}</span></div>
                </div>
              ) : null}
            </section>

            <section className="panel">
              <div className="panelTitle">
                <span>02</span>
                CUSTOMER DEFINITION
              </div>

              <label className="control">
                <span>OBJECT DEFINITION</span>
                <select
                  value={selectedDefinitionId}
                  disabled={
                    loadingEnvironment ||
                    busy ||
                    mappingLocked
                  }
                  onChange={event =>
                    handleDefinitionChange(
                      event.target.value
                    )
                  }
                >
                  <option value="">
                    Select active definition…
                  </option>
                  {definitions.map(definition => (
                    <option
                      key={definition.definitionId}
                      value={definition.definitionId}
                    >
                      {definition.label || definition.definitionKey || definition.definitionId}
                    </option>
                  ))}
                </select>
              </label>

              {selectedDefinition ? (
                <div className="definitionInfo">
                  <strong>
                    {selectedDefinition.label}
                  </strong>
                  <span>
                    {fields.length} importable fields · identifier {identifierSchema.required ? "required" : "optional"}
                  </span>
                </div>
              ) : null}
            </section>
          </div>

          {fileRecord && selectedDefinition ? (
            <section className="panel mappingPanel">
              <div className="panelTitle">
                <span>03</span>
                COLUMN CONTRACT
              </div>

              <p className="sectionCopy">
                IXI does not infer business meaning from spreadsheet headings. Map the customer’s columns to the selected persisted definition.
              </p>

              <div className="mappingGrid">
                <label className="control required">
                  <span>OBJECT NAME · REQUIRED</span>
                  <select
                    value={mapping.displayNameColumn || ""}
                    disabled={busy || mappingLocked}
                    onChange={event =>
                      setMapping(current => ({
                        ...current,
                        displayNameColumn:
                          event.target.value
                      }))
                    }
                  >
                    <option value="">Choose column…</option>
                    {fileRecord.headers.map(header => (
                      <option key={header.key} value={header.key}>
                        {header.label}
                      </option>
                    ))}
                  </select>
                </label>

                {identifierSchema.enabled !== false ? (
                  <label className={`control ${identifierSchema.required ? "required" : ""}`}>
                    <span>
                      {identifierSchema.defaultLabel || "BUSINESS IDENTIFIER"}
                      {identifierSchema.required ? " · REQUIRED" : " · OPTIONAL"}
                    </span>
                    <select
                      value={mapping.businessIdentifierColumn || ""}
                      disabled={busy || mappingLocked}
                      onChange={event =>
                        setMapping(current => ({
                          ...current,
                          businessIdentifierColumn:
                            event.target.value
                        }))
                      }
                    >
                      <option value="">No mapped column</option>
                      {fileRecord.headers.map(header => (
                        <option key={header.key} value={header.key}>
                          {header.label}
                        </option>
                      ))}
                    </select>
                  </label>
                ) : null}

                {fields.map(field => (
                  <label
                    className={`control ${field.required ? "required" : ""}`}
                    key={field.fieldId}
                  >
                    <span>
                      {field.label || field.fieldId}
                      {field.required ? " · REQUIRED" : ""}
                    </span>
                    <select
                      value={mapping.fieldMappings?.[field.fieldId] || ""}
                      disabled={busy || mappingLocked}
                      onChange={event =>
                        setFieldMapping(
                          field.fieldId,
                          event.target.value
                        )
                      }
                    >
                      <option value="">No mapped column</option>
                      {fileRecord.headers.map(header => (
                        <option key={header.key} value={header.key}>
                          {header.label}
                        </option>
                      ))}
                    </select>
                  </label>
                ))}
              </div>
            </section>
          ) : null}

          {fileRecord && selectedDefinition ? (
            <section className="panel">
              <div className="panelTitle">
                <span>04</span>
                PREFLIGHT + EXECUTION
              </div>

              <div className="scoreboard">
                <div><b>{fileRecord.rows.length}</b><span>TOTAL ROWS</span></div>
                <div><b>{preview.valid}</b><span>VALID</span></div>
                <div><b>{preview.invalid}</b><span>INVALID</span></div>
                <div><b>{summary.created}</b><span>CREATED</span></div>
                <div><b>{summary.failed}</b><span>FAILED</span></div>
              </div>

              <div className="runBar">
                <div>
                  <strong>
                    {ledger
                      ? `AWS JOB ${String(ledger.status || "").toUpperCase()}`
                      : "PREFLIGHT READY"}
                  </strong>
                  <span>
                    AWS owns row state and permanent Object + Passport identity. Created rows are terminal and are not recreated on resume.
                  </span>
                </div>

                <button
                  type="button"
                  className="primary"
                  disabled={
                    busy ||
                    preview.valid === 0 ||
                    !mapping.displayNameColumn
                  }
                  onClick={startImport}
                >
                  {busy
                    ? "PROCESSING…"
                    : ledger
                      ? "RESUME / RETRY AWS JOB"
                      : `PROVISION ${preview.valid} VALID ROWS`}
                </button>
              </div>

              <div className="tableWrap">
                <table>
                  <thead>
                    <tr>
                      <th>ROW</th>
                      <th>NAME</th>
                      <th>STATUS</th>
                      <th>OBJECT</th>
                      <th>PASSPORT</th>
                      <th>DETAIL</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.rows.map(({ row, validation }) => {
                      const rowState =
                        serverRowsByNumber.get(
                          String(row.rowNumber)
                        );

                      const status =
                        clean(
                          rowState?.status ||
                          (validation.valid
                            ? "ready"
                            : "invalid")
                        ).toLowerCase();

                      return (
                        <tr key={row.rowNumber}>
                          <td>{row.rowNumber}</td>
                          <td>{validation.displayName || "—"}</td>
                          <td>
                            <span className={`status ${status}`}>
                              {status.toUpperCase()}
                            </span>
                          </td>
                          <td>{rowState?.objectId || "—"}</td>
                          <td>{rowState?.passportId || "—"}</td>
                          <td>
                            {(
                              rowState?.error
                                ? [rowState.error]
                                : rowState?.validation?.errors ||
                                  validation.errors ||
                                  []
                            )
                              .map(item => item?.message)
                              .filter(Boolean)
                              .join(" · ") || "READY"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {fileRecord.rows.length > 100 ? (
                <div className="tableNote">
                  Preview shows first 100 rows. Preflight and AWS execution cover all {fileRecord.rows.length} rows.
                </div>
              ) : null}
            </section>
          ) : null}
        </section>
      </main>

      <Footer />

      <style jsx>{`
        :global(html), :global(body) {
          margin: 0;
          background: #090a0b;
          color: #e5e7eb;
          font-family: Inter, Arial, sans-serif;
        }
        main { min-height: 100vh; background: radial-gradient(circle at 20% 0, rgba(0,209,255,.055), transparent 28%), #090a0b; }
        .shell { width: min(1680px, 96vw); margin: 0 auto; padding: 38px 0 76px; }
        .hero { display: flex; justify-content: space-between; gap: 24px; align-items: flex-end; margin-bottom: 22px; }
        .eyebrow { color: #7DEBFF; font-size: 10px; font-weight: 900; letter-spacing: 1.1px; }
        h1 { margin: 7px 0 7px; font-size: clamp(38px, 4vw, 62px); line-height: .95; letter-spacing: -2px; }
        .hero p, .sectionCopy { max-width: 800px; color: rgba(255,255,255,.55); font-size: 13px; line-height: 1.55; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        .panel { margin-top: 14px; padding: 22px; border: 1px solid rgba(255,255,255,.075); border-radius: 14px; background: linear-gradient(180deg, rgba(255,255,255,.035), transparent), #121416; box-shadow: 0 20px 50px rgba(0,0,0,.22); }
        .panelTitle { display: flex; gap: 9px; align-items: center; color: #f2f4f5; font-size: 11px; font-weight: 950; letter-spacing: .8px; }
        .panelTitle span { color: #7DEBFF; }
        .drop { display: grid; gap: 6px; margin-top: 18px; padding: 28px; border: 1px dashed rgba(125,235,255,.35); border-radius: 12px; background: rgba(0,209,255,.025); cursor: pointer; }
        .drop input { width: 100%; }
        .drop strong { color: #7DEBFF; font-size: 13px; }
        .drop small { color: rgba(255,255,255,.45); line-height: 1.5; }
        .facts { display: grid; gap: 7px; margin-top: 16px; }
        .facts div { display: grid; grid-template-columns: 80px 1fr; gap: 10px; font-size: 10px; }
        .facts b { color: rgba(255,255,255,.38); }
        .facts span { word-break: break-all; }
        .control { display: grid; gap: 6px; margin-top: 16px; }
        .control > span { color: rgba(255,255,255,.52); font-size: 9px; font-weight: 900; letter-spacing: .55px; }
        .control.required > span { color: #7DEBFF; }
        select { width: 100%; min-height: 38px; border: 1px solid rgba(255,255,255,.1); border-radius: 8px; padding: 0 10px; background: #0d0f10; color: #e8eaeb; }
        select:disabled { opacity: .55; }
        .definitionInfo { display: grid; gap: 4px; margin-top: 15px; padding-top: 14px; border-top: 1px solid rgba(255,255,255,.06); }
        .definitionInfo span { color: rgba(255,255,255,.45); font-size: 10px; }
        .mappingGrid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; }
        .scoreboard { display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; margin-top: 18px; }
        .scoreboard div { padding: 14px; border: 1px solid rgba(255,255,255,.06); border-radius: 9px; background: #0d0f10; }
        .scoreboard b { display: block; font-size: 24px; }
        .scoreboard span { color: rgba(255,255,255,.42); font-size: 8px; font-weight: 900; letter-spacing: .5px; }
        .runBar { display: flex; justify-content: space-between; gap: 18px; align-items: center; margin-top: 18px; padding: 16px; border: 1px solid rgba(125,235,255,.13); border-radius: 10px; background: rgba(0,209,255,.025); }
        .runBar > div { display: grid; gap: 4px; }
        .runBar strong { font-size: 11px; }
        .runBar span { color: rgba(255,255,255,.46); font-size: 10px; }
        button { border: 0; cursor: pointer; font-weight: 950; letter-spacing: .45px; }
        button:disabled { opacity: .4; cursor: not-allowed; }
        .primary { min-height: 38px; padding: 0 16px; border-radius: 999px; background: #7DEBFF; color: #061013; font-size: 9px; white-space: nowrap; }
        .secondary { min-height: 34px; padding: 0 14px; border: 1px solid rgba(125,235,255,.3); border-radius: 999px; background: transparent; color: #7DEBFF; font-size: 9px; }
        .notice { margin: 10px 0; padding: 10px 13px; border: 1px solid rgba(125,235,255,.2); border-radius: 8px; background: rgba(0,209,255,.03); color: #b9f5ff; font-size: 11px; }
        .notice.error { border-color: rgba(255,90,90,.3); background: rgba(255,90,90,.04); color: #ffadad; }
        .tableWrap { overflow: auto; margin-top: 18px; border: 1px solid rgba(255,255,255,.06); border-radius: 9px; }
        table { width: 100%; min-width: 1100px; border-collapse: collapse; font-size: 9px; }
        th, td { padding: 9px 10px; border-bottom: 1px solid rgba(255,255,255,.05); text-align: left; vertical-align: top; }
        th { position: sticky; top: 0; background: #101214; color: rgba(255,255,255,.45); font-size: 8px; letter-spacing: .5px; }
        td { color: rgba(255,255,255,.7); }
        .status { display: inline-block; padding: 3px 6px; border-radius: 999px; border: 1px solid rgba(255,255,255,.1); }
        .status.created { color: #9fffc5; border-color: rgba(120,255,170,.25); }
        .status.invalid, .status.failed, .status.failed-retryable { color: #ffadad; border-color: rgba(255,90,90,.25); }
        .status.processing { color: #ffe392; border-color: rgba(255,210,80,.25); }
        .tableNote { margin-top: 8px; color: rgba(255,255,255,.36); font-size: 9px; }
        @media (max-width: 980px) {
          .grid, .mappingGrid { grid-template-columns: 1fr; }
          .scoreboard { grid-template-columns: repeat(2, 1fr); }
          .hero, .runBar { align-items: stretch; flex-direction: column; }
        }
      `}</style>
    </>
  );
}
