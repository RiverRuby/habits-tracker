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
    const { id, day } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: "Habit ID is required" },
        { status: 400 },
      );
    }

    if (!day) {
      return NextResponse.json({ error: "Day is required" }, { status: 400 });
    }

    // Check if the habit exists and belongs to the user
    const habit = await prisma.habit.findFirst({
      where: {
        id,
        userId: authHeader,
      },
      include: {
        completions: true,
      },
    });

    if (!habit) {
      return NextResponse.json(
        { error: "Habit not found or does not belong to the user" },
        { status: 404 },
      );
    }

    // Find the completion to unlog
    const completion = habit.completions.find(
      (c: Completion) => c.date === day,
    );

    if (completion) {
      // Delete the completion
      await prisma.completion.delete({
        where: { id: completion.id },
      });
    }

    // Fetch the updated list of habits to return
    const updatedUser = await prisma.user.findUnique({
      where: { id: authHeader },
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
    console.error("Error removing habit completion:", error);
    return NextResponse.json(
      { error: "Failed to remove habit completion" },
      { status: 500 },
    );
  }
}
