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
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: "Habit ID is required" },
        { status: 400 },
      );
    }

    // Check if the habit exists and belongs to the user
    const habit = await prisma.habit.findFirst({
      where: {
        id,
        userId: authHeader,
      },
    });

    if (!habit) {
      return NextResponse.json(
        { error: "Habit not found or does not belong to the user" },
        { status: 404 },
      );
    }

    // Delete the habit
    await prisma.habit.delete({
      where: { id },
    });

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
    console.error("Error deleting habit:", error);
    return NextResponse.json(
      { error: "Failed to delete habit" },
      { status: 500 },
    );
  }
}
