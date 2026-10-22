/** Domain models for the Viewer read-only data layer (see GLOSSARY.md). */

export type Defense = {
  base: number;
  current: number;
  max: number;
};

export type Team = {
  id: string;
  name: string;
  color: string;
  points: number;
};

export type Region = {
  id: string;
  name: string;
};

export type Territory = {
  id: string;
  name: string;
  slug: string;
  defense: Defense;
  holdingTeamId: string | null;
  capturedAt: string | null;
  regionId: string | null;
};

export type Activity = {
  id: string;
  name: string;
  territoryId: string | null;
};

export type Task = {
  id: string;
  name: string;
  attackDiceRoll: string;
  strategy: string;
  activityId: string | null;
};

export type Player = {
  id: string;
  name: string;
  avatarUrl: string;
  rank: string;
  type: string;
  teamId: string | null;
};
