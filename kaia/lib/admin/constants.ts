import { DayType, ScheduleBlock } from "@/lib/admin/types";

export const DAY_TYPES: Record<number, DayType> = {
  0: "work",
  1: "light",
  2: "work",
  3: "work",
  4: "chore",
  5: "chore",
  6: "work",
};

export const DAY_LABELS: Record<DayType, string> = {
  work: "Work Day",
  light: "Light Reset",
  chore: "Chore Day",
};

export const XP_VALUES = {
  BLOCK_COMPLETE: 25,
  DAILY_CHECKIN: 50,
  CHORE_COMPLETE: 15,
  FULL_DAY_CLEAR: 100,
  STREAK_BONUS_7: 200,
  STREAK_BONUS_14: 500,
};

export const LEVELS = [
  { name: "Spore", xp: 0 },
  { name: "Seedling", xp: 200 },
  { name: "Mycelium", xp: 500 },
  { name: "Fruiting Body", xp: 1000 },
  { name: "Network", xp: 2000 },
  { name: "Ecosystem", xp: 4000 },
  { name: "Symbiont", xp: 7000 },
  { name: "Architect", xp: 12000 },
];

export const KAIA_MESSAGES = {
  morning: [
    "Let's get it. Clock in and dominate.",
    "New day, new streak. Small action first.",
    "Rise and flow. One block at a time.",
  ],
  streak: [
    "Consistency is the hard part and you're doing it.",
    "Your streak is alive. Feed it.",
    "Every check-in is a vote for the future.",
  ],
  broken: [
    "Reset is not failure. Start again today.",
    "Yesterday is done. Today is available.",
    "Re-entry counts. Tiny wins count.",
  ],
  choreDone: [
    "Chore complete. Earned downtime.",
    "Checklist crushed. Do not invent new tasks.",
    "Done means done. Protect your evening.",
  ],
  evening: [
    "Clock out mid-sentence if needed.",
    "You are home now. Be here.",
    "Laptop closed. Partner time.",
  ],
};

export function getKaiaMessage(type: keyof typeof KAIA_MESSAGES) {
  const bucket = KAIA_MESSAGES[type] ?? KAIA_MESSAGES.morning;
  return bucket[Math.floor(Math.random() * bucket.length)];
}

export const WORK_SCHEDULE: ScheduleBlock[] = [
  { time: "9:00", title: "Wake Up & Fuel", dur: "35 min", desc: "Breakfast and prep.", type: "together", tags: ["TOGETHER"] },
  { time: "9:35", title: "Exercise 1 — Commute Walk", dur: "10 min", desc: "Quick walk and reset.", type: "exercise", tags: ["WALK"], compact: true },
  { time: "10:00", title: "Work Block One", dur: "4 hrs", desc: "Primary sprint for hardest tasks.", type: "work", tags: ["DEEP WORK"] },
  { time: "2:00", title: "Lunch", dur: "40 min", desc: "Eat away from desk.", type: "break", tags: ["TOGETHER"] },
  { time: "2:40", title: "Exercise 2 — Cardio", dur: "10 min", desc: "Move blood, restore focus.", type: "exercise", tags: ["CARDIO"], compact: true },
  { time: "2:50", title: "Chores & Reset", dur: "1h 10m", desc: "2-3 chores max, then stop.", type: "break", tags: ["CHORES"] },
  { time: "4:00", title: "Work Block Two", dur: "4 hrs", desc: "Second sprint for lighter execution.", type: "work", tags: ["COLLAB"] },
  { time: "8:00", title: "Clock Out", dur: "5 min", desc: "Hard stop. Save and close.", type: "together", tags: ["HARD STOP"], compact: true },
  { time: "8:15", title: "You're Home", dur: "~3h45m", desc: "Dinner and quality time.", type: "off", tags: ["OFF CLOCK"] },
  { time: "12:00a", title: "Self-Care", dur: "<= 1 hr", desc: "Shower, skincare, teeth.", type: "selfcare", tags: ["NON-NEGOTIABLE"] },
];

export const MONDAY_SCHEDULE: ScheduleBlock[] = [
  { time: "9:00", title: "Wake Up & Breakfast", dur: "45 min", desc: "Slow reset morning.", type: "together", tags: ["TOGETHER"] },
  { time: "9:45", title: "Exercise 1 — Walk", dur: "10 min", desc: "Just move.", type: "exercise", tags: ["WALK"], compact: true },
  { time: "10:00", title: "Light Chores", dur: "2 hrs", desc: "Quick maintenance only.", type: "chore", tags: ["DONE= DONE"] },
  { time: "12:00", title: "Free Time", dur: "rest of day", desc: "No work mode.", type: "off", tags: ["NO WORK"] },
  { time: "12:00a", title: "Self-Care", dur: "<= 1 hr", desc: "Same routine every night.", type: "selfcare", tags: ["NON-NEGOTIABLE"] },
];

export const CHORE_SCHEDULE: ScheduleBlock[] = [
  { time: "9:00", title: "Wake Up & Breakfast", dur: "45 min", desc: "Review checklist together.", type: "together", tags: ["REVIEW"] },
  { time: "9:45", title: "Exercise 1 — Walk", dur: "10 min", desc: "Prime for chore blocks.", type: "exercise", tags: ["WALK"], compact: true },
  { time: "10:00", title: "Chore Block — Morning", dur: "3 hrs", desc: "Deep cleaning + prep.", type: "chore", tags: ["DEEP CLEAN"] },
  { time: "1:00", title: "Lunch", dur: "45 min", desc: "Refuel and reset.", type: "break", tags: ["TOGETHER"] },
  { time: "2:00", title: "Chore Block — Afternoon", dur: "3 hrs", desc: "Finish list and stop.", type: "chore", tags: ["ERRANDS"] },
  { time: "5:15", title: "Early Evening", dur: "~6h45m", desc: "Long downtime together.", type: "off", tags: ["EARNED"] },
  { time: "12:00a", title: "Self-Care", dur: "<= 1 hr", desc: "Midnight routine.", type: "selfcare", tags: ["NON-NEGOTIABLE"] },
];

export function getScheduleByDayType(dayType: DayType) {
  if (dayType === "work") {
    return WORK_SCHEDULE;
  }
  if (dayType === "light") {
    return MONDAY_SCHEDULE;
  }
  return CHORE_SCHEDULE;
}
