// DEPRECATED: Not used in current implementation.
// App uses numeric versioning (1, 2, 3) instead of string versions (v1, v2, v3).
// Can be safely removed.

module.exports = function nextVersion(prev = null) {
  if (!prev) return 'v1';
  const m = prev.match(/^v(\d+)$/);
  const n = m ? parseInt(m[1], 10) + 1 : 1;
  return `v${n}`;
};
