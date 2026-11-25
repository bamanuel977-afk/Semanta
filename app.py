"""SEMANTA server.

The web app in ./web is a complete offline-first PWA: search, topics, learning and saved words all run in
the browser with no server. This small Flask server only does two extra things:

  * serves the app (with pre-compressed data files), and
  * /api/tts - spoken audio for Amharic, Afaan Oromo, Arabic (and Tigrinya/Somali) when the device has no voice;
    saved in data/tts/ so each word is fetched only once, and the browser keeps it for offline use.
  * /api/translate - online translation for words that have no hand-made translation yet.
    Uses Gemini if GEMINI_API_KEY is set (best quality for Amharic/Oromo/Tigrinya), else the free MyMemory service.
    Every answer is cached in data/cache.db so each word is translated only once.

Run:  python app.py        then open http://127.0.0.1:5000
"""
import base64
import hashlib
import json
import os
import sqlite3
import time
from pathlib import Path

import requests
from flask import Flask, Response, jsonify, request, send_from_directory

ROOT = Path(__file__).parent
WEB = ROOT / "web"
DB_PATH = ROOT / "data" / "cache.db"
GEMINI_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-flash-latest")
LANG_NAMES = {"en": "English", "am": "Amharic", "om": "Afaan Oromo", "ti": "Tigrinya", "so": "Somali", "ar": "Arabic", "fr": "French",
              "sw": "Swahili", "es": "Spanish", "de": "German"}

TTS_DIR = ROOT / "data" / "tts"
# Voice to try for each language, best first. Afaan Oromo has no native online voice, so it falls back to Swahili,
# which reads Latin letters with similar clean vowels (approximate, and the app says so).
TTS_CHAIN = {"am": ["am"], "ar": ["ar"], "om": ["om", "sw"], "ti": ["ti", "am"], "so": ["so", "sw"]}

app = Flask(__name__, static_folder=None)


# ---------------------------------------------------------------- cache
def cache_db():
    conn = sqlite3.connect(DB_PATH)
    conn.execute("CREATE TABLE IF NOT EXISTS tr (text TEXT, lang TEXT, result TEXT, engine TEXT, PRIMARY KEY (text, lang))")
    return conn


# ---------------------------------------------------------------- engines
def gemini(text, lang, src="en"):
    prompt = (f"Translate this {LANG_NAMES[src]} word or phrase into {LANG_NAMES[lang]}: \"{text}\"\n"
              "Give the most common everyday translation, in the language's normal script "
              "(Ge'ez script for Amharic and Tigrinya, Latin letters for Afaan Oromo). The input may be written in Latin letters (transliterated); understand it anyway. "
              "If there are several common senses, give up to three separated by ' / '. Reply with ONLY the translation.")
    r = requests.post(f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent",
                      headers={"x-goog-api-key": GEMINI_KEY, "Content-Type": "application/json"},
                      json={"contents": [{"parts": [{"text": prompt}]}], "generationConfig": {"temperature": 0.1}},
                      timeout=25)
    r.raise_for_status()
    out = r.json()["candidates"][0]["content"]["parts"][0]["text"].strip().strip("\"'“”")
    if not out:
        raise ValueError("empty")
    return out, "Gemini"


def gtx(text, lang, src="en"):
    r = requests.get("https://translate.googleapis.com/translate_a/single", timeout=15, headers={"User-Agent": "Mozilla/5.0"},
                     params={"client": "gtx", "sl": src, "tl": lang, "dt": "t", "q": text})
    r.raise_for_status()
    out = "".join(part[0] for part in r.json()[0] if part and part[0]).strip()
    if not out:
        raise ValueError("empty")
    return out, "Google"


def mymemory(text, lang, src="en"):
    r = requests.get("https://api.mymemory.translated.net/get", params={"q": text, "langpair": f"{src}|{lang}"}, timeout=20)
    data = r.json()
    out = (data.get("responseData") or {}).get("translatedText") or ""
    if data.get("responseStatus") != 200 or not out or "MYMEMORY WARNING" in out.upper():
        raise ValueError("MyMemory unavailable or limit reached")
    return out.strip(), "MyMemory"


# ---------------------------------------------------------------- tiny rate limit (per IP, per minute)
_hits = {}


def too_many():
    now, ip = time.time(), request.remote_addr
    _hits[ip] = [t for t in _hits.get(ip, []) if now - t < 60] + [now]
    return len(_hits[ip]) > 60


# ---------------------------------------------------------------- routes
@app.get("/api/health")
def health():
    return jsonify(ok=True, translate="gemini" if GEMINI_KEY else "mymemory")


