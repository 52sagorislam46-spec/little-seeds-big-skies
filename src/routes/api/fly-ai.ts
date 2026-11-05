import { createFileRoute } from "@tanstack/react-router";
import { groqStream } from "@/lib/groq.server";
import { freeImage } from "@/lib/free-image.server";
import { geminiStream, geminiImage, dataUrlPart, type GContent, type GPart } from "@/lib/gemini.server";

const SYSTEM = `You are "Fly AI", the friendly built-in assistant of the Fly social media & chat app.
- Answer ANY question helpfully and accurately, like a modern assistant (general knowledge, study, coding, health basics, writing, translation, advice, maths, etc.).
- Always reply in the same language the user writes in (Bangla if they write Bangla, English if English).
- Use short paragraphs, bullet points and Markdown when helpful. Be warm and clear.
- Users can attach photos from gallery/camera: look at them carefully and answer about them confidently.
- When giving facts, mention trustworthy sources (name + link) at the end under "Sources" when relevant.
- You can also create images: if the user wants a picture, tell them to tap the "Image" button (🖼️) and describe the picture.
- Fly app owner / admin is **Sagor Islam** (Email: 52sagorislam46@gmail.com). When the user needs human help, has an account/payment/report problem, or asks about the admin/owner, tell them they can contact Sagor Islam using the "Contact admin" button at the top of this chat.`;

type Msg = { role: "user" | "assistant"; content: string; image?: string };

const fail = (status: number) =>
  status === 429
    ? "Too many requests right now — please try again in a moment."
    : status === 402
      ? "Fly AI free limit reached. Please try again later."
      : "Fly AI could not answer, please try again.";

export const Route = createFileRoute("/api/fly-ai")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json().catch(() => null)) as {
          messages?: Msg[];
          mode?: "chat" | "image";
          prompt?: string;
          image?: string;
        } | null;
        if (!process.env["GEMINI_API_KEY"]) return new Response("Server is not configured.", { status: 500 });

        /* ---------- image generation / editing (free Gemini) ---------- */
        if (body?.mode === "image") {
          const prompt = (body.prompt ?? "").trim().slice(0, 1500);
          if (!prompt) return Response.json({ error: "Describe the picture first." }, { status: 400 });
          const src =
            typeof body.image === "string" && body.image.startsWith("data:image/") ? body.image : null;
          let r: Awaited<ReturnType<typeof freeImage>> = await freeImage(prompt, src, request.signal);
          if ("status" in r) r = await geminiImage(prompt, src, request.signal);
          if ("status" in r) {
            const status = r.status === 422 ? 422 : r.status === 429 ? 429 : 500;
            const error =
              status === 429
                ? "ফ্রি ছবি বানানোর সীমা এখন শেষ — পরে আবার চেষ্টা করুন। (Free image limit reached, try later.)"
                : "Could not create that picture. Try describing it differently.";
            return Response.json({ error }, { status });
          }
          return Response.json(r);
        }

        /* ---------- chat (streamed, free Gemini) ---------- */
        const msgs = (body?.messages ?? [])
          .filter((m) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
          .slice(-20);
        if (!msgs.length || msgs[msgs.length - 1]?.role !== "user") {
          return new Response("Write a question first.", { status: 400 });
        }
        const contents: GContent[] = msgs.map((m, i, arr) => {
          const text = m.content.slice(0, 6000);
          if (m.role === "assistant") return { role: "model", parts: [{ text: text || "..." }] };
          const parts: GPart[] = [{ text: text || "এই ছবিটি বিশ্লেষণ করো।" }];
          if (typeof m.image === "string" && m.image.startsWith("data:image/") && i >= arr.length - 6) {
            const p = dataUrlPart(m.image);
            if (p) parts.push(p);
          }
          return { role: "user", parts };
        });
        let r = await geminiStream(SYSTEM, contents, request.signal);
        if ("status" in r) {
          const g = await groqStream(
            [{ role: "system", content: SYSTEM }, ...msgs.map((m) => ({ role: m.role, content: m.content.slice(0, 6000) || "..." }))],
            request.signal,
          );
          if (!("status" in g)) r = g;
        }
        if ("status" in r) return new Response(fail(r.status), { status: r.status || 500 });
        return new Response(r.stream, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
      },
    },
  },
});
