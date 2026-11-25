"""Translate more of the dictionary on YOUR computer (needs internet), then rebuild.

    set GEMINI_API_KEY=your_free_key          (Windows)   |   export GEMINI_API_KEY=...   (Mac/Linux)
    python tools/bulk_translate.py --langs am,om,ti,so,ar --limit 2000   # repeat until done; --target 20000 is the default
    python build_data.py

* Best quality: Gemini (free key from https://aistudio.google.com/apikey). Sends 40 words per request.
* No key: falls back to the free MyMemory service (slow, daily limit, weaker for Amharic/Oromo/Tigrinya).
* Results go to data/translations_extra.json and appear in the app as "Machine" translations.
  Hand-made and your own corrections always win. The script is resumable: run it again to continue.
* Please have a native speaker review machine translations before treating them as correct.
"""
import argparse
import json
import os
import sys
import time
from pathlib import Path

import requests

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "data" / "translations_extra.json"
NAMES = {"am": "Amharic (Ge'ez script)", "om": "Afaan Oromo (Latin script)", "ti": "Tigrinya (Ge'ez script)",
         "so": "Somali", "ar": "Arabic", "fr": "French", "sw": "Swahili"}
MODEL = os.getenv("GEMINI_MODEL", "gemini-flash-latest")


SKIP = set("""of the to or in and that an by with for which from as on one who be at it is are was were this these those
 its into than then also such not any all can may used use act state being been has have had having their there where when what
 other another more most some many much very part kind type form way something someone spoken language dialect languages source
 ethnic family branch variant alternative spelling obsolete archaic dated rare plural singular tense participle verb noun adjective
 adverb pronoun preposition abbreviation initialism acronym iso code nan""".split())


def common_words(lex):
    """Rank single words by how often they appear inside other entries' meanings (a good 'everyday word' signal)."""
    import re
    from collections import Counter
    singles = {k for k in lex["keys"] if " " not in k and k.isalpha() and k.isascii() and len(k) > 1 and k not in SKIP}
    freq = Counter()
    for defs in lex["d"]:
        for d in defs[:3]:
            freq.update(w for w in set(re.findall(r"[a-z]+", d.lower())) if w in singles)
    return sorted(singles, key=lambda k: (-freq[k], len(k), k))


def candidates(langs, limit, target=None):
    lex = json.loads((ROOT / "web" / "data" / "lexicon.json").read_text(encoding="utf-8"))
    tr = json.loads((ROOT / "web" / "data" / "translations.json").read_text(encoding="utf-8"))
    done = json.loads(OUT.read_text(encoding="utf-8")) if OUT.exists() else {}
    ranked = common_words(lex)
    if target:                                   # work on the top `target` everyday words only
        ranked = ranked[:target]
    todo = {}
    for lang in langs:
        have = lambda k: k in tr["c"] and lang in tr["c"][k] or lang in done.get(k, {})
        todo[lang] = [k for k in ranked if not have(k)][:limit]
    return done, todo


def gemini_batch(words, lang):
    prompt = (f"Translate each English dictionary word into {NAMES[lang]}. Use the most common everyday sense. "
              "Reply with ONE JSON object mapping each English word to its translation (a short string; "
              "use ' / ' for up to three alternatives; use \"\" if the word has no good translation).\n"
              f"Words: {json.dumps(words)}")
    r = requests.post(f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent",
                      headers={"x-goog-api-key": os.environ["GEMINI_API_KEY"], "Content-Type": "application/json"},
                      json={"contents": [{"parts": [{"text": prompt}]}],
                            "generationConfig": {"temperature": 0.1, "responseMimeType": "application/json"}}, timeout=90)
    r.raise_for_status()
    return parse_json_reply(r.json()["candidates"][0]["content"]["parts"][0]["text"], words)


def parse_json_reply(text, words):
    text = text.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
    data = json.loads(text)
    return {w: str(data[w]).strip() for w in words if isinstance(data.get(w), str) and data[w].strip()}


def mymemory_one(word, lang):
    r = requests.get("https://api.mymemory.translated.net/get", params={"q": word, "langpair": f"en|{lang}"}, timeout=20).json()
    out = (r.get("responseData") or {}).get("translatedText") or ""
    if r.get("responseStatus") != 200 or "MYMEMORY WARNING" in out.upper():
        raise RuntimeError("MyMemory limit reached")
    return out.strip()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--langs", default="am,om,ti")
    ap.add_argument("--limit", type=int, default=500, help="words per language this run")
    ap.add_argument("--target", type=int, default=20000, help="only the N most common words (default 20000)")
    ap.add_argument("--batch", type=int, default=40)
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()
    langs = [l for l in args.langs.split(",") if l in NAMES]
    done, todo = candidates(langs, args.limit, args.target)
    for lang, words in todo.items():
        print(f"{lang}: {len(words)} words to translate")
    if args.dry_run:
        return
    use_gemini = bool(os.getenv("GEMINI_API_KEY"))
    print("Engine:", "Gemini" if use_gemini else "MyMemory (free, slow)")
    for lang, words in todo.items():
        step = args.batch if use_gemini else 1
        for i in range(0, len(words), step):
            chunk = words[i:i + step]
            try:
                got = gemini_batch(chunk, lang) if use_gemini else {chunk[0]: mymemory_one(chunk[0], lang)}
            except Exception as exc:
                print(f"  stopped at {lang} word {i}: {exc}\n  Run again later to continue.")
                OUT.write_text(json.dumps(done, ensure_ascii=False, indent=0), encoding="utf-8")
                return
            for w, t in got.items():
                if t and t.lower() != w:
                    done.setdefault(w, {})[lang] = t
            OUT.write_text(json.dumps(done, ensure_ascii=False, indent=0), encoding="utf-8")
            print(f"  {lang}: {min(i + step, len(words))}/{len(words)}")
            time.sleep(1.0 if use_gemini else 0.4)
    print("Done. Now run: python build_data.py")


if __name__ == "__main__":
    sys.exit(main())