@app.post("/api/translate")
def translate():
    data = request.get_json(silent=True) or {}
    text, lang = " ".join(str(data.get("text", "")).split())[:120], data.get("lang")
    src = data.get("src") if data.get("src") in LANG_NAMES else "en"
    if not text or lang not in LANG_NAMES or lang == src:
        return jsonify(error="Send a word and a supported language."), 400
    if too_many():
        return jsonify(error="Too many requests. Wait a minute."), 429
    ckey = text.lower() if src == "en" else f"{src}:{text.lower()}"
    with cache_db() as conn:
        row = conn.execute("SELECT result, engine FROM tr WHERE text = ? AND lang = ?", (ckey, lang)).fetchone()
        if row:
            return jsonify(text=row[0], engine=row[1], cached=True)
        errors = []
        for engine in ([gemini] if GEMINI_KEY else []) + [gtx, mymemory]:
            try:
                result, name = engine(text, lang, src)
                conn.execute("INSERT OR REPLACE INTO tr VALUES (?, ?, ?, ?)", (ckey, lang, result, name))
                return jsonify(text=result, engine=name)
            except Exception as exc:                                    # try the next engine
                errors.append(str(exc))
    return jsonify(error="Could not translate right now (" + "; ".join(errors)[:120] + ")."), 502


@app.post("/api/transcribe")
def transcribe():
    """Listen to a recording (WAV) and translate it. Needs GEMINI_API_KEY: browsers cannot transcribe Oromo or Tigrinya."""
    if not GEMINI_KEY:
        return jsonify(error="no_key"), 501
    f, src = request.files.get("audio"), request.form.get("src", "en")
    targets = [t for t in request.form.get("targets", "").split(",") if t in LANG_NAMES and t != src]
    if not f or src not in LANG_NAMES:
        return jsonify(error="Send a recording and its language."), 400
    data = f.read()
    if len(data) > 4_000_000:
        return jsonify(error="Recording too long."), 413
    if too_many():
        return jsonify(error="Too many requests. Wait a minute."), 429
    prompt = (f"This audio is a person speaking {LANG_NAMES[src]}. Write what they said in the language's normal script (Ge'ez for Amharic "
              f"and Tigrinya, Latin letters for Afaan Oromo and Somali), then translate it into: {', '.join(LANG_NAMES[t] for t in targets)}. "
              f"Reply with ONE JSON object {{\"transcript\": \"...\", \"translations\": {{code: text}}}} using exactly these codes as keys: {targets}. "
              "If there is no speech, use an empty transcript and empty translations.")
    try:
        r = requests.post(f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent",
                          headers={"x-goog-api-key": GEMINI_KEY, "Content-Type": "application/json"}, timeout=60,
                          json={"contents": [{"parts": [{"text": prompt}, {"inline_data": {"mime_type": "audio/wav", "data": base64.b64encode(data).decode()}}]}],
                                "generationConfig": {"temperature": 0.1, "responseMimeType": "application/json"}})
        r.raise_for_status()
        out = json.loads(r.json()["candidates"][0]["content"]["parts"][0]["text"])
        return jsonify(transcript=str(out.get("transcript", "")).strip(),
                       translations={k: str(v) for k, v in (out.get("translations") or {}).items() if k in targets and v})
    except Exception as exc:
        return jsonify(error="Could not understand the recording (" + str(exc)[:80] + ")."), 502


def fetch_voice(text, voice):
    r = requests.get("https://translate.google.com/translate_tts",
                     params={"ie": "UTF-8", "client": "tw-ob", "tl": voice, "q": text},
                     headers={"User-Agent": "Mozilla/5.0"}, timeout=15)
    if r.status_code != 200 or len(r.content) < 600 or "audio" not in r.headers.get("Content-Type", ""):
        raise ValueError(f"no {voice} voice")
    return r.content


@app.get("/api/tts")
def tts():
    lang, text = request.args.get("lang", ""), " ".join(request.args.get("q", "").split())[:150]
    if lang not in TTS_CHAIN or not text:
        return jsonify(error="Send a word and a supported language."), 400
    TTS_DIR.mkdir(parents=True, exist_ok=True)
    for n, voice in enumerate(TTS_CHAIN[lang]):
        f = TTS_DIR / (hashlib.sha1(f"{voice}|{text}".encode()).hexdigest() + ".mp3")
        audio = f.read_bytes() if f.exists() else None
        if audio is None:
            if too_many():
                return jsonify(error="Too many requests. Wait a minute."), 429
            try:
                audio = fetch_voice(text, voice)
                f.write_bytes(audio)
            except Exception:
                continue
        resp = Response(audio, mimetype="audio/mpeg")
        resp.headers["Cache-Control"] = "public, max-age=31536000"
        if n:
            resp.headers["X-Approx"] = "1"
        return resp
    return jsonify(error="No voice available right now."), 502


@app.get("/")
def index():
    return send_from_directory(WEB, "index.html")


@app.get("/<path:path>")
def static_files(path):
    full = (WEB / path)
    if not full.is_file() or WEB.resolve() not in full.resolve().parents:
        return jsonify(error="Not found"), 404
    gz = WEB / (path + ".gz")
    if path.startswith("data/") and path.endswith(".json") and gz.is_file() and "gzip" in request.headers.get("Accept-Encoding", ""):
        resp = send_from_directory(WEB, path + ".gz", mimetype="application/json")
        resp.headers["Content-Encoding"] = "gzip"
        resp.headers["Vary"] = "Accept-Encoding"
    else:
        resp = send_from_directory(WEB, path)
    if path == "sw.js":
        resp.headers["Cache-Control"] = "no-cache"          # always check for a new service worker
    return resp


if __name__ == "__main__":
    app.run(host=os.getenv("HOST", "127.0.0.1"), port=int(os.getenv("PORT", "5000")), debug=False)
