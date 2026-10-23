import { describe, expect, it } from 'vitest';
import {
  normalizeActivities,
  normalizePlayers,
  normalizeRegions,
  normalizeTasks,
  normalizeTeams,
  normalizeTerritories,
} from './json-api';

describe('normalizeTeams', () => {
  it('maps JSON:API teams to domain Teams with string ids', () => {
    const teams = normalizeTeams({
      data: [
        {
          id: '4',
          type: 'teams',
          attributes: {
            name: "Armadyl's Aggressive Aviansies",
            color: '#1C78E0',
            points: 12,
            icon_url: 'https://cdn.example.com/armadyl.webp',
            avatar_url: 'https://cdn.example.com/armadyl-avatar.webp',
          },
        },
      ],
    });

    expect(teams).toEqual([
      {
        id: '4',
        name: "Armadyl's Aggressive Aviansies",
        color: '#1C78E0',
        points: 12,
        iconUrl: 'https://cdn.example.com/armadyl.webp',
      },
    ]);
  });

  it('treats a missing or empty icon_url as null (ignores avatar_url)', () => {
    const teams = normalizeTeams({
      data: [
        {
          id: '1',
          type: 'teams',
          attributes: {
            name: 'Goats',
            color: '#E3B833',
            points: 3,
            avatar_url: 'https://cdn.example.com/goat-avatar.webp',
          },
        },
      ],
    });

    expect(teams[0]?.iconUrl).toBeNull();
  });
});

describe('normalizeTerritories', () => {
  it('maps Defense fields and null Holding Team from capturedBy', () => {
    const territories = normalizeTerritories({
      data: [
        {
          id: '4',
          type: 'territories',
          attributes: {
            name: 'Barrows',
            slug: 'barrows',
            base_hitpoints: 8,
            current_hitpoints: 6,
            max_hitpoints: 12,
            captured_at: null,
          },
          relationships: {
            region: { data: { id: '1', type: 'regions' } },
            capturedBy: { data: null },
          },
        },
      ],
    });

    expect(territories).toEqual([
      {
        id: '4',
        name: 'Barrows',
        slug: 'barrows',
        defense: { base: 8, current: 6, max: 12 },
        holdingTeamId: null,
        capturedAt: null,
        regionId: '1',
      },
    ]);
  });

  it('resolves Holding Team from capturedBy and included teams', () => {
    const territories = normalizeTerritories({
      data: [
        {
          id: '4',
          type: 'territories',
          attributes: {
            name: 'Barrows',
            slug: 'barrows',
            base_hitpoints: 8,
            current_hitpoints: 6,
            max_hitpoints: 12,
            captured_at: '2026-10-21T12:00:00.000000Z',
          },
          relationships: {
            region: { data: { id: '1', type: 'regions' } },
            capturedBy: { data: { id: '2', type: 'teams' } },
          },
        },
      ],
      included: [
        {
          id: '2',
          type: 'teams',
          attributes: { name: 'Goats', color: '#E3B833', points: 3 },
        },
      ],
    });

    expect(territories[0]?.holdingTeamId).toBe('2');
    expect(territories[0]?.capturedAt).toBe('2026-10-21T12:00:00.000000Z');
  });
});

describe('normalizeRegions', () => {
  it('maps JSON:API regions to domain Regions', () => {
    expect(
      normalizeRegions({
        data: [{ id: '1', type: 'regions', attributes: { name: 'Morytania' } }],
      }),
    ).toEqual([{ id: '1', name: 'Morytania' }]);
  });
});

describe('normalizeActivities', () => {
  it('maps activities and their Territory relationship', () => {
    expect(
      normalizeActivities({
        data: [
          {
            id: '12',
            type: 'activities',
            attributes: { name: 'Barrows' },
            relationships: {
              territory: { data: { id: '4', type: 'territories' } },
            },
          },
        ],
      }),
    ).toEqual([{ id: '12', name: 'Barrows', territoryId: '4' }]);
  });
});

describe('normalizeTasks', () => {
  it('maps attack_roll to Attack Dice Roll and keeps strategy', () => {
    expect(
      normalizeTasks({
        data: [
          {
            id: '1',
            type: 'tasks',
            attributes: {
              name: "Pharaoh's Sceptre",
              attack_roll: '1d6+1',
              strategy: 'regular',
            },
            relationships: {
              activity: { data: { id: '53', type: 'activities' } },
            },
          },
        ],
      }),
    ).toEqual([
      {
        id: '1',
        name: "Pharaoh's Sceptre",
        attackDiceRoll: '1d6+1',
        strategy: 'regular',
        activityId: '53',
      },
    ]);
  });
});

describe('normalizePlayers', () => {
  it('maps Player fields and Team relationship', () => {
    expect(
      normalizePlayers({
        data: [
          {
            id: '3',
            type: 'players',
            attributes: {
              name: 'DionysusTask',
              avatar_url: 'https://example.com/a.webp',
              rank: 'captain',
              type: 'tasker',
            },
            relationships: {
              team: { data: { id: '3', type: 'teams' } },
            },
          },
        ],
      }),
    ).toEqual([
      {
        id: '3',
        name: 'DionysusTask',
        avatarUrl: 'https://example.com/a.webp',
        rank: 'captain',
        type: 'tasker',
        teamId: '3',
      },
    ]);
  });
});
