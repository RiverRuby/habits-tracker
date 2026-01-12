export const getLast365Days = () => {
  const days = [];
  const fillers = [];
  const today = new Date();

  for (let i = 0; i < 365; i++) {
    const day = new Date(today);
    day.setDate(today.getDate() - i);

    const dayName = day.toLocaleString("en-US", { weekday: "short" });
    const monthName = day.toLocaleString("en-US", { month: "short" });

    days.push(
      `${dayName}, ${day.getDate()} ${monthName}, ${day.getFullYear()}`,
    );
  }

  // "FILLER" entries to start the week on Sunday
  const firstDay = new Date(today);
  firstDay.setDate(today.getDate() - 364);
  const firstDayIndex = firstDay.getDay();

  for (let i = 0; i < firstDayIndex; i++) {
    fillers.push("FILLER");
  }

  return [...days, ...fillers];
};

export const generateRandomString = (length = 16) => {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    result += characters[randomIndex];
  }
  return result;
};

export const copyToClipboard = (text: string) => {
  navigator.clipboard
    .writeText(text)
    .then(() => {
      console.log(`"${text}" copied to clipboard`);
    })
    .catch((err) => {
      console.error("Error copying text: ", err);
    });
};

export const syncCode = (code: string) => {
  localStorage.setItem("ID", code);
};

export const parseDate = (dateStr: string): Date => {
  // Handle both formats:
  // Classic: "Wed, 8 Jan, 2026" (weekday, day month, year)
  // DB: "07 Jan 2026" (day month year)
  const parts = dateStr.split(" ");

  let parsedDate: Date;
  if (parts.length === 4) {
    // Classic format: "Wed, 8 Jan, 2026"
    const [_, day, month, year] = parts;
    parsedDate = new Date(`${day} ${month} ${year}`);
  } else if (parts.length === 3) {
    // DB format: "07 Jan 2026"
    const [day, month, year] = parts;
    parsedDate = new Date(`${day} ${month} ${year}`);
  } else {
    throw new Error(`Invalid date format: ${dateStr}`);
  }

  if (isNaN(parsedDate.getTime())) {
    throw new Error(`Invalid date format: ${dateStr}`);
  }
  return parsedDate;
};

export const calculateStreaks = (completedDays: string[]) => {
  console.log(completedDays);
  const dates = completedDays
    .map(parseDate)
    .sort((a, b) => a.getTime() - b.getTime());
  console.log(dates);

  let longestStreak = 0;
  let currentStreak = 0;
  let lastDate: Date | null = null;

  dates.forEach((date) => {
    if (lastDate) {
      const diffDays =
        (date.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24);
      if (diffDays === 1) {
        currentStreak++;
      } else if (diffDays > 1) {
        currentStreak = 1;
      }
    } else {
      currentStreak = 1;
    }

    if (currentStreak > longestStreak) {
      longestStreak = currentStreak;
    }

    lastDate = date;
  });

  const now = new Date();
  console.log(`Now: ${now}, Last date: ${lastDate}`);
  const theLastDate = dates[dates.length - 1]; // HOLY SHIT THIS IS BAD

  const diffLastDate = theLastDate
    ? (now.getTime() - theLastDate.getTime()) / (1000 * 60 * 60 * 24)
    : Infinity;

  if (diffLastDate >= 2) {
    currentStreak = 0;
  }

  console.log(
    `Current Streak: ${currentStreak}, Longest Streak: ${longestStreak}`,
  );

  return { currentStreak, longestStreak };
};
