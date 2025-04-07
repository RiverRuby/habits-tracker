import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

interface Completion {
  id: string;
  date: string;
  habitId: string;
}

interface Habit {
  id: string;
  name: string;
  createdAt: Date;
  userId: string;
  completions: Completion[];
}

export async function GET(request: Request) {
  try {
    // Get the user ID from the Authorization header
    const authHeader = request.headers.get("Authorization");

    if (!authHeader) {
      return NextResponse.json(
        { error: "Authorization header is required" },
        { status: 401 },
      );
    }

    // Get or create user
    let user = await prisma.user.findUnique({
      where: { id: authHeader },
      include: {
        habits: {
          include: {
            completions: true,
          },
        },
      },
    });

    // If user doesn't exist, create a new one
    if (!user) {
      user = await prisma.user.create({
        data: {
          id: authHeader,
        },
        include: {
          habits: {
            include: {
              completions: true,
            },
          },
        },
      });
    }

    // Transform the data to match the expected format
    const habits = user.habits.map((habit: Habit) => ({
      id: habit.id,
      name: habit.name,
      created: habit.createdAt.getTime(),
      completed: habit.completions.map(
        (completion: Completion) => completion.date,
      ),
    }));

    return NextResponse.json({
      id: user.id,
      created: user.createdAt.getTime(),
      habits,
    });
  } catch (error) {
    console.error("Error fetching habits:", error);
    return NextResponse.json(
      { error: "Failed to fetch habits" },
      { status: 500 },
    );
  }
}
