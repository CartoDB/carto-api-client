// Due to each data warehouse has its own behavior with columns,
// we need to normalize them and transform every key to lowercase
export function normalizeObjectKeys(el) {
  if (Array.isArray(el)) {
    return el.map(normalizeObjectKeys);
  } else if (typeof el !== 'object') {
    return el;
  }

  return Object.entries(el).reduce((acc, [key, value]) => {
    acc[key.toLowerCase()] =
      typeof value === 'object' && value ? normalizeObjectKeys(value) : value;
    return acc;
  }, {});
}

export function formatResult(res) {
  const { rows, totalCount } = res;
  const hasData = totalCount > 0;
  return { rows, totalCount, hasData };
}
