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
  if (typeof navigator !== "undefined") {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        console.log(`"${text}" copied to clipboard`);
      })
      .catch((err) => {
        console.error("Error copying text: ", err);
      });
  }
};

export const syncCode = (code: string) => {
  if (typeof localStorage !== "undefined") {
    localStorage.setItem("ID", code);
  }
};

export const getLast365Days = () => {
  const days: string[] = [];
  const today = new Date();

  for (let i = 364; i >= 0; i--) {
    const date = new Date();
    date.setDate(today.getDate() - i);

    const dayOfWeek = date.toLocaleDateString("en-US", { weekday: "short" });
    const day = date.getDate();
    const month = date.toLocaleDateString("en-US", { month: "short" });
    const year = date.getFullYear();

    days.push(`${dayOfWeek} ${day} ${month} ${year}`);
  }

  // Fill with filler days to complete the grid
  const dayOfWeek = new Date(
    today.getTime() - 364 * 24 * 60 * 60 * 1000,
  ).getDay();
  for (let i = 0; i < dayOfWeek; i++) {
    days.unshift("FILLER");
  }

  return days;
};

export const parseDate = (dateStr: string): Date => {
  const [_, day, month, year] = dateStr.split(" ");
  const parsedDate = new Date(`${day} ${month} ${year}`);
  if (isNaN(parsedDate.getTime())) {
    throw new Error(`Invalid date format: ${dateStr}`);
  }
  return parsedDate;
};

export const calculateStreaks = (completedDays: string[]) => {
  const dates = completedDays
    .map(parseDate)
    .sort((a, b) => a.getTime() - b.getTime());

  let longestStreak = 0;
  let currentStreak = 0;
  let lastDate: Date | null = null;

  dates.forEach((date) => {
    if (lastDate) {
      const diffDays = Math.round(
        (date.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24),
      );
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
  const theLastDate = dates[dates.length - 1];

  const diffLastDate = theLastDate
    ? Math.round(
        (now.getTime() - theLastDate.getTime()) / (1000 * 60 * 60 * 24),
      )
    : Infinity;

  if (diffLastDate >= 2) {
    currentStreak = 0;
  }

  return { currentStreak, longestStreak };
};
