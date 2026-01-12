import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Initialize Telnyx (lazy load to avoid ESM issues)
const TELNYX_API_KEY = process.env.TELNYX_API_KEY || "";
const TELNYX_CONNECTION_ID = process.env.TELNYX_CONNECTION_ID || "";
const TELNYX_PHONE_NUMBER = process.env.TELNYX_PHONE_NUMBER || "";

// Initialize Eleven Labs
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY || "";
const ELEVENLABS_VOICE_ID = process.env.ELEVENLABS_VOICE_ID || "21m00Tcm4TlvDq8ikWAM"; // Rachel voice

let telnyx: any = null;
let elevenLabs: any = null;
let initialized = false;

// Lazy initialization to avoid module loading issues
// NOTE: Telnyx and ElevenLabs integration disabled until ESM compatibility is fixed
async function initClients() {
  if (initialized) return;
  initialized = true;

  // Integration temporarily disabled due to ESM/CJS compatibility issues
  // To enable, configure API keys in .env and uncomment the initialization code
  console.log("Call service clients not initialized (no API keys configured or ESM issue)");
}

async function initTelnyx() {
  await initClients();
  return telnyx;
}

async function initElevenLabs() {
  await initClients();
  return elevenLabs;
}

// Generate speech from text using Eleven Labs
export async function textToSpeech(text: string): Promise<Buffer | null> {
  const client = await initElevenLabs();
  if (!client) {
    console.error("Eleven Labs not configured");
    return null;
  }

  try {
    const audio = await client.textToSpeech.convert(ELEVENLABS_VOICE_ID, {
      text,
      modelId: "eleven_turbo_v2_5",
      outputFormat: "mp3_44100_128",
    });

    // Convert response to buffer - handle as ReadableStream
    if (audio instanceof ReadableStream) {
      const reader = audio.getReader();
      const chunks: Uint8Array[] = [];
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) chunks.push(value);
      }
      return Buffer.concat(chunks.map(c => Buffer.from(c)));
    }

    // If it's already a buffer-like, convert it
    return Buffer.from(audio as any);
  } catch (error) {
    console.error("Error generating speech:", error);
    return null;
  }
}

// Generate the habit check-in message
export function generateHabitCheckInMessage(
  habits: { name: string; completed: boolean }[],
  userName?: string
): string {
  const greeting = userName ? `Hey ${userName}!` : "Hey there!";
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const completedHabits = habits.filter((h) => h.completed);
  const incompleteHabits = habits.filter((h) => !h.completed);

  let message = `${greeting} It's ${today}. Let's check in on your habits. `;

  if (completedHabits.length > 0) {
    message += `Great job on completing ${completedHabits
      .map((h) => h.name)
      .join(", ")}! `;
  }

  if (incompleteHabits.length > 0) {
    message += `You still have ${incompleteHabits
      .map((h) => h.name)
      .join(", ")} to go. `;
    message += `Would you like to tell me about any of these?`;
  } else if (completedHabits.length > 0) {
    message += `You've completed all your habits for today! Amazing work!`;
  } else {
    message += `Let's get started with your habits today!`;
  }

  return message;
}

// Initiate a phone call to a user for habit check-in
export async function initiateHabitCall(userId: string): Promise<{
  success: boolean;
  callId?: string;
  error?: string;
}> {
  const telnyxClient = await initTelnyx();
  if (!telnyxClient) {
    return { success: false, error: "Telnyx not configured" };
  }

  try {
    // Fetch user with habits and today's completions
    const today = new Date();
    const todayStr = `${today.getDate().toString().padStart(2, "0")} ${today.toLocaleDateString(
      "en-US",
      { month: "short" }
    )} ${today.getFullYear()}`;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        habits: {
          include: {
            completed: {
              where: { day: todayStr },
            },
          },
        },
      },
    });

    if (!user || !user.phone) {
      return { success: false, error: "User not found or no phone number" };
    }

    if (!user.callEnabled) {
      return { success: false, error: "Calls not enabled for this user" };
    }

    // Prepare habit status
    const habits = user.habits.map((habit) => ({
      name: habit.name,
      completed: habit.completed.length > 0,
    }));

    // Generate greeting message
    const greetingMessage = generateHabitCheckInMessage(habits);

    // Generate audio using Eleven Labs
    const audioBuffer = await textToSpeech(greetingMessage);

    if (!audioBuffer) {
      return { success: false, error: "Failed to generate audio" };
    }

    // Create call log
    const callLog = await prisma.callLog.create({
      data: {
        userId,
        status: "initiated",
      },
    });

    // Initiate call via Telnyx
    const call = await telnyxClient.calls.create({
      connection_id: TELNYX_CONNECTION_ID,
      to: user.phone,
      from: TELNYX_PHONE_NUMBER,
      webhook_url: `${process.env.API_BASE_URL}/calls/webhook`,
      webhook_url_method: "POST",
      client_state: Buffer.from(
        JSON.stringify({
          callLogId: callLog.id,
          userId,
          habits,
        })
      ).toString("base64"),
    });

    // Update call log with Telnyx call ID
    await prisma.callLog.update({
      where: { id: callLog.id },
      data: { telnyxCallId: call.data.call_control_id },
    });

    return { success: true, callId: callLog.id };
  } catch (error) {
    console.error("Error initiating call:", error);
    return { success: false, error: "Failed to initiate call" };
  }
}

