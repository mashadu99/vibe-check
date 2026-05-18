from ddgs import DDGS
from groq import Groq


def get_tiktok_context(user_message: str, client: Groq) -> str:
    query = _extract_search_query(user_message, client)
    if not query:
        return ""
    results = _search_tiktok(query)
    return _format_context(results)


def _extract_search_query(message: str, client: Groq) -> str:
    try:
        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {
                    "role": "user",
                    "content": (
                        f'Extract 3-4 English keywords to search TikTok for dating/relationship advice videos.\n'
                        f'User message: "{message}"\n'
                        f'Return ONLY the search query in English. Example: "dry texter signs red flags"\n'
                        f'Query:'
                    ),
                }
            ],
            max_tokens=25,
            temperature=0.1,
        )
        return response.choices[0].message.content.strip().strip('"\'')
    except Exception:
        return ""


def _search_tiktok(query: str, max_results: int = 6) -> list[dict]:
    try:
        ddgs = DDGS()
        return list(ddgs.text(f"site:tiktok.com {query}", max_results=max_results))
    except Exception:
        return []


def _format_context(results: list[dict]) -> str:
    if not results:
        return ""

    lines = ["📱 תוכן רלוונטי מ-TikTok (בזמן אמת):"]
    for r in results:
        title = r.get("title", "").replace(" - TikTok", "").replace("| TikTok", "").strip()
        body = r.get("body", "")[:220]
        if title:
            lines.append(f"• {title}: {body}")

    return "\n".join(lines)
