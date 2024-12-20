import {FilterType} from '../constants';
import {makeIntervalComplete} from '../utils/makeIntervalComplete';

export const filterFunctions: Record<
  FilterType,
  (
    filterValues: unknown[],
    featureValue: unknown,
    params?: Record<string, unknown>
  ) => boolean
> = {
  [FilterType.IN](filterValues, featureValue) {
    return filterValues.includes(featureValue);
  },
  [FilterType.BETWEEN]: between,
  [FilterType.TIME](filterValues, featureValue) {
    const featureValueAsTimestamp = new Date(featureValue).getTime();
    if (isFinite(featureValueAsTimestamp)) {
      return between(filterValues, featureValueAsTimestamp);
    } else {
      throw new Error(`Column used to filter by time isn't well formatted.`);
    }
  },
  [FilterType.CLOSED_OPEN]: closedOpen,
  [FilterType.STRING_SEARCH]: stringSearch,
};

// FilterTypes.BETWEEN
function between(filterValues, featureValue) {
  const checkRange = (range) => {
    const [lowerBound, upperBound] = range;
    return featureValue >= lowerBound && featureValue <= upperBound;
  };

  return makeIntervalComplete(filterValues).some(checkRange);
}

// FilterTypes.CLOSED_OPEN
function closedOpen(filterValues, featureValue) {
  const checkRange = (range) => {
    const [lowerBound, upperBound] = range;
    return featureValue >= lowerBound && featureValue < upperBound;
  };

  return makeIntervalComplete(filterValues).some(checkRange);
}

// FilterTypes.STRING_SEARCH
function stringSearch(filterValues, featureValue, params = {}) {
  const normalizedFeatureValue = normalize(featureValue, params);
  const stringRegExp = params.useRegExp
    ? filterValues
    : filterValues.map((filterValue) => {
        let stringRegExp = escapeRegExp(normalize(filterValue, params));

        if (params.mustStart) stringRegExp = `^${stringRegExp}`;
        if (params.mustEnd) stringRegExp = `${stringRegExp}$`;

        return stringRegExp;
      });

  const regex = new RegExp(
    stringRegExp.join('|'),
    params.caseSensitive ? 'g' : 'gi'
  );
  return !!normalizedFeatureValue.match(regex);
}

// Aux
const specialCharRegExp = /[.*+?^${}()|[\]\\]/g;
const normalizeRegExp = /\p{Diacritic}/gu;

function escapeRegExp(value) {
  return value.replace(specialCharRegExp, '\\$&');
}

function normalize(data, params) {
  let normalizedData = String(data);
  if (!params.keepSpecialCharacters)
    normalizedData = normalizedData
      .normalize('NFD')
      .replace(normalizeRegExp, '');

  return normalizedData;
}