// Handle Telnyx webhook events
export async function handleCallWebhook(event: any): Promise<void> {
  const eventType = event.data?.event_type;
  const callControlId = event.data?.payload?.call_control_id;
  const telnyxClient = await initTelnyx();

  console.log(`Call webhook: ${eventType}`, event.data?.payload);

  switch (eventType) {
    case "call.initiated":
      // Call started, nothing to do
      break;

    case "call.answered":
      // Play the greeting when call is answered
      if (callControlId && event.data?.payload?.client_state) {
        const clientState = JSON.parse(
          Buffer.from(event.data.payload.client_state, "base64").toString()
        );

        const habits = clientState.habits || [];
        const greetingMessage = generateHabitCheckInMessage(habits);
        const audioBuffer = await textToSpeech(greetingMessage);

        if (audioBuffer && telnyxClient) {
          // For now, use Telnyx TTS as fallback (ElevenLabs would need audio hosting)
          await telnyxClient.calls.speak({
            call_control_id: callControlId,
            payload: greetingMessage,
            language: "en-US",
            voice: "female",
          });
        }
      }
      break;

    case "call.hangup":
      // Update call log when call ends
      if (event.data?.payload?.client_state) {
        const clientState = JSON.parse(
          Buffer.from(event.data.payload.client_state, "base64").toString()
        );

        if (clientState.callLogId) {
          await prisma.callLog.update({
            where: { id: clientState.callLogId },
            data: {
              status: "completed",
              endedAt: new Date(),
              duration: event.data?.payload?.duration_secs,
            },
          });
        }
      }
      break;

    case "call.speak.ended":
      // After speaking, gather input from user
      if (callControlId && telnyxClient) {
        await telnyxClient.calls.gather_using_speak({
          call_control_id: callControlId,
          payload:
            "Press 1 to mark a habit as complete, or press 2 to hear your habits again.",
          language: "en-US",
          voice: "female",
          valid_digits: "12",
          timeout_millis: 10000,
        });
      }
      break;

    case "call.gather.ended":
      // Handle user input
      const digits = event.data?.payload?.digits;
      if (callControlId && telnyxClient) {
        if (digits === "1") {
          await telnyxClient.calls.speak({
            call_control_id: callControlId,
            payload:
              "Which habit did you complete? Say the habit name after the beep.",
            language: "en-US",
            voice: "female",
          });
        } else if (digits === "2") {
          // Repeat habits
          if (event.data?.payload?.client_state) {
            const clientState = JSON.parse(
              Buffer.from(event.data.payload.client_state, "base64").toString()
            );
            const habits = clientState.habits || [];
            const message = generateHabitCheckInMessage(habits);
            await telnyxClient.calls.speak({
              call_control_id: callControlId,
              payload: message,
              language: "en-US",
              voice: "female",
            });
          }
        }
      }
      break;
  }
}

// Check if a call should be made based on user's scheduled time
export async function checkScheduledCalls(): Promise<void> {
  const now = new Date();
  const currentHour = now.getHours().toString().padStart(2, "0");
  const currentMinute = now.getMinutes().toString().padStart(2, "0");
  const currentTime = `${currentHour}:${currentMinute}`;

  // Find users who have calls enabled and their scheduled time matches
  const users = await prisma.user.findMany({
    where: {
      callEnabled: true,
      callTime: currentTime,
      phone: { not: null },
    },
  });

  for (const user of users) {
    console.log(`Initiating scheduled call for user ${user.id}`);
    await initiateHabitCall(user.id);
  }
}
