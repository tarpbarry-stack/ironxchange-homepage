function clean(value) { return String(value ?? "").trim(); }

function summarizeMediaJobs(jobs = []) {
  const summary = { total: 0, complete: 0, partial: 0, failed: 0, queued: 0, processing: 0, unknown: 0 };
  const failures = [];

  for (const job of Array.isArray(jobs) ? jobs : []) {
    summary.total += 1;
    const status = clean(job.status).toLowerCase();
    if (Object.prototype.hasOwnProperty.call(summary, status)) summary[status] += 1;
    else summary.unknown += 1;

    if (status === "failed" || (status === "partial" && Number(job.processedPhotoCount || 0) === 0)) {
      failures.push({
        jobId: clean(job.jobId),
        machineId: clean(job.machineId),
        passportId: clean(job.passportId),
        status,
        error: clean(job.error),
        processedPhotoCount: Number(job.processedPhotoCount || 0),
        sourceType: clean(job.sourceType),
        sourceUrl: clean(job.sourceUrl)
      });
    }
  }

  return { generatedAt: new Date().toISOString(), summary, failures, healthy: failures.length === 0 };
}

module.exports = { summarizeMediaJobs };
