import { readDatabase } from "@/lib/server/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET(request: Request) {
  const encoder = new TextEncoder();
  let timer: ReturnType<typeof setInterval> | undefined;
  let lastFingerprint = "";

  const stream = new ReadableStream({
    async start(controller) {
      controller.enqueue(encoder.encode("retry: 1000\nevent: ready\ndata: {}\n\n"));
      const publish = async () => {
        try {
          const database = await readDatabase();
          const fingerprint = [
            latestTimestamp(database.projects.map((item) => item.updatedAt)),
            latestTimestamp(database.jobs.map((item) => item.updatedAt)),
            database.uploads[0]?.createdAt,
            database.prompts[0]?.createdAt,
            database.jobs.length,
            database.uploads.length
          ].join(":");
          if (fingerprint === lastFingerprint) return;
          lastFingerprint = fingerprint;
          controller.enqueue(encoder.encode(`event: studio-update\ndata: ${JSON.stringify({ fingerprint, at: Date.now() })}\n\n`));
        } catch {
          controller.enqueue(encoder.encode(": keep-alive\n\n"));
        }
      };
      await publish();
      timer = setInterval(publish, 750);
      request.signal.addEventListener("abort", () => {
        if (timer) clearInterval(timer);
        controller.close();
      }, { once: true });
    },
    cancel() {
      if (timer) clearInterval(timer);
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive"
    }
  });
}

function latestTimestamp(values: Array<string | undefined>) {
  return values.reduce<string>((latest, value) => value && value > latest ? value : latest, "");
}
