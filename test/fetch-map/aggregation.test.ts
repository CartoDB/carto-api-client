import {describe, test, expect} from 'vitest';
import {compileCustomAggregation} from '@carto/api-client';

describe('aggregation', () => {
  describe('compileCustomAggregation', () => {
    test('produces alias matching /^custom_agg_[0-9a-f]{8}$/ for bigquery', () => {
      const alias = compileCustomAggregation('SUM(revenue) / SUM(users)', {
        provider: 'bigquery',
      });
      expect(alias).toMatch(/^custom_agg_[0-9a-f]{8}$/);
    });

    test.each([
      {provider: 'bigquery'},
      {provider: 'postgres'},
      {provider: 'redshift'},
      {provider: 'databricks'},
      {provider: 'carto'},
      {provider: 'carto_dw'},
    ] as const)(
      'produces lowercase alias for provider $provider',
      ({provider}) => {
        const alias = compileCustomAggregation('SUM(a) / SUM(b)', {provider});
        expect(alias).toMatch(/^custom_agg_[0-9a-f]{8}$/);
      }
    );

    test('produces uppercase alias for snowflake', () => {
      const alias = compileCustomAggregation('SUM(revenue) / SUM(users)', {
        provider: 'snowflake',
      });
      expect(alias).toMatch(/^CUSTOM_AGG_[0-9A-F]{8}$/);
    });

    test('normalizes whitespace: leading and trailing spaces', () => {
      const trimmed = compileCustomAggregation('SUM(x) / SUM(y)', {
        provider: 'bigquery',
      });
      const padded = compileCustomAggregation('  SUM(x) / SUM(y)  ', {
        provider: 'bigquery',
      });
      expect(padded).toBe(trimmed);
    });

    test('normalizes whitespace: multiple internal spaces', () => {
      const normal = compileCustomAggregation('SUM(x) / SUM(y)', {
        provider: 'bigquery',
      });
      const spaced = compileCustomAggregation('SUM(x)  /  SUM(y)', {
        provider: 'bigquery',
      });
      expect(spaced).toBe(normal);
    });

    test('normalizes whitespace: tabs', () => {
      const normal = compileCustomAggregation('SUM(x) / SUM(y)', {
        provider: 'bigquery',
      });
      const tabbed = compileCustomAggregation('SUM(x)\t/\tSUM(y)', {
        provider: 'bigquery',
      });
      expect(tabbed).toBe(normal);
    });

    test('throws on empty expression', () => {
      expect(() =>
        compileCustomAggregation('', {provider: 'bigquery'})
      ).toThrow();
    });

    test('throws on whitespace-only expression', () => {
      expect(() =>
        compileCustomAggregation('   ', {provider: 'bigquery'})
      ).toThrow();
    });

    test('produces same output for same input', () => {
      const a = compileCustomAggregation('SUM(revenue) / SUM(users)', {
        provider: 'bigquery',
      });
      const b = compileCustomAggregation('SUM(revenue) / SUM(users)', {
        provider: 'bigquery',
      });
      expect(a).toBe(b);
    });

    test('different expressions produce different aliases', () => {
      const a = compileCustomAggregation('SUM(revenue) / SUM(users)', {
        provider: 'bigquery',
      });
      const b = compileCustomAggregation('AVG(price) * COUNT(*)', {
        provider: 'bigquery',
      });
      expect(a).not.toBe(b);
    });
  });
});
