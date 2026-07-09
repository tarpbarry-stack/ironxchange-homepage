// /pages/api/passport/test-sn-engine.js

import {
  generatePassportId,
  isValidPassportId,
  normalizePassportId,
  getPassportUrl,
  IXI_PASSPORT_SN_ENGINE
} from "../../../lib/passport/ixiPassportSnEngine";

export default function handler(req, res) {
  const generated = generatePassportId();

  const samples = [
    generated,
    "IXIA8D72FK",
    "IXI-A8D72FK",
    "IXIA8D720",
    "IXIA8D72FI",
    "ABC123"
  ];

  const results = samples.map(value => {
    const normalized = normalizePassportId(value);

    return {
      input: value,
      normalized,
      valid: isValidPassportId(value),
      url: getPassportUrl(value)
    };
  });

  return res.status(200).json({
    ok: true,
    engine: {
      prefix: IXI_PASSPORT_SN_ENGINE.prefix,
      serialLength: IXI_PASSPORT_SN_ENGINE.serialLength,
      alphabet: IXI_PASSPORT_SN_ENGINE.alphabet
    },
    generated,
    generatedIsValid: isValidPassportId(generated),
    generatedUrl: getPassportUrl(generated),
    results
  });
}
