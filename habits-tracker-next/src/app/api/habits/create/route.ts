import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

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

export async function POST(request: Request) {
  try {
    // Get the user ID from the Authorization header
    const authHeader = request.headers.get("Authorization");

    if (!authHeader) {
      return NextResponse.json(
        { error: "Authorization header is required" },
        { status: 401 },
      );
    }

    // Parse the request body
    const { name } = await request.json();

    if (!name) {
      return NextResponse.json(
        { error: "Habit name is required" },
        { status: 400 },
      );
    }

    // Get or create user
    let user = await prisma.user.findUnique({
      where: { id: authHeader },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          id: authHeader,
        },
      });
    }

    // Create the habit
    await prisma.habit.create({
      data: {
        name,
        userId: user.id,
      },
    });

    // Fetch the updated list of habits to return
    const updatedUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        habits: {
          include: {
            completions: true,
          },
        },
      },
    });

    if (!updatedUser) {
      return NextResponse.json(
        { error: "Failed to fetch updated habits" },
        { status: 500 },
      );
    }

    // Transform the data to match the expected format
    const habits = updatedUser.habits.map((habit: Habit) => ({
      id: habit.id,
      name: habit.name,
      created: habit.createdAt.getTime(),
      completed: habit.completions.map(
        (completion: Completion) => completion.date,
      ),
    }));

    return NextResponse.json({
      id: updatedUser.id,
      created: updatedUser.createdAt.getTime(),
      habits,
    });
  } catch (error) {
    console.error("Error creating habit:", error);
    return NextResponse.json(
      { error: "Failed to create habit" },
      { status: 500 },
    );
  }
}
