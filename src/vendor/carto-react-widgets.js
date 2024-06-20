/**
 * Due to each data warehouse has its own behavior with columns,
 * we need to normalize them and transform every key to lowercase
 * @internalRemarks Source: @carto/react-widgets
 */
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
