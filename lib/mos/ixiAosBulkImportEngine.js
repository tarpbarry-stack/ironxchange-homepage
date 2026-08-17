import Papa from "papaparse";

import {
  provisionAosObject
} from "./ixiAosProvisioningClient";

const BULK_LEDGER_PREFIX =
  "ixi-aos-bulk-import:v1:";

const BULK_CONCURRENCY_DEFAULT = 4;

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

function safeArray(value) {
  return Array.isArray(value)
    ? value
    : [];
}

function normalizeHeader(value) {
  return clean(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeCellValue(value) {
  if (value === undefined || value === null) {
    return "";
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (
    typeof value === "object" &&
    !Array.isArray(value)
  ) {
    if (value.result !== undefined) {
      return normalizeCellValue(value.result);
    }

    if (Array.isArray(value.richText)) {
      return value.richText
        .map(item => clean(item?.text))
        .join("");
    }

    if (value.text !== undefined) {
      return clean(value.text);
    }

    if (value.hyperlink) {
      return clean(value.text || value.hyperlink);
    }
  }

  return value;
}

async function sha256Hex(arrayBuffer) {
  if (
    typeof crypto === "undefined" ||
    !crypto.subtle
  ) {
    throw new Error(
      "Secure browser hashing is required for resumable bulk imports."
    );
  }

  const digest =
    await crypto.subtle.digest(
      "SHA-256",
      arrayBuffer
    );

  return Array.from(
    new Uint8Array(digest)
  )
    .map(value =>
      value.toString(16).padStart(2, "0")
    )
    .join("");
}

function makeUniqueHeaders(rawHeaders = []) {
  const counts = new Map();

  return rawHeaders.map((value, index) => {
    const base =
      clean(value) ||
      `COLUMN ${index + 1}`;

    const key =
      normalizeHeader(base) ||
      `column-${index + 1}`;

    const seen =
      Number(counts.get(key) || 0) + 1;

    counts.set(key, seen);

    return {
      index,
      label:
        seen === 1
          ? base
          : `${base} (${seen})`,
      key:
        seen === 1
          ? key
          : `${key}-${seen}`
    };
  });
}

function rowsFromMatrix(matrix = []) {
  const nonEmpty =
    safeArray(matrix)
      .filter(row =>
        safeArray(row).some(value =>
          clean(normalizeCellValue(value)) !== ""
        )
      );

  if (!nonEmpty.length) {
    return {
      headers: [],
      rows: []
    };
  }

  const headers =
    makeUniqueHeaders(
      nonEmpty[0].map(normalizeCellValue)
    );

  const rows =
    nonEmpty
      .slice(1)
      .map((row, offset) => {
        const values = {};

        headers.forEach(header => {
          values[header.key] =
            normalizeCellValue(
              row[header.index]
            );
        });

        return {
          rowNumber: offset + 2,
          values
        };
      });

  return {
    headers,
    rows
  };
}

async function parseCsvBuffer(arrayBuffer) {
  const text =
    new TextDecoder("utf-8")
      .decode(arrayBuffer);

  const result =
    Papa.parse(text, {
      skipEmptyLines: "greedy"
    });

  if (result.errors?.length) {
    const fatal =
      result.errors.find(error =>
        error?.type === "Quotes" ||
        error?.code === "UndetectableDelimiter"
      );

    if (fatal) {
      throw new Error(
        fatal.message ||
        "CSV parsing failed."
      );
    }
  }

  return {
    sheetName: "CSV",
    ...rowsFromMatrix(result.data)
  };
}

async function parseXlsxBuffer(arrayBuffer) {
  const ExcelJS =
    await import("exceljs");

  const Workbook =
    ExcelJS.Workbook ||
    ExcelJS.default?.Workbook;

  if (!Workbook) {
    throw new Error(
      "Excel workbook parser could not be loaded."
    );
  }

  const workbook =
    new Workbook();

  await workbook.xlsx.load(
    arrayBuffer
  );

  const worksheet =
    workbook.worksheets?.[0];

  if (!worksheet) {
    throw new Error(
      "The Excel workbook contains no worksheets."
    );
  }

  const matrix = [];

  worksheet.eachRow(
    { includeEmpty: false },
    row => {
      const values =
        Array.isArray(row.values)
          ? row.values.slice(1)
          : [];

      matrix.push(values);
    }
  );

  return {
    sheetName:
      clean(worksheet.name) ||
      "Sheet 1",
    ...rowsFromMatrix(matrix)
  };
}

export async function parseAosBulkImportFile(file) {
  if (!file) {
    throw new Error(
      "Choose a CSV or XLSX file."
    );
  }

  const filename =
    clean(file.name);

  const extension =
    filename
      .split(".")
      .pop()
      ?.toLowerCase();

  if (![
    "csv",
    "xlsx"
  ].includes(extension)) {
    throw new Error(
      "Supported bulk formats are .csv and .xlsx. Legacy .xls files must be saved as .xlsx first."
    );
  }

  const arrayBuffer =
    await file.arrayBuffer();

  const fileHash =
    await sha256Hex(arrayBuffer);

  const parsed =
    extension === "csv"
      ? await parseCsvBuffer(arrayBuffer)
      : await parseXlsxBuffer(arrayBuffer);

  if (!parsed.headers.length) {
    throw new Error(
      "No header row was found in the import file."
    );
  }

  if (!parsed.rows.length) {
    throw new Error(
      "The import file contains no data rows."
    );
  }

  return {
    contractVersion:
      "ixi-aos-bulk-import-v1",

    importId:
      `aos-import:${fileHash.slice(0, 32)}`,

    fileHash,
    filename,
    extension,
    size:
      Number(file.size || arrayBuffer.byteLength || 0),
    sheetName:
      parsed.sheetName,
    headers:
      parsed.headers,
    rows:
      parsed.rows
  };
}

export function getImportableDefinitionFields(
  definition = {}
) {
  return safeArray(
    definition?.fieldDefinitions ||
    definition?.fieldSchema
  )
    .map(field => ({
      fieldId:
        clean(
          field?.fieldId ||
          field?.field ||
          field?.key
        ),
      label:
        clean(
          field?.label ||
          field?.displayLabel ||
          field?.fieldId ||
          field?.field
        ),
      required:
        field?.required === true,
      importable:
        field?.importable !== false
    }))
    .filter(field =>
      field.fieldId &&
      field.importable
    );
}

export function createDefaultBulkMapping({
  headers = [],
  definition = null
} = {}) {
  const fieldMappings = {};
  const byNormalizedLabel = new Map();

  headers.forEach(header => {
    byNormalizedLabel.set(
      normalizeHeader(header.label),
      header.key
    );
  });

  getImportableDefinitionFields(
    definition || {}
  ).forEach(field => {
    const direct =
      byNormalizedLabel.get(
        normalizeHeader(field.fieldId)
      ) ||
      byNormalizedLabel.get(
        normalizeHeader(field.label)
      ) ||
      "";

    fieldMappings[field.fieldId] =
      direct;
  });

  return {
    displayNameColumn: "",
    businessIdentifierColumn: "",
    fieldMappings
  };
}

function getMappedValue(row, columnKey) {
  if (!columnKey) {
    return "";
  }

  return normalizeCellValue(
    row?.values?.[columnKey]
  );
}

export function validateBulkRow({
  row,
  entityId,
  definition,
  mapping
}) {
  const errors = [];

  if (!clean(entityId)) {
    errors.push({
      code: "ENTITY_REQUIRED",
      message: "AOS Entity is required."
    });
  }

  if (!definition?.definitionId) {
    errors.push({
      code: "DEFINITION_REQUIRED",
      message: "Choose an active customer object definition."
    });
  }

  const displayName =
    clean(
      getMappedValue(
        row,
        mapping?.displayNameColumn
      )
    );

  if (!displayName) {
    errors.push({
      code: "DISPLAY_NAME_REQUIRED",
      message: "The mapped object name is blank."
    });
  }

  const businessIdentifierSchema =
    safeObject(
      definition?.businessIdentifierSchema
    );

  const businessIdentifier =
    clean(
      getMappedValue(
        row,
        mapping?.businessIdentifierColumn
      )
    );

  if (
    businessIdentifierSchema.enabled !== false &&
    businessIdentifierSchema.required === true &&
    !businessIdentifier
  ) {
    errors.push({
      code: "BUSINESS_IDENTIFIER_REQUIRED",
      message:
        `${clean(businessIdentifierSchema.defaultLabel) || "Business identifier"} is required by this definition.`
    });
  }

  const fields = {};

  getImportableDefinitionFields(definition)
    .forEach(field => {
      const columnKey =
        mapping?.fieldMappings?.[field.fieldId] ||
        "";

      const value =
        getMappedValue(
          row,
          columnKey
        );

      if (
        field.required === true &&
        clean(value) === ""
      ) {
        errors.push({
          code: "REQUIRED_FIELD_MISSING",
          fieldId:
            field.fieldId,
          message:
            `${field.label || field.fieldId} is required.`
        });
      }

      if (
        columnKey &&
        value !== ""
      ) {
        fields[field.fieldId] = value;
      }
    });

  return {
    valid:
      errors.length === 0,
    errors,
    displayName,
    businessIdentifier,
    fields
  };
}

export function buildBulkProvisioningInput({
  importRecord,
  row,
  entityId,
  actorId,
  definition,
  mapping
}) {
  const validation =
    validateBulkRow({
      row,
      entityId,
      definition,
      mapping
    });

  if (!validation.valid) {
    return {
      valid: false,
      errors:
        validation.errors,
      input: null
    };
  }

  const rowKey =
    `${importRecord.importId}:row:${row.rowNumber}`;

  const identifierSchema =
    safeObject(
      definition?.businessIdentifierSchema
    );

  const businessIdentifiers =
    validation.businessIdentifier
      ? [
          {
            label:
              clean(identifierSchema.defaultLabel) ||
              "ID",
            value:
              validation.businessIdentifier
          }
        ]
      : [];

  return {
    valid: true,
    errors: [],
    rowKey,
    input: {
      entityId:
        clean(entityId),
      definitionId:
        clean(definition?.definitionId),
      definitionKey:
        clean(definition?.definitionKey) ||
        null,
      displayName:
        validation.displayName,
      businessIdentifiers,
      fields:
        validation.fields,
      media: [],
      cardTemplateSlug:
        clean(definition?.cardTemplateSlug) ||
        null,
      cardTemplateVersion:
        definition?.cardTemplateVersion ??
        null,
      source:
        "bulk-import",
      sourceReference:
        rowKey,
      draftId:
        rowKey,
      actorId:
        clean(actorId) ||
        null,
      metadata: {
        importId:
          importRecord.importId,
        importFilename:
          importRecord.filename,
        importFileHash:
          importRecord.fileHash,
        importSheetName:
          importRecord.sheetName,
        importRowNumber:
          row.rowNumber
      }
    }
  };
}

function ledgerStorageKey(importId) {
  return `${BULK_LEDGER_PREFIX}${importId}`;
}

export function loadBulkImportLedger(importId) {
  if (
    typeof window === "undefined" ||
    !importId
  ) {
    return null;
  }

  try {
    const raw =
      window.localStorage.getItem(
        ledgerStorageKey(importId)
      );

    return raw
      ? JSON.parse(raw)
      : null;
  } catch {
    return null;
  }
}

export function saveBulkImportLedger(ledger) {
  if (
    typeof window === "undefined" ||
    !ledger?.importId
  ) {
    return ledger;
  }

  window.localStorage.setItem(
    ledgerStorageKey(ledger.importId),
    JSON.stringify(ledger)
  );

  return ledger;
}

export function createBulkImportLedger({
  importRecord,
  entityId,
  definition,
  mapping
}) {
  const existing =
    loadBulkImportLedger(
      importRecord.importId
    );

  if (existing) {
    return existing;
  }

  const rows = {};

  importRecord.rows.forEach(row => {
    const validation =
      validateBulkRow({
        row,
        entityId,
        definition,
        mapping
      });

    rows[String(row.rowNumber)] = {
      rowNumber:
        row.rowNumber,
      status:
        validation.valid
          ? "READY"
          : "INVALID",
      errors:
        validation.errors,
      objectId: null,
      passportId: null,
      attempts: 0,
      updatedAt:
        new Date().toISOString()
    };
  });

  return saveBulkImportLedger({
    contractVersion:
      "ixi-aos-bulk-ledger-v1",
    importId:
      importRecord.importId,
    entityId:
      clean(entityId),
    definitionId:
      clean(definition?.definitionId),
    fileHash:
      importRecord.fileHash,
    filename:
      importRecord.filename,
    mapping,
    status: "READY",
    createdAt:
      new Date().toISOString(),
    updatedAt:
      new Date().toISOString(),
    rows
  });
}

export function summarizeBulkLedger(ledger) {
  const summary = {
    total: 0,
    ready: 0,
    processing: 0,
    created: 0,
    invalid: 0,
    failed: 0
  };

  Object.values(
    safeObject(ledger?.rows)
  ).forEach(row => {
    summary.total += 1;

    const status =
      clean(row?.status).toUpperCase();

    if (status === "READY") {
      summary.ready += 1;
    } else if (status === "PROCESSING") {
      summary.processing += 1;
    } else if (status === "CREATED") {
      summary.created += 1;
    } else if (status === "INVALID") {
      summary.invalid += 1;
    } else if (status.startsWith("FAILED")) {
      summary.failed += 1;
    }
  });

  return summary;
}

export async function executeBulkImport({
  importRecord,
  entityId,
  actorId,
  definition,
  mapping,
  ledger,
  concurrency = BULK_CONCURRENCY_DEFAULT,
  onProgress = null
}) {
  const nextLedger = {
    ...ledger,
    status: "PROCESSING",
    updatedAt:
      new Date().toISOString(),
    rows: {
      ...safeObject(ledger?.rows)
    }
  };

  saveBulkImportLedger(nextLedger);

  const queue =
    importRecord.rows.filter(row => {
      const state =
        nextLedger.rows[
          String(row.rowNumber)
        ];

      return [
        "READY",
        "FAILED_RETRYABLE"
      ].includes(
        clean(state?.status).toUpperCase()
      );
    });

  let cursor = 0;

  async function worker() {
    while (true) {
      const index = cursor;
      cursor += 1;

      if (index >= queue.length) {
        return;
      }

      const row = queue[index];
      const rowId =
        String(row.rowNumber);

      const built =
        buildBulkProvisioningInput({
          importRecord,
          row,
          entityId,
          actorId,
          definition,
          mapping
        });

      if (!built.valid) {
        nextLedger.rows[rowId] = {
          ...nextLedger.rows[rowId],
          status: "INVALID",
          errors: built.errors,
          updatedAt:
            new Date().toISOString()
        };

        saveBulkImportLedger(nextLedger);
        onProgress?.({
          ledger: { ...nextLedger },
          rowNumber:
            row.rowNumber
        });
        continue;
      }

      nextLedger.rows[rowId] = {
        ...nextLedger.rows[rowId],
        status: "PROCESSING",
        attempts:
          Number(
            nextLedger.rows[rowId]?.attempts || 0
          ) + 1,
        updatedAt:
          new Date().toISOString()
      };

      saveBulkImportLedger(nextLedger);
      onProgress?.({
        ledger: { ...nextLedger },
        rowNumber:
          row.rowNumber
      });

      try {
        const result =
          await provisionAosObject(
            built.input
          );

        nextLedger.rows[rowId] = {
          ...nextLedger.rows[rowId],
          status: "CREATED",
          errors: [],
          objectId:
            result?.identity?.objectId ||
            result?.object?.objectId ||
            null,
          passportId:
            result?.identity?.passportId ||
            result?.passport?.passportId ||
            null,
          replayed:
            result?.replayed === true,
          updatedAt:
            new Date().toISOString()
        };
      } catch (error) {
        const retryable =
          !error?.status ||
          Number(error.status) >= 500;

        nextLedger.rows[rowId] = {
          ...nextLedger.rows[rowId],
          status:
            retryable
              ? "FAILED_RETRYABLE"
              : "FAILED",
          errors: [
            {
              code:
                error?.code ||
                "AOS_BULK_ROW_FAILED",
              message:
                error?.message ||
                "Row provisioning failed."
            }
          ],
          updatedAt:
            new Date().toISOString()
        };
      }

      saveBulkImportLedger(nextLedger);
      onProgress?.({
        ledger: { ...nextLedger },
        rowNumber:
          row.rowNumber
      });
    }
  }

  const workerCount =
    Math.max(
      1,
      Math.min(
        8,
        Number(concurrency) ||
        BULK_CONCURRENCY_DEFAULT,
        queue.length || 1
      )
    );

  await Promise.all(
    Array.from(
      { length: workerCount },
      () => worker()
    )
  );

  const summary =
    summarizeBulkLedger(nextLedger);

  nextLedger.status =
    summary.failed > 0
      ? "PARTIAL"
      : summary.invalid > 0
        ? "COMPLETED_WITH_INVALID_ROWS"
        : "COMPLETED";

  nextLedger.updatedAt =
    new Date().toISOString();

  saveBulkImportLedger(nextLedger);
  onProgress?.({
    ledger: { ...nextLedger },
    rowNumber: null
  });

  return nextLedger;
}

export default {
  parseAosBulkImportFile,
  getImportableDefinitionFields,
  createDefaultBulkMapping,
  validateBulkRow,
  buildBulkProvisioningInput,
  loadBulkImportLedger,
  saveBulkImportLedger,
  createBulkImportLedger,
  summarizeBulkLedger,
  executeBulkImport
};
