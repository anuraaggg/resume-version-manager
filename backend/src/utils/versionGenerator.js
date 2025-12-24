module.exports = function nextVersion(prev = null) {
  if (!prev) return 'v1';
  const m = prev.match(/^v(\d+)$/);
  const n = m ? parseInt(m[1], 10) + 1 : 1;
  return `v${n}`;
};
