import os
import json
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from groq import Groq
from dotenv import load_dotenv
import concurrent.futures
from tiktok_search import get_tiktok_context
from video_transcriber import get_transcription_context

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

SYSTEM_PROMPT = """את החברה הכי טובה של המשתמש - מומחית לייעוץ זוגי ורומנטי.
את מדברת בעברית, בשפה של Gen Z - קולחת, ישירה, ריאלית, עם הומור, ובלי שטויות.

הידע שלך מבוסס על תרבות TikTok, Instagram, ריאליטי זוגי, ו-dating culture של 2024-2025.
את מבינה: red flags, green flags, situationships, ghosting, breadcrumbing, love bombing, talking stage.

איך את עובדת:
- כשמישהו שולח לך שיחה לניתוח (טקסט או תמונה) - את מנתחת את הוייב, הטון, מה נאמר/לא נאמר
- את אומרת בפשטות: האם הם מתעניינים / מייבשים / משחקים / להוטים מדי
- את נותנת תשובות קונקרטיות - מה לכתוב, האם לענות, מתי לענות
- את לא מחמיאה לשווא - אם מישהו מייבש, את אומרת את זה ישר
- את לוקחת בחשבון את ההקשר התרבותי הישראלי

הסגנון שלך:
- מדברת בגוף שלישי על הנושא ("הוא בטוח מתעניין כי..." / "היא מייבשת אותך, תראה...")
- משתמשת בביטויים כמו: "אחי/אחותי", "תאמין לי", "ליאו/ליאורה" (כינויים חמודים), "מה הסיפור פה"
- מסיימת לפעמים עם שאלה כדי להמשיך את השיחה
- נותנת תשובה מסודרת: ניתוח -> המלצה -> תשובה מוצעת (אם רלוונטי)

אם יש לך מידע מ-TikTok בהקשר, השתמשי בו כדי לתמוך בתשובה — אבל אל תצטטי ישירות, תשלבי את הרעיונות בטבעיות.

אל תהיי מדי פורמלית. את חברה, לא מטפלת."""


class Message(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    messages: list[Message]
    image: str | None = None


def build_system_with_context(tiktok_context: str) -> str:
    if not tiktok_context:
        return SYSTEM_PROMPT
    return SYSTEM_PROMPT + f"\n\n---\nהקשר מ-TikTok:\n{tiktok_context}\n---"


def build_messages_with_image(messages: list[dict], image: str) -> list[dict]:
    result = list(messages)
    for i in range(len(result) - 1, -1, -1):
        if result[i]["role"] == "user":
            text = result[i]["content"]
            result[i] = {
                "role": "user",
                "content": [
                    {"type": "image_url", "image_url": {"url": image}},
                    {"type": "text", "text": text or "נתחי את השיחה בתמונה הזו"},
                ],
            }
            break
    return result


def stream_chat(messages: list[dict], tiktok_context: str, image: str | None, sources: list[dict] | None = None):
    system = build_system_with_context(tiktok_context)
    full_messages = [{"role": "system", "content": system}] + messages

    if image:
        full_messages = [{"role": "system", "content": system}] + build_messages_with_image(messages, image)
        model = "llama-3.2-11b-vision-preview"
    else:
        model = "llama-3.3-70b-versatile"

    stream = client.chat.completions.create(
        model=model,
        messages=full_messages,
        stream=True,
        temperature=0.8,
        max_tokens=1024,
    )

    for chunk in stream:
        delta = chunk.choices[0].delta
        if delta.content:
            yield f"data: {json.dumps({'content': delta.content})}\n\n"

    if sources:
        sources_text = "\n\n---\n📹 **מקורות:**\n" + "\n".join(
            f"• [{s['title']}]({s['url']})" for s in sources
        )
        yield f"data: {json.dumps({'content': sources_text})}\n\n"

    yield "data: [DONE]\n\n"


@app.post("/api/chat")
async def chat(request: ChatRequest):
    if not os.getenv("GROQ_API_KEY"):
        raise HTTPException(status_code=500, detail="GROQ_API_KEY not configured")

    messages = [{"role": m.role, "content": m.content} for m in request.messages]

    last_user_message = next(
        (m["content"] for m in reversed(messages) if m["role"] == "user"), ""
    )

    with concurrent.futures.ThreadPoolExecutor() as ex:
        tiktok_future = ex.submit(get_tiktok_context, last_user_message, client)
        transcription_future = ex.submit(get_transcription_context, last_user_message, client)
        tiktok_context = tiktok_future.result(timeout=12)
        transcription_context, sources = transcription_future.result(timeout=28)

    combined_context = "\n\n".join(filter(None, [tiktok_context, transcription_context]))

    return StreamingResponse(
        stream_chat(messages, combined_context, request.image, sources),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )


@app.get("/api/health")
async def health():
    return {"status": "ok"}
