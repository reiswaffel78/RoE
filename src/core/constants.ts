// Global tuning knobs. All balancing lives here or in content/*.

export const SCHEMA_VERSION = 2;

/** Length of a full day/night cycle in simulated seconds. */
export const DAY_LENGTH = 600;

/** Width (σ) of the harmony bell curve around balance 50. */
export const HARMONY_WIDTH = 18;
/** Output multiplier range derived from harmony: MIN at h=0, MIN+SPAN at h=1. */
export const BALANCE_MULT_MIN = 0.55;
export const BALANCE_MULT_SPAN = 0.55;
/** Max output shift per essence at the extremes of the balance axis. */
export const ESSENCE_TILT = 0.25;

/** Rate constant of the balance drift towards the garden's natural target (1/s). */
export const BALANCE_DRIFT_RATE = 1 / 150;
/** How far day/night pushes the natural balance target. */
export const DAYNIGHT_BALANCE_PUSH = 4;

/** Harmony gain per second at perfect equilibrium, before scaling with output. */
export const HARMONY_BASE_RATE = 0.04;

/** Base click value: flat + share of CpS. */
export const CLICK_FLAT = 1;
export const CLICK_CPS_SHARE = 0.03;

/** Offline progress defaults (upgrades/perks raise these). */
export const OFFLINE_BASE_CAP = 8 * 3600;
export const OFFLINE_BASE_EFFICIENCY = 0.5;
export const OFFLINE_MIN_SECONDS = 30;

/** Random events. */
export const EVENT_MIN_DELAY = 150;
export const EVENT_MAX_DELAY = 360;
/** Tutorial must be past this step before random events fire. */
export const EVENT_TUTORIAL_GATE = 3;

/** Every achievement adds this much global production. */
export const ACHIEVEMENT_BONUS = 0.01;
/** Every point of ancestral wisdom adds this much global production. */
export const WISDOM_BONUS = 0.02;

/** Simulation step used when catching up large deltas (seconds). */
export const MAX_STEP = 1;
export const MAX_OFFLINE_STEP = 5;

export const LOG_LIMIT = 80;

/** Plant level thresholds that double a plant's output. */
export const PLANT_MILESTONES = [50, 100, 150, 200, 250, 300, 400, 500];

/** runChi needed for the first point of ancestral wisdom (wisdom ∝ sqrt(runChi)). */
export const WISDOM_THRESHOLD = 1e10;
