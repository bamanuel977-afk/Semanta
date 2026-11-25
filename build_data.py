"""Build the offline data files used by the web app.

    python build_data.py

Reads   data/data.json                 your original dictionary (word -> [meanings])
        data/curated_translations.tsv  hand-made core vocabulary in 5 languages
        data/extra_words.tsv           extra Ethiopian / East African words with meanings
        data/translations_extra.json   (optional) machine translations from tools/bulk_translate.py
Writes  web/data/lexicon.json, translations.json, topics.json  (+ .gz copies served compressed)
"""
import gzip
import json
import re
import sys
import unicodedata
from pathlib import Path

ROOT = Path(__file__).parent
OUT = ROOT / "web" / "data"
LANGS = ["am", "om", "ti", "so", "ar"]          # column order in the curated files
MAX_DEFS = 15


def norm(text):
    """Lower-case and strip accents so 'Café' and 'cafe' match."""
    text = unicodedata.normalize("NFKD", text.strip().lower())
    return "".join(c for c in text if not unicodedata.combining(c))


def clean_def(text):
    text = re.sub(r"'{2,}", "", str(text))
    return re.sub(r"\s+", " ", text).strip()


def load_dictionary():
    raw = json.loads((ROOT / "data" / "data.json").read_text(encoding="utf-8"))
    groups = {}
    dropped = 0
    for word, meanings in raw.items():
        meanings = [meanings] if isinstance(meanings, str) else meanings
        defs = [clean_def(m) for m in meanings]
        defs = [d for d in defs if d and not d.startswith("ISO 639")]      # placeholders without a real meaning
        if not defs:
            dropped += 1
            continue
        groups.setdefault(norm(word), []).append((word.strip(), defs))
    entries = {}
    for key, variants in groups.items():
        variants.sort(key=lambda v: (v[0] != v[0].lower(), v[0]))            # lower-case spelling first
        display, seen, merged = variants[0][0], set(), []
        for _, defs in variants:
            for d in defs:
                if d.lower() not in seen:
                    seen.add(d.lower())
                    merged.append(d)
        entries[key] = [display, merged[:MAX_DEFS]]
    return entries, dropped


def read_rows(path):
    for line in path.read_text(encoding="utf-8").splitlines():
        if line.strip() and not line.startswith("# ") and not line.startswith("#!"):
            yield line


def main():
    entries, dropped = load_dictionary()
    translations, topics = {}, []

    # curated core vocabulary ---------------------------------------------------
    missing = []
    for line in read_rows(ROOT / "data" / "curated_translations.tsv"):
        if line.startswith("#"):
            name, emoji, am, om = (line[1:].split("|") + ["", "", ""])[:4]
            topics.append({"id": re.sub(r"[^a-z]+", "-", name.lower()).strip("-"), "name": name, "emoji": emoji,
                           "am": am, "om": om, "words": []})
            continue
        cols = [c.strip() for c in line.split("|")]
        word, values = cols[0], (cols[1:] + [""] * 5)[:5]
        key = norm(word)
        if key not in entries and len(cols) > 6 and cols[6]:      # optional 7th column: meaning for a new word
            entries[key] = [word, [cols[6]]]
        if key not in entries:
            missing.append(word)
            continue
        translations[key] = {l: v for l, v in zip(LANGS, values) if v}
        topics[-1]["words"].append(key)
    if missing:
        print("  curated words not found in dictionary (skipped):", ", ".join(missing))

    # extra Ethiopian words -----------------------------------------------------
    eth = {"id": "ethiopia", "name": "Ethiopia & East Africa", "emoji": "🏔️", "am": "ኢትዮጵያና ምሥራቅ አፍሪካ",
           "om": "Itoophiyaa fi Baha Afrikaa", "words": []}
    added = 0
    for line in read_rows(ROOT / "data" / "extra_words.tsv"):
        cols = [c.strip() for c in line.split("|")]
        word, meaning, values = cols[0], cols[1], (cols[2:] + [""] * 5)[:5]
        key = norm(word)
        if key in entries:
            entries[key][1].insert(0, meaning)
        else:
            entries[key] = [word, [meaning]]
            added += 1
        vals = {l: v for l, v in zip(LANGS, values) if v}
        if vals:
            translations.setdefault(key, {}).update(vals)
        eth["words"].append(key)
    topics.append(eth)

    # optional machine translations (never override hand-made ones) ---------------
    machine = {}
    extra = ROOT / "data" / "translations_extra.json"
    if extra.exists():
        for key, vals in json.loads(extra.read_text(encoding="utf-8")).items():
            vals = {l: v for l, v in vals.items() if v and l not in translations.get(key, {})}
            if vals and key in entries:
                machine[key] = vals

    # write ---------------------------------------------------------------------
    keys = sorted(entries, key=lambda k: (k, entries[k][0]))
    lexicon = {"v": 1, "keys": keys, "w": [entries[k][0] for k in keys], "d": [entries[k][1] for k in keys]}
    OUT.mkdir(parents=True, exist_ok=True)
    files = {"lexicon.json": lexicon, "translations.json": {"c": translations, "m": machine}, "topics.json": topics}
    for name, payload in files.items():
        text = json.dumps(payload, ensure_ascii=False, separators=(",", ":"))
        (OUT / name).write_text(text, encoding="utf-8")
        (OUT / (name + ".gz")).write_bytes(gzip.compress(text.encode("utf-8"), 9))
    words = len(keys)
    singles = sum(1 for k in keys if " " not in k)
    print(f"Lexicon: {words:,} entries ({singles:,} single words, {words - singles:,} phrases)")
    print(f"  removed {dropped:,} placeholder entries with no real meaning; added {added} new words")
    print(f"  hand-made translations: {len(translations)} words; machine translations: {len(machine)} words")
    print(f"  topics: {len(topics)}; data size {sum((OUT / n).stat().st_size for n in files) / 1e6:.1f} MB "
          f"({sum((OUT / (n + '.gz')).stat().st_size for n in files) / 1e6:.1f} MB compressed)")


if __name__ == "__main__":
    sys.exit(main())
