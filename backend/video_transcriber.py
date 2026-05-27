import subprocess
import json
import tempfile
import os
import hashlib
import threading
from groq import Groq

_cache: dict[str, str] = {}
_cache_lock = threading.Lock()


def get_transcription_context(query: str, client: Groq, timeout: int = 25) -> str:
    cache_key = hashlib.md5(query.encode()).hexdigest()

    with _cache_lock:
        if cache_key in _cache:
            return _cache[cache_key]

    result: list[str | None] = [None]

    def _run():
        try:
            context = _do_transcription(query, client)
            result[0] = context
            with _cache_lock:
                _cache[cache_key] = context
        except Exception:
            pass

    t = threading.Thread(target=_run, daemon=True)
    t.start()
    t.join(timeout=timeout)

    return result[0] or ""


def _do_transcription(query: str, client: Groq) -> str:
    urls = _search_youtube(query)
    if not urls:
        return ""

    transcriptions = []
    for url in urls[:2]:
        text = _transcribe_video(url, client)
        if text and len(text) > 30:
            transcriptions.append(text[:1200])

    if not transcriptions:
        return ""

    return "📹 תמלולים מסרטוני YouTube/TikTok:\n\n" + "\n\n---\n\n".join(transcriptions)


def _search_youtube(query: str) -> list[str]:
    try:
        result = subprocess.run(
            [
                "yt-dlp",
                f"ytsearch5:{query} dating relationship advice short",
                "--flat-playlist",
                "--dump-json",
                "--no-warnings",
            ],
            capture_output=True,
            text=True,
            timeout=15,
        )
        urls = []
        for line in result.stdout.strip().split("\n"):
            if not line:
                continue
            try:
                video = json.loads(line)
                vid_id = video.get("id", "")
                duration = video.get("duration") or 999
                if vid_id and duration <= 360:
                    urls.append(f"https://www.youtube.com/watch?v={vid_id}")
            except Exception:
                continue
        return urls
    except Exception:
        return []


def _transcribe_video(url: str, client: Groq) -> str:
    try:
        with tempfile.TemporaryDirectory() as tmpdir:
            audio_path = os.path.join(tmpdir, "audio.mp3")

            subprocess.run(
                [
                    "yt-dlp",
                    "--extract-audio",
                    "--audio-format", "mp3",
                    "--audio-quality", "9",
                    "--max-filesize", "8m",
                    "--no-playlist",
                    "--no-warnings",
                    "-o", audio_path,
                    url,
                ],
                capture_output=True,
                timeout=30,
            )

            if not os.path.exists(audio_path):
                return ""

            if os.path.getsize(audio_path) > 8 * 1024 * 1024:
                return ""

            with open(audio_path, "rb") as f:
                transcription = client.audio.transcriptions.create(
                    file=("audio.mp3", f),
                    model="whisper-large-v3",
                    response_format="text",
                    language="en",
                )

            return str(transcription).strip()
    except Exception:
        return ""
