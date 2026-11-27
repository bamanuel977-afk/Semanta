# SEMANTA — a dictionary in every tongue

An offline-first dictionary web app for Ethiopia and East Africa.

* **42,546 entries** with clear English meanings (your original 49,537 words, cleaned: 6,685 empty
  "ISO 639-6 entity" placeholders were removed, duplicate spellings merged, 31 Ethiopian words added).
* **336 hand-made translations** in **Amharic, Afaan Oromo, Tigrinya, Somali and Arabic**, grouped into
  25 topics (greetings, family, food, clothes, farm, society, study & tech, clinic, travel, Ethiopia & East Africa...).
* **Search in both directions**: type `water` or `ውሃ` or `bishaan`. Typo-tolerant ("wattter" finds *water*),
  finds words inside other meanings, and shows nearby words like a printed dictionary.
* **Learn mode**: flashcards and quizzes that remember which words you find hard.
* **Your own words**: add words, meanings and translations; correct any translation; export/import.
* **Works offline** (installable app/PWA), light and dark theme, speaks words aloud, phone friendly.
* **Sound for Amharic, Afaan Oromo and Arabic**: uses a voice on your device if it has one, otherwise `app.py` fetches the
  audio once and the app keeps it for offline use. Afaan Oromo has no native online voice, so it uses an approximate
  Swahili voice (the app tells you). Needs `python app.py`; a plain static host can only use device voices.
* **Record your own voice**: tap the microphone on any translation card, speak (up to 8 seconds), tap again to stop. The speaker
  button then plays your recording instead of the computer voice. Saved only on that device; the bin deletes it.
* **Speak tab**: records your voice (you can play it back), shows live text for English, Amharic, Arabic, Somali and
  Swahili in Chrome/Edge, and translates it. With `GEMINI_API_KEY` set, `app.py` also listens to the recording itself, so
  Afaan Oromo and Tigrinya speech work too.
* **Online translation** for any word that has no translation yet (cached, so each word is translated once).

Open http://127.0.0.1:5000. The first visit downloads the dictionary (about 1.7 MB); after that it works
with no internet, and you can install it from the browser menu ("Install app").

The `web/` folder is the whole app. You can also put it on any static host (GitHub Pages, Netlify) and it
will work offline there too; only online translation needs `app.py`.

## Better translations for the whole dictionary

Free machine translators are weak for Amharic, Oromo and Tigrinya, so the 336 core words are hand-made
and everything else is clearly labelled (**Hand-made / Yours / Machine / Online**). To translate more:

1. Get a free key at https://aistudio.google.com/apikey and set `GEMINI_API_KEY`.
2. `python tools/bulk_translate.py --langs am,om,ti --limit 1000`   (resumable, run it again for more)
3. `python build_data.py`   (rebuilds `web/data`; hand-made translations are never overwritten)
4. Edit `web/sw.js` and raise `VERSION` so visitors receive the update.

Set the same `GEMINI_API_KEY` when running `app.py` and online "Translate" buttons use Gemini too.
**Have a native speaker review** machine translations; the hand-made core list should also be proofread
(edit `data/curated_translations.tsv`, then run `python build_data.py`).

## Notes

* The original `app.py` in your zip was a terminal script, not a Flask server, so the page could not search.
  This version replaces it.
* Voices: "Listen" uses your device's text-to-speech. Many devices have no Amharic/Oromo/Tigrinya voice yet;
  the app tells you instead of saying it wrongly.
* Saved words, history and your own words are stored in the browser (localStorage) on each device.
