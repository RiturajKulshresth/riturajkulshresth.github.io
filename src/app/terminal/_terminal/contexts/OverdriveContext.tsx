/* eslint-disable */
// @ts-nocheck
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Global overdrive state for the terminal shell.
 * Provides a draining/recharging stamina reserve, speedMul for visualizers, and
 * syncs urgent audio voicing via synth.setOverdrive().
 */

import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
  } from "react";
  import { synth } from "../audio";
  
  // Stamina is a 0..100 reserve. Overdrive burns it while engaged and it slowly
  // recovers while idle. Draining fully forces a cooldown until it recharges past
  // REENGAGE_AT so you can't immediately re-arm an empty reactor.
  const DRAIN_PER_SEC = 100 / 9; // ~9s of overdrive empties a full bar
  const CHARGE_PER_SEC = 100 / 15; // ~15s idle to fully recharge
  const REENGAGE_AT = 35; // after a full drain, must recover to this % to re-arm
  const COMMIT_MS = 60; // throttle React commits so consumers don't churn at 60fps
  
  interface OverdriveContextValue {
    overdrive: boolean;
    setOverdrive: (value: boolean) => void;
    toggleOverdrive: () => void;
    // Convenience multiplier so visualizers can simply do
    //   const speed = baseSpeed * speedMul
    // without having to branch on the boolean themselves.
    speedMul: number;
    // True while the reserve is empty and locked out until it recharges.
    depleted: boolean;
  }
  
  const OverdriveContext = createContext<OverdriveContextValue | undefined>(undefined);
  // Stamina lives in its own context so high-frequency updates only re-render the
  // few components that actually display the bar (the toggle button), not every
  // visualizer that reads the overdrive boolean.
  const StaminaContext = createContext<number>(100);
  
  export function OverdriveProvider({ children }: { children: React.ReactNode }) {
    const [overdrive, setOverdriveState] = useState(false);
    const [depleted, setDepleted] = useState(false);
    const [stamina, setStamina] = useState(100);
  
    // Live mirrors so the rAF loop reads current values without re-subscribing.
    const overdriveRef = useRef(overdrive);
    const depletedRef = useRef(depleted);
    const staminaRef = useRef(stamina);
    overdriveRef.current = overdrive;
    depletedRef.current = depleted;
  
    const setOverdrive = useCallback((value: boolean) => {
      if (value) {
        // Refuse to engage on an empty / locked reserve.
        if (depletedRef.current || staminaRef.current <= 1) return;
      }
      setOverdriveState(value);
    }, []);
  
    const toggleOverdrive = useCallback(() => {
      setOverdrive(!overdriveRef.current);
    }, [setOverdrive]);
  
    // Keep the audio engine's urgent voicing in lockstep with overdrive.
    useEffect(() => {
      synth.setOverdrive(overdrive);
    }, [overdrive]);
  
    // Stamina drain / recharge loop.
    useEffect(() => {
      let raf = 0;
      let last = performance.now();
      let lastCommit = 0;
  
      const tick = (now: number) => {
        const dt = Math.min(0.1, (now - last) / 1000);
        last = now;
  
        let s = staminaRef.current;
        if (overdriveRef.current) {
          s -= DRAIN_PER_SEC * dt;
          if (s <= 0) {
            s = 0;
            setOverdriveState(false); // auto-disengage when empty
            setDepleted(true);
          }
        } else {
          if (s < 100) s = Math.min(100, s + CHARGE_PER_SEC * dt);
          if (depletedRef.current && s >= REENGAGE_AT) setDepleted(false);
        }
        staminaRef.current = s;
  
        if (now - lastCommit >= COMMIT_MS) {
          lastCommit = now;
          setStamina(s);
        }
        raf = requestAnimationFrame(tick);
      };
  
      raf = requestAnimationFrame(tick);
      return () => cancelAnimationFrame(raf);
    }, []);
  
    const value = useMemo<OverdriveContextValue>(
      () => ({
        overdrive,
        setOverdrive,
        toggleOverdrive,
        speedMul: overdrive ? 2.6 : 1.0,
        depleted,
      }),
      [overdrive, depleted, setOverdrive, toggleOverdrive]
    );
  
    return (
      <OverdriveContext.Provider value={value}>
        <StaminaContext.Provider value={stamina}>{children}</StaminaContext.Provider>
      </OverdriveContext.Provider>
    );
  }
  
  export function useOverdrive(): OverdriveContextValue {
    const ctx = useContext(OverdriveContext);
    if (!ctx) {
      // Graceful fallback for components mounted outside the provider (e.g.
      // unit tests). Acts as if overdrive is permanently off.
      return {
        overdrive: false,
        setOverdrive: () => {},
        toggleOverdrive: () => {},
        speedMul: 1.0,
        depleted: false,
      };
    }
    return ctx;
  }
  
  // Current stamina reserve, 0..100. Only subscribe where you render the bar.
  export function useStamina(): number {
    return useContext(StaminaContext);
  }
  