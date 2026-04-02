"use client";

import { useEffect, useRef } from "react";
import { DayType } from "@/lib/admin/types";

type Alarm = {
  id: string;
  time: string;
  text: string;
};

const ALARMS: Record<DayType, Alarm[]> = {
  work: [
    { id: "commute", time: "09:35", text: "Commute time. Walk the property." },
    { id: "lunch", time: "14:00", text: "Lunch. Step away from the desk." },
    { id: "cardio", time: "14:40", text: "Cardio time. 10 minutes. Go." },
    { id: "clockout", time: "20:00", text: "CLOCK OUT. Mid-sentence. Save and shut." },
    { id: "selfcare", time: "00:00", text: "Self-care. Shower -> Skincare -> Teeth." },
  ],
  light: [
    { id: "walk", time: "09:45", text: "Morning walk reset." },
    { id: "selfcare", time: "00:00", text: "Self-care routine starts now." },
  ],
  chore: [
    { id: "walk", time: "09:45", text: "Walk before chore blocks." },
    { id: "afternoon", time: "14:00", text: "Afternoon chore block starts now." },
    { id: "selfcare", time: "00:00", text: "Self-care routine starts now." },
  ],
};

function todayKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function fireNotification(text: string) {
  if (!("Notification" in window) || Notification.permission !== "granted") {
    return;
  }
  new Notification("KAIA", { body: text });
}

export function useAlarms(dayType: DayType) {
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!("Notification" in window)) {
      return;
    }
    if (Notification.permission === "default") {
      void Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    timerRef.current = setInterval(() => {
      const now = new Date();
      const hhmm = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
      for (const alarm of ALARMS[dayType]) {
        if (alarm.time !== hhmm) {
          continue;
        }
        const seenKey = `kaia-admin-alarm-${todayKey()}-${alarm.id}`;
        if (window.sessionStorage.getItem(seenKey)) {
          continue;
        }
        window.sessionStorage.setItem(seenKey, "1");
        fireNotification(alarm.text);
      }
    }, 20_000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [dayType]);
}
