"use client";

import { useSyncExternalStore } from "react";
import {
  getPlannerServerSnapshot,
  getPlannerSnapshot,
  subscribeToPlanner,
} from "./planner";
import { getPrepServerSnapshot, getPrepSnapshot, subscribeToPrep } from "./prep";
import {
  getPrimaryServerSnapshot,
  getPrimarySnapshot,
  subscribeToPrimary,
} from "./primary";
import {
  getTrackerServerSnapshot,
  getTrackerSnapshot,
  subscribeToTracker,
} from "./tracker";

/**
 * True once this browser holds anything a visitor would mind losing: a
 * school, a prep note, an activity, a letter, a personal statement draft or
 * a planner block. Drives the signed-out "save your work" nudges. Always
 * false during server render, so nothing flashes before hydration.
 */
export function useHasLocalWork(): boolean {
  const tracker = useSyncExternalStore(
    subscribeToTracker,
    getTrackerSnapshot,
    getTrackerServerSnapshot,
  );
  const prep = useSyncExternalStore(
    subscribeToPrep,
    getPrepSnapshot,
    getPrepServerSnapshot,
  );
  const primary = useSyncExternalStore(
    subscribeToPrimary,
    getPrimarySnapshot,
    getPrimaryServerSnapshot,
  );
  const planner = useSyncExternalStore(
    subscribeToPlanner,
    getPlannerSnapshot,
    getPlannerServerSnapshot,
  );

  return (
    tracker.schools.length > 0 ||
    Object.keys(prep.notes).length > 0 ||
    primary.experiences.length > 0 ||
    primary.letters.length > 0 ||
    primary.personalStatement.trim().length > 0 ||
    planner.events.length > 0
  );
}
