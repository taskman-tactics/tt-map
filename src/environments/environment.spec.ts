import { describe, expect, it } from 'vitest';
import { environment } from './environment';
import { environment as productionEnvironment } from './environment.production';

describe('environment.apiBaseUrl', () => {
  it('defaults to the local tt-admin API for development', () => {
    expect(environment.apiBaseUrl).toBe('https://tt-admin.test/api');
    expect(environment.production).toBe(false);
  });

  it('uses the production tt-admin API in the production environment file', () => {
    expect(productionEnvironment.apiBaseUrl).toBe(
      'https://admin.taskman-tactics.win/api',
    );
    expect(productionEnvironment.production).toBe(true);
  });
});
