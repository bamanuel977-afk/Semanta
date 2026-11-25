(() => {
  "use strict";

  /* ============================================================ basics */
  const LANGS = [
    {
      code: "am",
      name: "Amharic",
      native: "አማርኛ",
      speech: "am-ET",
      cls: "am",
      core: true,
    },
    {
      code: "om",
      name: "Afaan Oromo",
      native: "Afaan Oromoo",
      speech: "om",
      cls: "om",
      core: true,
    },
    {
      code: "ti",
      name: "Tigrinya",
      native: "ትግርኛ",
      speech: "ti-ER",
      cls: "ti",
      core: true,
    },
    {
      code: "so",
      name: "Somali",
      native: "Soomaali",
      speech: "so-SO",
      cls: "so",
      core: true,
    },
    {
      code: "ar",
      name: "Arabic",
      native: "العربية",
      speech: "ar-SA",
      cls: "ar",
      core: true,
      rtl: true,
    },
    {
      code: "fr",
      name: "French",
      native: "Français",
      speech: "fr-FR",
      cls: "x",
    },
    {
      code: "sw",
      name: "Swahili",
      native: "Kiswahili",
      speech: "sw-KE",
      cls: "x",
    },
    {
      code: "es",
      name: "Spanish",
      native: "Español",
      speech: "es-ES",
      cls: "x",
    },
    {
      code: "de",
      name: "German",
      native: "Deutsch",
      speech: "de-DE",
      cls: "x",
    },
  ];
  const LANG = Object.fromEntries(LANGS.map((l) => [l.code, l]));
  const ICONS = {
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
    cap: '<path d="M2 9l10-5 10 5-10 5z"/><path d="M6 11.5V16c3 2.5 9 2.5 12 0v-4.5"/>',
    bookmark: '<path d="M6 3h12v18l-6-4-6 4z"/>',
    gear: '<path d="M4 7h10M18 7h2M4 17h2M10 17h10"/><circle cx="16" cy="7" r="2"/><circle cx="8" cy="17" r="2"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5 19 19M5 19l1.5-1.5M17.5 6.5 19 5"/>',
    moon: '<path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z"/>',
    volume:
      '<path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16.5 8.5a5 5 0 0 1 0 7"/>',
    heart:
      '<path d="M12 20s-7-4.4-9-9a5 5 0 0 1 9-3 5 5 0 0 1 9 3c-2 4.6-9 9-9 9z"/>',
    copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>',
    share:
      '<circle cx="18" cy="5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="19" r="2.5"/><path d="m8.2 10.8 7.6-4.6M8.2 13.2l7.6 4.6"/>',
    pencil: '<path d="M4 20l1-4L16 5l3 3L8 19z"/>',
    mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    globe:
      '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    download: '<path d="M12 4v11M7 11l5 5 5-5M5 20h14"/>',
    trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
    rotate:
      '<path d="M20 11a8 8 0 0 0-14-4M4 4v4h4M4 13a8 8 0 0 0 14 4M20 20v-4h-4"/>',
  };
  const svg = (n) =>
    `<svg class="i" viewBox="0 0 24 24" aria-hidden="true">${ICONS[n]}</svg>`;
  const $ = (s, r = document) => r.querySelector(s);
  const h = (tag, attrs = {}, ...kids) => {
    const e = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (v == null || v === false) continue;
      if (k === "class") e.className = v;
      else if (k === "html") e.innerHTML = v;
      else if (k.startsWith("on")) e.addEventListener(k.slice(2), v);
      else e.setAttribute(k, v === true ? "" : v);
    }
    for (const c of kids.flat(Infinity))
      if (c != null && c !== false)
        e.append(c.nodeType ? c : document.createTextNode(c));
    return e;
  };
  const ic = (n) => h("span", { html: svg(n) });
  const norm = (s) =>
    s
      .trim()
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "");
  const enc = encodeURIComponent;
  const fmt = (n) => n.toLocaleString("en-US");
  const store = {
    get(k, d) {
      try {
        const v = localStorage.getItem("lexora:" + k);
        return v == null ? d : JSON.parse(v);
      } catch {
        return d;
      }
    },
    set(k, v) {
      try {
        localStorage.setItem("lexora:" + k, JSON.stringify(v));
      } catch {
        /* storage full or blocked */
      }
    },
  };
  const S = {
    fav: store.get("fav", []),
    hist: store.get("hist", []),
    mine: store.get("mine", {}),
    utr: store.get("utr", {}),
    otr: store.get("otr", {}),
    shown: store.get("shown", ["am", "om", "ti"]),
    theme: store.get("theme", "auto"),
    size: store.get("size", 100),
    srs: store.get("srs", {}),
  };
  const save = (k) => store.set(k, S[k]);
  function toast(msg) {
    const t = $("#toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toast.t);
    toast.t = setTimeout(() => t.classList.remove("show"), 2600);
  }

  /* ============================================================ data + search */
  let DATA = null,
    K = [],
    W = [],
    D = [],
    REV = new Map();
  const lower = (q) => {
    let lo = 0,
      hi = K.length;
    while (lo < hi) {
      const m = (lo + hi) >> 1;
      if (K[m] < q) lo = m + 1;
      else hi = m;
    }
    return lo;
  };
  const idxOf = (key) => {
    const i = lower(key);
    return K[i] === key ? i : -1;
  };

  function insertEntry(key, word, defs) {
    const i = lower(key);
    if (K[i] === key) {
      D[i] = [...defs, ...D[i]];
      return;
    }
    K.splice(i, 0, key);
    W.splice(i, 0, word);
    D.splice(i, 0, defs);
  }
  function trFor(key, code) {
    const u = S.utr[key]?.[code];
    if (u) return { text: u, src: "you" };
    const c = DATA.tr.c[key]?.[code];
    if (c) return { text: c, src: "hand" };
    const m = DATA.tr.m[key]?.[code];
    if (m) return { text: m, src: "machine" };
    const o = S.otr[key]?.[code];
    if (o) return { text: o.text, src: "online", engine: o.engine };
    return null;
  }
  function buildRev() {
    REV = new Map();
    const add = (key, code, text) => {
      for (const part of text.split(/\s*\/\s*/)) {
        const n = norm(part);
        if (!n) continue;
        if (!REV.has(n)) REV.set(n, []);
        REV.get(n).push({ key, code, text });
      }
    };
    for (const src of [DATA.tr.c, DATA.tr.m, S.utr])
      for (const [key, vals] of Object.entries(src))
        for (const [code, text] of Object.entries(vals)) add(key, code, text);
    for (const [key, vals] of Object.entries(S.otr))
      for (const [code, o] of Object.entries(vals)) add(key, code, o.text);
  }
  function editDistance(a, b, max) {
    if (Math.abs(a.length - b.length) > max) return max + 1;
    let prev2 = null,
      prev = Array.from({ length: b.length + 1 }, (_, j) => j);
    for (let i = 1; i <= a.length; i++) {
      const cur = [i];
      for (let j = 1; j <= b.length; j++) {
        cur[j] = Math.min(
          prev[j] + 1,
          cur[j - 1] + 1,
          prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
        );
        if (
          prev2 &&
          i > 1 &&
          j > 1 &&
          a[i - 1] === b[j - 2] &&
          a[i - 2] === b[j - 1]
        )
          cur[j] = Math.min(cur[j], prev2[j - 2] + 1);
      }
      prev2 = prev;
      prev = cur;
    }
    return prev[b.length];
  }
  function lookup(q, limit = 8) {
    const n = norm(q),
      out = [],
      seen = new Set();
    if (!n) return { words: [], tr: [], fuzzy: [] };
    const add = (i) => {
      if (!seen.has(i) && out.length < limit) {
        seen.add(i);
        out.push(K[i]);
      }
    };
    const e = lower(n);
    if (K[e] === n) add(e);
    const pre = [];
    for (let p = e; p < K.length && K[p].startsWith(n) && pre.length < 600; p++)
      pre.push(p);
    pre.sort((a, b) => K[a].length - K[b].length || a - b);
    pre.forEach(add);
    if (out.length < limit && n.length >= 2) {
      let c = 0;
      for (let i = 0; i < K.length && c < limit * 4 && out.length < limit; i++)
        if (K[i].includes(" " + n)) {
          add(i);
          c++;
        }
    }
    if (out.length < limit && n.length >= 3) {
      let c = 0;
      for (let i = 0; i < K.length && c < limit * 4 && out.length < limit; i++)
        if (K[i].includes(n)) {
          add(i);
          c++;
        }
    }
    const tr = [],
      tseen = new Set();
    const exact = REV.get(n) || [];
    for (const r of exact)
      if (!tseen.has(r.key + r.code)) {
        tseen.add(r.key + r.code);
        tr.push(r);
      }
    if (tr.length < 6)
      for (const [t, rows] of REV)
        if (t !== n && t.startsWith(n)) {
          for (const r of rows)
            if (!tseen.has(r.key + r.code) && tr.length < 6) {
              tseen.add(r.key + r.code);
              tr.push(r);
            }
          if (tr.length >= 6) break;
        }
    const fuzzy = [];
    if (out.length < 3 && n.length >= 3) {
      const max = n.length > 6 ? 2 : 1,
        cand = [];
      for (let i = 0; i < K.length; i++) {
        const k = K[i];
        if (
          Math.abs(k.length - n.length) <= max &&
          (k[0] === n[0] || k[1] === n[1])
        ) {
          const d = editDistance(n, k, max);
          if (d <= max) cand.push([d, k.length, k]);
        }
      }
      cand.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
      cand.slice(0, 8).forEach((c) => fuzzy.push(c[2]));
    }
    return { words: out, tr, fuzzy };
  }
  function inMeanings(n, limit = 10) {
    const found = [],
      needle = " " + n;
    for (let i = 0; i < K.length && found.length < 150; i++) {
      if (K[i] === n) continue;
      const hit = D[i].findIndex((d) =>
        (" " + d.toLowerCase()).includes(needle),
      );
      if (hit >= 0)
        found.push([K[i].includes(" ") ? 1 : 0, hit, K[i].length, K[i]]);
    }
    return found
      .sort((x, y) => x[0] - y[0] || x[1] - y[1] || x[2] - y[2])
      .slice(0, limit)
      .map((f) => f[3]); // single words, first meaning, short
  }

  async function loadData() {
    const bar = $("#splashBar"),
      msg = $("#splashMsg");
    const get = async (name, pct, label) => {
      msg.textContent = label;
      const r = await fetch("data/" + name);
      if (!r.ok) throw new Error(name);
      const j = await r.json();
      bar.style.width = pct + "%";
      return j;
    };
    const topics = await get("topics.json", 25, "Reading topics…");
    const tr = await get("translations.json", 40, "Loading translations…");
    const lex = await get("lexicon.json", 100, "Opening the dictionary…");
    DATA = { topics, tr };
    K = lex.keys;
    W = lex.w;
    D = lex.d;
    for (const [key, m] of Object.entries(S.mine))
      insertEntry(key, m.word, [m.meaning]);
    buildRev();
  }

  /* ============================================================ helpers */
  const firstMeaning = (key, n = 130) => {
    const i = idxOf(key);
    if (i < 0) return "";
    const d = D[i][0] || "";
    return d.length > n ? d.slice(0, n - 1) + "…" : d;
  };
  let voiceAudio = null;
  const VOICES = {
    am: ["am"],
    ar: ["ar"],
    om: ["om", "sw"],
    ti: ["ti", "am"],
    so: ["so", "sw"],
  };
  async function playOnline(text, code) {
    if (!navigator.onLine)
      return toast(
        "Connect to the internet once to hear this word. It is saved for next time.",
      );
    toast("Loading voice…");
    const play = async (src) => {
      const a = new Audio();
      a.referrerPolicy = "no-referrer";
      a.src = src;
      if (voiceAudio) voiceAudio.pause();
      voiceAudio = a;
      await a.play();
    };
    const approx =
      "Approximate voice: this language has no native online voice yet.";
    try {
      // 1) your server (saves the audio)
      const r = await fetch(`/api/tts?lang=${code}&q=${enc(text)}`);
      if (!r.ok) throw new Error("no voice");
      await play(URL.createObjectURL(await r.blob()));
      return toast(r.headers.get("X-Approx") ? approx : "Playing…");
    } catch {
      /* no server (static host) or no voice: ask the voice service directly */
    }
    for (const [n, v] of VOICES[code].entries()) {
      try {
        await play(
          `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=${v}&q=${enc(text)}`,
        );
        return toast(n ? approx : "Playing…");
      } catch {
        /* try next voice */
      }
    }
    toast("Could not load the voice. Check your connection.");
  }
  function speak(text, lang) {
    const code = lang.slice(0, 2).toLowerCase();
    const voices =
      "speechSynthesis" in window ? speechSynthesis.getVoices() : [];
    const device = voices.some((v) => v.lang.toLowerCase().startsWith(code));
    if (device || !["am", "om", "ar", "ti", "so"].includes(code)) {
      if (!("speechSynthesis" in window))
        return toast("This browser cannot speak words aloud.");
      if (voices.length && !device)
        return toast("No voice for this language on your device yet.");
      const u = new SpeechSynthesisUtterance(text);
      u.lang = lang;
      speechSynthesis.cancel();
      speechSynthesis.speak(u);
      return;
    }
    playOnline(text, code); // no voice on the device: use the server voice (cached for offline)
  }
  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
      toast("Copied.");
    } catch {
      toast("Copy was blocked by the browser.");
    }
  }
  const toggleFav = (key) => {
    S.fav = S.fav.includes(key)
      ? S.fav.filter((k) => k !== key)
      : [key, ...S.fav];
    save("fav");
  };
  const addHist = (key) => {
    S.hist = [key, ...S.hist.filter((k) => k !== key)].slice(0, 30);
    save("hist");
  };
  const shownLangs = () => LANGS.filter((l) => S.shown.includes(l.code));
  const go = (key) => {
    location.hash = "#/w/" + enc(key);
  };

  function trLine(key) {
    const rows = shownLangs()
      .map((l) => ({ l, t: trFor(key, l.code) }))
      .filter((r) => r.t);
    return rows.length
      ? h(
          "span",
          { class: "trs" },
          rows.map((r) =>
            h(
              "span",
              { lang: r.l.code, dir: r.l.rtl ? "rtl" : null },
              r.t.text,
            ),
          ),
        )
      : null;
  }
  function wordItem(key, extra) {
    const i = idxOf(key);
    if (i < 0) return null;
    return h(
      "a",
      { class: "item", href: "#/w/" + enc(key) },
      h("b", {}, W[i]),
      trLine(key),
      h("small", {}, firstMeaning(key, 170)),
      extra,
    );
  }

  /* ============================================================ dialogs */
  const $dlg = $("#dlg");
  $dlg.addEventListener("click", (e) => {
    if (e.target === $dlg) $dlg.close();
  });
  const openDialog = (node) => {
    $dlg.replaceChildren(h("div", { class: "dlg" }, node));
    if (!$dlg.open) $dlg.showModal();
  };

  function editTranslation(key, code) {
    const l = LANG[code],
      cur = S.utr[key]?.[code] || trFor(key, code)?.text || "";
    const input = h("input", {
      type: "text",
      value: cur,
      lang: code,
      dir: l.rtl ? "rtl" : null,
      autocomplete: "off",
    });
    const done = () => {
      buildRev();
      $dlg.close();
      route();
    };
    openDialog([
      h("h2", {}, `${l.name} · ${W[idxOf(key)]}`),
      h(
        "p",
        { class: "eyebrow" },
        "Your translation is saved on this device and always shown first.",
      ),
      h("label", {}, `Translation in ${l.name} (${l.native})`, input),
      h(
        "div",
        { class: "actions" },
        S.utr[key]?.[code]
          ? h(
              "button",
              {
                class: "btn danger",
                onclick: () => {
                  delete S.utr[key][code];
                  save("utr");
                  done();
                },
              },
              "Remove mine",
            )
          : null,
        h("button", { class: "btn", onclick: () => $dlg.close() }, "Cancel"),
        h(
          "button",
          {
            class: "btn primary",
            onclick: () => {
              const v = input.value.trim();
              if (!v) return toast("Type a translation first.");
              (S.utr[key] ||= {})[code] = v;
              save("utr");
              toast("Saved.");
              done();
            },
          },
          "Save",
        ),
      ),
    ]);
    setTimeout(() => input.focus(), 50);
  }
  function addWordDialog(prefill = "") {
    const word = h("input", {
      type: "text",
      value: prefill,
      autocomplete: "off",
    });
    const meaning = h("textarea", {
      placeholder: "What does it mean? Every word needs a meaning.",
    });
    const fields = shownLangs()
      .filter((l) => l.core)
      .map((l) => ({
        l,
        input: h("input", {
          type: "text",
          lang: l.code,
          dir: l.rtl ? "rtl" : null,
        }),
      }));
    openDialog([
      h("h2", {}, "Add a word"),
      h("label", {}, "Word or phrase", word),
      h("label", {}, "Meaning", meaning),
      h("hr"),
      h("p", { class: "eyebrow" }, "Translations (optional)"),
      fields.map((f) => h("label", {}, `${f.l.name} · ${f.l.native}`, f.input)),
      h(
        "div",
        { class: "actions" },
        h("button", { class: "btn", onclick: () => $dlg.close() }, "Cancel"),
        h(
          "button",
          {
            class: "btn primary",
            onclick: () => {
              const w = word.value.trim(),
                m = meaning.value.trim();
              if (!w || !m)
                return toast("Please write the word and its meaning.");
              const key = norm(w),
                isNew = idxOf(key) < 0;
              S.mine[key] = { word: w, meaning: m, isNew };
              save("mine");
              insertEntry(key, w, [m]);
              for (const f of fields) {
                const v = f.input.value.trim();
                if (v) (S.utr[key] ||= {})[f.l.code] = v;
              }
              save("utr");
              buildRev();
              $dlg.close();
              toast("Added to your dictionary.");
              go(key);
            },
          },
          "Save word",
        ),
      ),
    ]);
    setTimeout(() => word.focus(), 50);
  }
  function removeMine(key) {
    const m = S.mine[key];
    if (!m) return;
    const i = idxOf(key);
    if (i >= 0) {
      if (m.isNew) {
        K.splice(i, 1);
        W.splice(i, 1);
        D.splice(i, 1);
      } else D[i] = D[i].filter((d) => d !== m.meaning);
    }
    delete S.mine[key];
    delete S.utr[key];
    S.fav = S.fav.filter((k) => k !== key);
    save("mine");
    save("utr");
    save("fav");
    buildRev();
  }

  let deferredInstall = null;
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredInstall = e;
  });
  function settingsDialog() {
    const themeBtn = (v, label) =>
      h(
        "button",
        {
          class: S.theme === v ? "on" : "",
          onclick: () => {
            setTheme(v);
            settingsDialog();
          },
        },
        label,
      );
    const size = h("input", {
      type: "range",
      min: "90",
      max: "130",
      step: "5",
      value: S.size,
      "aria-label": "Text size",
      oninput: (e) => {
        S.size = +e.target.value;
        save("size");
        document.documentElement.style.fontSize = S.size + "%";
      },
    });
    const file = h("input", {
      type: "file",
      accept: "application/json",
      hidden: true,
      onchange: async (e) => {
        try {
          const j = JSON.parse(await e.target.files[0].text());
          Object.assign(S.mine, j.mine || {});
          for (const [k, v] of Object.entries(j.utr || {}))
            S.utr[k] = { ...(S.utr[k] || {}), ...v };
          S.fav = [...new Set([...(j.fav || []), ...S.fav])];
          for (const k of ["mine", "utr", "fav"]) save(k);
          for (const [key, m] of Object.entries(j.mine || {}))
            insertEntry(key, m.word, [m.meaning]);
          buildRev();
          toast("Imported.");
          route();
        } catch {
          toast("That file could not be read.");
        }
      },
    });
    const coreWords = Object.keys(DATA.tr.c).length;
    openDialog([
      h("h2", {}, "Settings"),
      h(
        "div",
        {},
        h("p", { class: "eyebrow" }, "Theme"),
        h(
          "div",
          { class: "seg" },
          themeBtn("auto", "Auto"),
          themeBtn("light", "Light"),
          themeBtn("dark", "Dark"),
        ),
      ),
      h("label", {}, "Text size", size),
      h(
        "div",
        {},
        h("p", { class: "eyebrow" }, "Languages to show"),
        LANGS.map((l) =>
          h(
            "label",
            { class: "check" },
            h("input", {
              type: "checkbox",
              checked: S.shown.includes(l.code) ? true : null,
              onchange: (e) => {
                S.shown = e.target.checked
                  ? [...new Set([...S.shown, l.code])]
                  : S.shown.filter((c) => c !== l.code);
                save("shown");
                route();
              },
            }),
            `${l.name} · ${l.native}`,
            l.core ? null : h("small", { class: "eyebrow" }, " online only"),
          ),
        ),
      ),
      h("hr"),
      h(
        "p",
        { class: "eyebrow" },
        `${fmt(K.length)} entries · ${fmt(coreWords)} hand-translated words · your data stays on this device`,
      ),
      h(
        "div",
        { class: "actions" },
        deferredInstall
          ? h(
              "button",
              {
                class: "btn gold",
                onclick: async () => {
                  deferredInstall.prompt();
                  deferredInstall = null;
                  $dlg.close();
                },
              },
              "Install app",
            )
          : null,
        h(
          "button",
          {
            class: "btn",
            onclick: () => {
              const blob = new Blob(
                [
                  JSON.stringify(
                    { mine: S.mine, utr: S.utr, fav: S.fav },
                    null,
                    1,
                  ),
                ],
                { type: "application/json" },
              );
              const a = h("a", {
                href: URL.createObjectURL(blob),
                download: "semanta-my-data.json",
              });
              a.click();
            },
          },
          ic("download"),
          "Export mine",
        ),
        h("button", { class: "btn", onclick: () => file.click() }, "Import"),
        file,
        h(
          "button",
          {
            class: "btn danger",
            onclick: () => {
              if (
                confirm(
                  "Delete all your saved words, translations and progress from this device?",
                )
              ) {
                Object.keys(localStorage)
                  .filter((k) => k.startsWith("lexora:"))
                  .forEach((k) => localStorage.removeItem(k));
                location.reload();
              }
            },
          },
          "Reset",
        ),
      ),
      h(
        "div",
        { class: "actions" },
        h(
          "button",
          { class: "btn primary", onclick: () => $dlg.close() },
          "Done",
        ),
      ),
    ]);
  }

  /* ============================================================ theme + status */
  function setTheme(v) {
    S.theme = v;
    save("theme");
    const dark =
      v === "dark" ||
      (v === "auto" && matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.dataset.theme = dark ? "dark" : "light";
    $("#themeBtn").innerHTML = svg(dark ? "sun" : "moon");
    document.querySelector('meta[name="theme-color"]').content = dark
      ? "#15120d"
      : "#0d6b43";
  }
  async function updateStatus() {
    const el = $("#status"),
      online = navigator.onLine;
    let ready = false;
    try {
      ready = !!(await caches.match("data/lexicon.json"));
    } catch {
      /* no cache API */
    }
    el.className = "status " + (online ? (ready ? "ready" : "") : "offline");
    el.lastChild.textContent = online
      ? ready
        ? "Offline ready"
        : "Online"
      : ready
        ? "Offline · all words available"
        : "Offline";
  }

  /* ============================================================ search box */
  let outsideHandler = null;
  function searchBox(initial = "") {
    const input = h("input", {
      type: "search",
      placeholder: "Search a word in English, አማርኛ, Afaan Oromoo, ትግርኛ…",
      autocomplete: "off",
      autocapitalize: "off",
      spellcheck: "false",
      "aria-label": "Search the dictionary",
      role: "combobox",
      "aria-expanded": "false",
      "aria-controls": "sg",
    });
    input.value = initial;
    const box = h("div", {
      class: "suggest",
      id: "sg",
      role: "listbox",
      hidden: true,
    });
    const root = h(
      "div",
      { class: "searchbox" },
      h(
        "div",
        { class: "search" },
        ic("search"),
        input,
        h(
          "button",
          { class: "btn primary", onclick: () => submit() },
          "Search",
        ),
      ),
      box,
    );
    let rows = [],
      sel = -1;
    const close = () => {
      box.hidden = true;
      input.setAttribute("aria-expanded", "false");
      sel = -1;
    };
    const paint = () =>
      rows.forEach((r, i) => {
        r.el.setAttribute("aria-selected", i === sel);
        if (i === sel) r.el.scrollIntoView({ block: "nearest" });
      });
    const update = () => {
      const q = input.value;
      if (!q.trim()) return close();
      const r = lookup(q, 7);
      rows = [];
      box.replaceChildren();
      const head = (t) => box.append(h("div", { class: "sg-head" }, t));
      const row = (el, key) => {
        box.append(el);
        rows.push({ el, key });
      };
      if (r.words.length) head("Dictionary");
      for (const key of r.words) {
        const i = idxOf(key);
        row(
          h(
            "button",
            {
              class: "sg",
              role: "option",
              onmousedown: (e) => e.preventDefault(),
              onclick: () => go(key),
            },
            h("b", {}, W[i]),
            h(
              "small",
              { class: "gz" },
              trLine(key)?.textContent || ""
                ? [...trLine(key).children]
                    .map((c) => c.textContent)
                    .join(" · ")
                : firstMeaning(key, 80),
            ),
          ),
          key,
        );
      }
      if (r.tr.length) head("From translations");
      for (const t of r.tr)
        row(
          h(
            "button",
            {
              class: "sg",
              role: "option",
              onmousedown: (e) => e.preventDefault(),
              onclick: () => go(t.key),
            },
            h(
              "b",
              { class: "geez", dir: LANG[t.code]?.rtl ? "rtl" : null },
              t.text,
            ),
            h(
              "small",
              {},
              `${LANG[t.code]?.name || t.code} → ${W[idxOf(t.key)]}`,
            ),
          ),
          t.key,
        );
      if (!r.words.length && r.fuzzy.length) {
        head("Did you mean…");
        for (const key of r.fuzzy.slice(0, 5))
          row(
            h(
              "button",
              {
                class: "sg",
                role: "option",
                onmousedown: (e) => e.preventDefault(),
                onclick: () => go(key),
              },
              h("b", {}, W[idxOf(key)]),
              h("small", {}, firstMeaning(key, 80)),
            ),
            key,
          );
      }
      if (!rows.length)
        box.append(
          h(
            "div",
            { class: "sg-head" },
            "No match yet. Press Enter to see more options.",
          ),
        );
      box.hidden = false;
      input.setAttribute("aria-expanded", "true");
      sel = -1;
    };
    function submit() {
      const q = input.value.trim();
      if (!q) return;
      if (sel >= 0 && rows[sel]) return go(rows[sel].key);
      const n = norm(q);
      if (idxOf(n) >= 0) return go(n);
      const t = REV.get(n);
      if (t && new Set(t.map((x) => x.key)).size === 1) return go(t[0].key);
      close();
      location.hash = "#/s/" + enc(q);
    }
    input.addEventListener("input", update);
    input.addEventListener("focus", update);
    input.addEventListener("keydown", (e) => {
      if (e.key === "ArrowDown" && rows.length) {
        e.preventDefault();
        sel = (sel + 1) % rows.length;
        paint();
      } else if (e.key === "ArrowUp" && rows.length) {
        e.preventDefault();
        sel = (sel - 1 + rows.length) % rows.length;
        paint();
      } else if (e.key === "Enter") {
        e.preventDefault();
        submit();
      } else if (e.key === "Escape") close();
    });
    if (outsideHandler) document.removeEventListener("click", outsideHandler);
    outsideHandler = (e) => {
      if (!root.contains(e.target)) close();
    };
    document.addEventListener("click", outsideHandler);
    return { root, input };
  }
  function langLens() {
    return h(
      "div",
      { class: "lens" },
      h("span", {}, "Show translations in"),
      LANGS.filter((l) => l.core).map((l) =>
        h(
          "button",
          {
            class: "chip" + (S.shown.includes(l.code) ? " on" : ""),
            "data-l": l.code,
            "aria-pressed": S.shown.includes(l.code),
            onclick: () => {
              S.shown = S.shown.includes(l.code)
                ? S.shown.filter((c) => c !== l.code)
                : [...S.shown, l.code];
              save("shown");
              route();
            },
          },
          l.native,
        ),
      ),
    );
  }

  /* ============================================================ views */
  const $view = $("#view");
  const render = (...nodes) => {
    $view.replaceChildren(...nodes);
    window.scrollTo({ top: 0 });
    $view.focus({ preventScroll: true });
  };
  const tileClass = (i) => "t" + (i % 6);

  function viewHome() {
    const sb = searchBox();
    const pool = DATA.topics
      .flatMap((t) => t.words)
      .filter((k) => idxOf(k) >= 0);
    const wk = pool[Math.floor(Date.now() / 864e5) % pool.length],
      wi = idxOf(wk);
    const trs = shownLangs()
      .map((l) => ({ l, t: trFor(wk, l.code) }))
      .filter((r) => r.t);
    const hand = Object.keys(DATA.tr.c).length;
    render(
      h(
        "div",
        { class: "stack" },
        h(
          "section",
          { class: "hero" },
          h("p", { class: "eyebrow" }, "Dictionary · መዝገበ ቃላት · Jechoota"),
          h(
            "h1",
            {},
            "Every word, in every ",
            h("em", {}, "tongue"),
            " you speak.",
          ),
          h(
            "p",
            { class: "lead" },
            `${fmt(K.length)} English words with clear meanings, translated into Amharic, Afaan Oromo, Tigrinya, Somali and Arabic. No internet needed.`,
          ),
          sb.root,
          langLens(),
          h(
            "div",
            { class: "stats" },
            h("span", {}, h("b", {}, fmt(K.length)), " entries"),
            h("span", {}, h("b", {}, fmt(hand)), " hand-translated"),
            h("span", {}, h("b", {}, "5"), " languages"),
            h("span", {}, h("b", {}, DATA.topics.length), " topics"),
          ),
        ),
        h(
          "section",
          { class: "card folio" },
          h(
            "div",
            {},
            h("p", { class: "eyebrow" }, "Word of the day"),
            h("h2", {}, W[wi]),
            h("p", {}, firstMeaning(wk, 150)),
            h(
              "a",
              { class: "btn", href: "#/w/" + enc(wk) },
              "Open word ",
              ic("arrow"),
            ),
          ),
          h(
            "div",
            { class: "tr" },
            trs.length
              ? trs.map((r) =>
                  h(
                    "div",
                    {},
                    h("small", {}, r.l.native),
                    h(
                      "strong",
                      { lang: r.l.code, dir: r.l.rtl ? "rtl" : null },
                      r.t.text,
                    ),
                  ),
                )
              : h("div", {}, "Choose a language above to see translations."),
          ),
        ),
        h(
          "section",
          {},
          h(
            "div",
            { class: "section-title" },
            h("h2", {}, "Browse by topic"),
            h("a", { class: "link", href: "#/topics" }, "All topics"),
          ),
          h(
            "div",
            { class: "tiles" },
            DATA.topics.slice(0, 6).map((t, i) => tile(t, i)),
          ),
        ),
        S.hist.length
          ? h(
              "section",
              {},
              h(
                "div",
                { class: "section-title" },
                h("h2", {}, "Recently looked up"),
              ),
              h(
                "div",
                { class: "chips" },
                S.hist
                  .slice(0, 10)
                  .map((k) =>
                    h(
                      "a",
                      { class: "chip", href: "#/w/" + enc(k) },
                      W[idxOf(k)] || k,
                    ),
                  ),
              ),
            )
          : null,
      ),
    );
  }
  function tile(t, i) {
    const n = t.words.filter((k) => idxOf(k) >= 0).length;
    return h(
      "a",
      { class: "tile " + tileClass(i), href: "#/t/" + t.id },
      h("span", { class: "em", "aria-hidden": "true" }, t.emoji),
      h("b", {}, t.name),
      h("small", {}, t.am),
      h("em", {}, `${n} words`),
    );
  }

  function viewWord(key) {
    const i = idxOf(key);
    if (i < 0) return viewSearch(key);
    addHist(key);
    const defs = D[i],
      fav = S.fav.includes(key);
    let showAll = defs.length <= 5;
    const list = h("ol", { class: "meanings" });
    const drawDefs = () => {
      list.replaceChildren(
        ...(showAll ? defs : defs.slice(0, 4)).map((d) =>
          h("li", {}, h("span", {}, d)),
        ),
      );
    };
    drawDefs();
    const more =
      defs.length > 5
        ? h(
            "button",
            {
              class: "link",
              onclick: (e) => {
                showAll = !showAll;
                drawDefs();
                e.target.textContent = showAll
                  ? "Show fewer"
                  : `Show ${defs.length - 4} more meanings`;
              },
            },
            `Show ${defs.length - 4} more meanings`,
          )
        : null;
    const missing = shownLangs().filter((l) => !trFor(key, l.code));
    const near = [];
    for (let j = Math.max(0, i - 5); j <= Math.min(K.length - 1, i + 5); j++)
      near.push(j);
    const mine = S.mine[key];
    const cards = shownLangs().map((l) => {
      const t = trFor(key, l.code);
      if (!t)
        return h(
          "div",
          { class: "lang empty " + l.cls },
          h(
            "div",
            {},
            h(
              "div",
              { class: "ln" },
              h("span", {}, l.native),
              h("span", {}, l.name),
            ),
            h("div", { class: "tx" }, "No translation yet"),
            h(
              "div",
              { class: "row" },
              h(
                "button",
                {
                  class: "btn small",
                  onclick: (e) => translateOnline(key, l.code, e.currentTarget),
                },
                ic("globe"),
                "Translate online",
              ),
              h(
                "button",
                {
                  class: "btn small",
                  onclick: () => editTranslation(key, l.code),
                },
                ic("pencil"),
                "Add mine",
              ),
            ),
          ),
        );
      return h(
        "div",
        { class: "lang " + l.cls },
        h(
          "div",
          {},
          h(
            "div",
            { class: "ln" },
            h("span", {}, l.native),
            h("span", {}, l.name),
          ),
          h(
            "div",
            { class: "tx", lang: l.code, dir: l.rtl ? "rtl" : null },
            t.text,
          ),
          h(
            "div",
            { class: "row" },
            h(
              "span",
              { class: "src " + t.src, title: t.engine || "" },
              {
                hand: "Hand-made",
                you: "Yours",
                machine: "Machine",
                online: "Online",
              }[t.src],
            ),
            h(
              "span",
              { class: "mini" },
              h(
                "button",
                {
                  "aria-label": "Listen",
                  onclick: async () => {
                    if (!(await playMine(key, l.code))) speak(t.text, l.speech);
                  },
                },
                ic("volume"),
              ),
              h(
                "button",
                { "aria-label": "Copy", onclick: () => copyText(t.text) },
                ic("copy"),
              ),
              h(
                "button",
                {
                  "aria-label": "Edit translation",
                  onclick: () => editTranslation(key, l.code),
                },
                ic("pencil"),
              ),
              voiceTools(key, l),
            ),
          ),
        ),
      );
    });
    const also = inMeanings(key, 8);
    const page = h(
      "div",
      { class: "stack" },
      h(
        "div",
        { class: "card" },
        h("p", { class: "eyebrow" }, "English · ቃል"),
        h(
          "div",
          { class: "word-head" },
          h("h1", { class: "headword" }, W[i]),
          h(
            "div",
            { class: "tools" },
            h(
              "button",
              {
                class: "icon-btn",
                "aria-label": "Pronounce in English",
                onclick: () => speak(W[i], "en-US"),
              },
              ic("volume"),
            ),
            h(
              "button",
              {
                class: "icon-btn" + (fav ? " on" : ""),
                "aria-label": fav ? "Remove from saved" : "Save word",
                "aria-pressed": fav,
                onclick: () => {
                  toggleFav(key);
                  toast(
                    S.fav.includes(key) ? "Saved to your library." : "Removed.",
                  );
                  route();
                },
              },
              ic("heart"),
            ),
            h(
              "button",
              {
                class: "icon-btn",
                "aria-label": "Copy word and meaning",
                onclick: () => copyText(`${W[i]}\n${defs[0]}`),
              },
              ic("copy"),
            ),
            h(
              "button",
              {
                class: "icon-btn",
                "aria-label": "Share",
                onclick: () =>
                  navigator.share
                    ? navigator
                        .share({
                          title: W[i],
                          text: `${W[i]}: ${defs[0]}`,
                          url: location.href,
                        })
                        .catch(() => {})
                    : copyText(location.href),
              },
              ic("share"),
            ),
          ),
        ),
        list,
        more,
        mine
          ? h(
              "p",
              { class: "eyebrow" },
              "Added by you ",
              h(
                "button",
                {
                  class: "link",
                  onclick: () => {
                    if (confirm("Remove this word you added?")) {
                      removeMine(key);
                      location.hash = "#/library";
                    }
                  },
                },
                "Remove",
              ),
            )
          : null,
      ),
      h(
        "section",
        {},
        h(
          "div",
          { class: "section-title" },
          h("h2", {}, "In your languages"),
          missing.length && navigator.onLine
            ? h(
                "button",
                {
                  class: "btn small",
                  onclick: async (e) => {
                    e.currentTarget.disabled = true;
                    for (const l of missing)
                      await translateOnline(key, l.code, null, true);
                    route();
                  },
                },
                ic("globe"),
                `Translate ${missing.length} missing online`,
              )
            : null,
        ),
        cards.length
          ? h("div", { class: "langs" }, cards)
          : h("p", {}, "Turn on languages in Settings."),
      ),
      h(
        "section",
        {},
        h(
          "div",
          { class: "section-title" },
          h("h2", {}, "Nearby in the dictionary"),
        ),
        h(
          "div",
          { class: "near" },
          near.map((j) =>
            h(
              "a",
              { href: "#/w/" + enc(K[j]), class: j === i ? "me" : "" },
              W[j],
            ),
          ),
        ),
      ),
      also.length
        ? h(
            "section",
            {},
            h(
              "div",
              { class: "section-title" },
              h("h2", {}, "Used in other meanings"),
            ),
            h(
              "div",
              { class: "list" },
              also.map((k) => wordItem(k)),
            ),
          )
        : null,
    );
    render(page);
  }

  /* ---- record your own voice for any translation (kept on this device in IndexedDB) ---- */
  const vdb = (() => {
    const open = () =>
      new Promise((res, rej) => {
        const r = indexedDB.open("semanta-voice", 1);
        r.onupgradeneeded = () => r.result.createObjectStore("v");
        r.onsuccess = () => res(r.result);
        r.onerror = () => rej(r.error);
      });
    const run = async (mode, fn) => {
      const db = await open();
      return new Promise((res, rej) => {
        const tx = db.transaction("v", mode),
          q = fn(tx.objectStore("v"));
        tx.oncomplete = () => res(q.result);
        tx.onerror = () => rej(tx.error);
      });
    };
    return {
      get: (k) => run("readonly", (s) => s.get(k)),
      put: (k, v) => run("readwrite", (s) => s.put(v, k)),
      del: (k) => run("readwrite", (s) => s.delete(k)),
    };
  })();
  let myVoice = null,
    recorder = null;
  async function playMine(key, code) {
    try {
      const b = await vdb.get(key + "|" + code);
      if (!b) return false;
      if (voiceAudio) voiceAudio.pause();
      if (myVoice) myVoice.pause();
      myVoice = new Audio(URL.createObjectURL(b));
      await myVoice.play();
      return true;
    } catch {
      return false;
    }
  }
  function voiceTools(key, l) {
    const id = key + "|" + l.code,
      box = h("span", { class: "mini" });
    async function toggle(rb) {
      if (recorder) {
        recorder.stop();
        return;
      }
      if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder)
        return toast("This browser cannot record audio.");
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch {
        return toast("Allow the microphone to record your voice.");
      }
      const chunks = [];
      recorder = new MediaRecorder(stream);
      recorder.ondataavailable = (e) => e.data.size && chunks.push(e.data);
      recorder.onstop = async () => {
        clearTimeout(timer);
        stream.getTracks().forEach((t) => t.stop());
        const mime = recorder.mimeType;
        recorder = null;
        rb.classList.remove("rec");
        const blob = new Blob(chunks, { type: mime });
        if (blob.size < 800) return toast("Nothing was recorded. Try again.");
        try {
          await vdb.put(id, blob);
          toast("Saved. The speaker button now plays your voice.");
          draw(true);
        } catch {
          toast("Could not save the recording.");
        }
      };
      const timer = setTimeout(() => recorder && recorder.stop(), 8000);
      rb.classList.add("rec");
      toast("Recording… tap the microphone again to stop.");
      recorder.start();
    }
    async function draw(has) {
      if (has === undefined) {
        try {
          has = !!(await vdb.get(id));
        } catch {
          has = false;
        }
      }
      const rb = h(
        "button",
        {
          "aria-label": "Record your voice",
          title: "Record your voice",
          class: has ? "has" : "",
          onclick: () => toggle(rb),
        },
        ic("mic"),
      );
      box.replaceChildren(
        rb,
        ...(has
          ? [
              h(
                "button",
                {
                  "aria-label": "Delete my recording",
                  title: "Delete my recording",
                  onclick: async () => {
                    try {
                      await vdb.del(id);
                    } catch {
                      /* ignore */
                    }
                    toast("Recording deleted.");
                    draw(false);
                  },
                },
                ic("trash"),
              ),
            ]
          : []),
      );
    }
    draw();
    return box;
  }

  async function translateOnline(key, code, btn, quiet = false) {
    if (!navigator.onLine) {
      toast("You are offline. Connect to translate this word online.");
      return null;
    }
    if (btn) {
      btn.disabled = true;
      btn.textContent = "Translating…";
    }
    const text = W[idxOf(key)];
    let result = null;
    try {
      const r = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, lang: code }),
      });
      if (r.ok) {
        const j = await r.json();
        result = { text: j.text, engine: j.engine };
      }
    } catch {
      /* no server: try the free service directly below */
    }
    if (!result) {
      try {
        const j = await (
          await fetch(
            `https://api.mymemory.translated.net/get?q=${enc(text)}&langpair=en|${code}`,
          )
        ).json();
        const t = j.responseData?.translatedText;
        if (j.responseStatus === 200 && t && !/MYMEMORY WARNING/i.test(t))
          result = { text: t, engine: "MyMemory" };
      } catch {
        /* offline or blocked */
      }
    }
    if (!result) {
      if (btn) {
        btn.disabled = false;
        btn.textContent = "Try again";
      }
      toast("Could not translate right now.");
      return null;
    }
    (S.otr[key] ||= {})[code] = result;
    const keys = Object.keys(S.otr);
    if (keys.length > 3000) delete S.otr[keys[0]];
    save("otr");
    buildRev();
    if (!quiet) {
      toast(
        "Translated. Machine translations can be wrong; tap the pencil to correct.",
      );
      route();
    }
    return result;
  }

  function viewSearch(q) {
    const sb = searchBox(q),
      r = lookup(q, 40),
      n = norm(q),
      exact = idxOf(n) >= 0;
    const meanings = inMeanings(n, 10).filter((k) => !r.words.includes(k));
    const parts = [
      h(
        "div",
        { class: "card" },
        h("p", { class: "eyebrow" }, "Search"),
        sb.root,
      ),
    ];
    if (!r.words.length && !r.tr.length)
      parts.push(
        h(
          "div",
          { class: "card empty-state" },
          h("h3", {}, `No entry for “${q}”`),
          h(
            "p",
            {},
            r.fuzzy.length
              ? "Did you mean one of these?"
              : "Check the spelling, or add it to your own dictionary.",
          ),
          r.fuzzy.length
            ? h(
                "div",
                { class: "chips", style: "justify-content:center" },
                r.fuzzy.map((k) =>
                  h("a", { class: "chip", href: "#/w/" + enc(k) }, W[idxOf(k)]),
                ),
              )
            : null,
          h(
            "div",
            { class: "row-btns" },
            h(
              "button",
              { class: "btn gold", onclick: () => addWordDialog(q) },
              ic("plus"),
              "Add this word",
            ),
          ),
        ),
      );
    if (r.words.length)
      parts.push(
        h(
          "section",
          {},
          h(
            "div",
            { class: "section-title" },
            h("h2", {}, exact ? "Dictionary" : "Closest words"),
          ),
          h(
            "div",
            { class: "list" },
            r.words.map((k) => wordItem(k)),
          ),
        ),
      );
    if (r.tr.length)
      parts.push(
        h(
          "section",
          {},
          h(
            "div",
            { class: "section-title" },
            h("h2", {}, "Matches in translations"),
          ),
          h(
            "div",
            { class: "list" },
            r.tr.map((t) =>
              wordItem(
                t.key,
                h("small", {}, `${LANG[t.code]?.name || t.code}: ${t.text}`),
              ),
            ),
          ),
        ),
      );
    if (meanings.length)
      parts.push(
        h(
          "section",
          {},
          h(
            "div",
            { class: "section-title" },
            h("h2", {}, "Found inside meanings"),
          ),
          h(
            "div",
            { class: "list" },
            meanings.map((k) => wordItem(k)),
          ),
        ),
      );
    render(h("div", { class: "stack" }, parts));
  }

  function viewTopics() {
    render(
      h(
        "div",
        { class: "stack" },
        h(
          "div",
          {},
          h("p", { class: "eyebrow" }, "ርዕሶች · Mata-duree"),
          h("h1", {}, "Topics"),
          h(
            "p",
            { class: "lead", style: "color:var(--muted)" },
            "Learn words that belong together, from greetings to the market.",
          ),
        ),
        h(
          "div",
          { class: "tiles" },
          DATA.topics.map((t, i) => tile(t, i)),
        ),
      ),
    );
  }
  function viewTopic(id) {
    const t = DATA.topics.find((x) => x.id === id);
    if (!t) return viewTopics();
    const keys = t.words.filter((k) => idxOf(k) >= 0);
    render(
      h(
        "div",
        { class: "stack" },
        h(
          "div",
          { class: "card" },
          h(
            "p",
            { class: "eyebrow" },
            `${t.emoji} Topic · ${keys.length} words`,
          ),
          h("h1", {}, t.name),
          h(
            "p",
            { class: "geez", style: "color:var(--muted);margin:6px 0 14px" },
            [t.am, t.om].filter(Boolean).join(" · "),
          ),
          h(
            "div",
            { class: "row-btns", style: "justify-content:flex-start;margin:0" },
            h(
              "a",
              {
                class: "btn primary",
                href: "#/learn",
                onclick: () => {
                  L.topic = id;
                },
              },
              ic("cap"),
              "Practice this topic",
            ),
            h("a", { class: "btn", href: "#/topics" }, "All topics"),
          ),
        ),
        langLens(),
        h(
          "div",
          { class: "list" },
          keys.map((k) => wordItem(k)),
        ),
      ),
    );
  }

  /* ---------------- learn ---------------- */
  const L = { topic: "all", lang: "am", dir: "en2x", mode: "flash" };
  function deckFor(topic, lang) {
    let keys;
    if (topic === "saved") keys = S.fav;
    else if (topic === "all")
      keys = [...new Set([...Object.keys(DATA.tr.c), ...Object.keys(S.utr)])];
    else keys = DATA.topics.find((t) => t.id === topic)?.words || [];
    return keys.filter((k) => idxOf(k) >= 0 && trFor(k, lang));
  }
  const shuffle = (a) => {
    a = a.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };
  const boxOf = (k, l) => S.srs[k + "|" + l] || 0;
  const grade = (k, l, ok) => {
    S.srs[k + "|" + l] = Math.max(0, Math.min(4, boxOf(k, l) + (ok ? 1 : -1)));
    save("srs");
  };

  function viewLearn() {
    const langs = LANGS.filter((l) => l.core);
    const sel = (id, opts, val, on) =>
      h(
        "select",
        { id, class: "sel", onchange: (e) => on(e.target.value) },
        opts.map(([v, t]) =>
          h("option", { value: v, selected: v === val ? true : null }, t),
        ),
      );
    const count = h("p", { class: "eyebrow" });
    const refresh = () => {
      count.textContent = `${deckFor(L.topic, L.lang).length} words available`;
    };
    const mastered = Object.entries(S.srs).filter(([, b]) => b >= 3).length;
    render(
      h(
        "div",
        { class: "stack" },
        h(
          "div",
          {},
          h("p", { class: "eyebrow" }, "ተማር · Baradhu · Practice"),
          h("h1", {}, "Learn"),
          h(
            "p",
            { style: "color:var(--muted)" },
            mastered
              ? `You have mastered ${mastered} words so far.`
              : "Flashcards and quizzes that remember what you find hard.",
          ),
        ),
        h(
          "div",
          { class: "card setup" },
          h(
            "label",
            {},
            "Language to learn",
            sel(
              "lg",
              langs.map((l) => [l.code, `${l.name} · ${l.native}`]),
              L.lang,
              (v) => {
                L.lang = v;
                refresh();
              },
            ),
          ),
          h(
            "label",
            {},
            "Words from",
            sel(
              "tp",
              [
                ["all", "All hand-made words"],
                ["saved", "My saved words"],
                ...DATA.topics.map((t) => [t.id, `${t.emoji} ${t.name}`]),
              ],
              L.topic,
              (v) => {
                L.topic = v;
                refresh();
              },
            ),
          ),
          h(
            "div",
            {},
            h("p", { class: "eyebrow" }, "Direction"),
            h(
              "div",
              { class: "seg" },
              ...[
                ["en2x", "English → them"],
                ["x2en", "Them → English"],
              ].map(([v, t]) =>
                h(
                  "button",
                  {
                    class: L.dir === v ? "on" : "",
                    onclick: (e) => {
                      L.dir = v;
                      e.currentTarget.parentNode
                        .querySelectorAll("button")
                        .forEach((b) =>
                          b.classList.toggle("on", b === e.currentTarget),
                        );
                    },
                  },
                  t,
                ),
              ),
            ),
          ),
          count,
          h(
            "div",
            { class: "row-btns", style: "justify-content:flex-start;margin:0" },
            h(
              "button",
              { class: "btn primary", onclick: () => startLearn("flash") },
              ic("rotate"),
              "Flashcards",
            ),
            h(
              "button",
              { class: "btn gold", onclick: () => startLearn("quiz") },
              ic("cap"),
              "Quiz",
            ),
          ),
        ),
      ),
    );
    refresh();
  }
  function startLearn(mode) {
    const deck = deckFor(L.topic, L.lang);
    if (deck.length < (mode === "quiz" ? 4 : 1))
      return toast(
        L.topic === "saved"
          ? "Save at least 4 words with translations first."
          : "Not enough words with translations here.",
      );
    const cards = deck
      .map((k) => [boxOf(k, L.lang) + Math.random() * 1.5, k])
      .sort((a, b) => a[0] - b[0])
      .slice(0, 10)
      .map((c) => c[1]);
    mode === "flash" ? flash(cards, 0, 0) : quiz(cards, 0, 0, deck);
  }
  const promptSide = (k) =>
    L.dir === "en2x"
      ? { text: W[idxOf(k)], geez: false }
      : { text: trFor(k, L.lang).text, geez: true };
  const answerSide = (k) =>
    L.dir === "en2x"
      ? { text: trFor(k, L.lang).text, geez: true }
      : { text: W[idxOf(k)], geez: false };
  function flash(cards, i, known) {
    if (i >= cards.length) return summary(known, cards.length, "flash");
    const k = cards[i],
      p = promptSide(k),
      a = answerSide(k),
      lg = LANG[L.lang];
    const card = h(
      "button",
      {
        class: "flip",
        "aria-label": "Flip card",
        onclick: () => card.classList.toggle("on"),
      },
      h(
        "div",
        { class: "face" },
        h("small", {}, L.dir === "en2x" ? "English" : lg.native),
        h(
          "div",
          {
            class: "big" + (p.geez ? " geez" : ""),
            lang: p.geez ? L.lang : "en",
            dir: p.geez && lg.rtl ? "rtl" : null,
          },
          p.text,
        ),
        h("small", {}, "Tap to flip"),
      ),
      h(
        "div",
        { class: "face back" },
        h("small", {}, L.dir === "en2x" ? lg.native : "English"),
        h(
          "div",
          {
            class: "big" + (a.geez ? " geez" : ""),
            lang: a.geez ? L.lang : "en",
            dir: a.geez && lg.rtl ? "rtl" : null,
          },
          a.text,
        ),
        h("small", {}, firstMeaning(k, 110)),
      ),
    );
    const next = (ok) => {
      grade(k, L.lang, ok);
      flash(cards, i + 1, known + (ok ? 1 : 0));
    };
    render(
      h(
        "div",
        { class: "stack" },
        h(
          "div",
          {
            class: "progress",
            role: "progressbar",
            "aria-valuenow": i,
            "aria-valuemax": cards.length,
          },
          h("i", { style: `width:${(i / cards.length) * 100}%` }),
        ),
        h("div", { class: "flash" }, card),
        h(
          "div",
          { class: "row-btns" },
          h(
            "button",
            {
              class: "btn",
              onclick: async () => {
                if (!(await playMine(k, L.lang)))
                  speak(trFor(k, L.lang).text, lg.speech);
              },
            },
            ic("volume"),
            "Listen",
          ),
          h(
            "button",
            { class: "btn danger", onclick: () => next(false) },
            "Still learning",
          ),
          h(
            "button",
            { class: "btn primary", onclick: () => next(true) },
            "I knew it",
          ),
        ),
      ),
    );
  }
  function quiz(cards, i, score, deck) {
    if (i >= cards.length) return summary(score, cards.length, "quiz");
    const k = cards[i],
      p = promptSide(k),
      a = answerSide(k),
      lg = LANG[L.lang];
    const others = shuffle(
      deck.filter((x) => x !== k && answerSide(x).text !== a.text),
    )
      .slice(0, 3)
      .map((x) => ({ k: x, ...answerSide(x) }));
    const opts = shuffle([{ k, ...a }, ...others]);
    const fb = h("div", { class: "row-btns" });
    const buttons = opts.map((o) =>
      h(
        "button",
        {
          class: "opt",
          lang: o.geez ? L.lang : "en",
          dir: o.geez && lg.rtl ? "rtl" : null,
          style: o.geez ? "" : "font-family:var(--sans)",
          onclick: () => {
            const ok = o.k === k;
            buttons.forEach((b, j) => {
              b.disabled = true;
              if (opts[j].k === k) b.classList.add("ok");
              else if (b === btn(o)) b.classList.add("bad");
            });
            grade(k, L.lang, ok);
            fb.replaceChildren(
              h(
                "button",
                {
                  class: "btn primary",
                  onclick: () => quiz(cards, i + 1, score + (ok ? 1 : 0), deck),
                },
                i + 1 === cards.length ? "See score" : "Next ",
                ic("arrow"),
              ),
            );
            toast(ok ? "Correct!" : "Not quite. Keep going.");
          },
        },
        o.text,
      ),
    );
    const btn = (o) => buttons[opts.indexOf(o)];
    render(
      h(
        "div",
        { class: "stack" },
        h(
          "div",
          { class: "progress" },
          h("i", { style: `width:${(i / cards.length) * 100}%` }),
        ),
        h(
          "div",
          { class: "card q-prompt" },
          h(
            "small",
            { style: "color:var(--muted)" },
            `Question ${i + 1} of ${cards.length}`,
          ),
          h(
            "div",
            {
              class: "big" + (p.geez ? " geez" : ""),
              lang: p.geez ? L.lang : "en",
              dir: p.geez && lg.rtl ? "rtl" : null,
            },
            p.text,
          ),
        ),
        h("div", { class: "opts" }, buttons),
        fb,
      ),
    );
  }
  function summary(score, total, mode) {
    const pct = score / total,
      msg =
        pct === 1
          ? "Perfect! You are a word master."
          : pct >= 0.7
            ? "Great work! Keep it up."
            : pct >= 0.4
              ? "Good start. Practice again to lock it in."
              : "Every expert started here. Try again!";
    render(
      h(
        "div",
        { class: "stack" },
        h(
          "div",
          { class: "card", style: "text-align:center" },
          h(
            "p",
            { class: "eyebrow" },
            mode === "quiz" ? "Quiz complete" : "Round complete",
          ),
          h("div", { class: "score" }, `${score}/${total}`),
          h("p", {}, msg),
          h(
            "div",
            { class: "row-btns" },
            h(
              "button",
              { class: "btn primary", onclick: () => startLearn(mode) },
              "Practice again",
            ),
            h(
              "button",
              { class: "btn", onclick: () => viewLearn() },
              "Change topic",
            ),
          ),
        ),
      ),
    );
  }

  /* ---------------- library ---------------- */
  let libTab = "saved";
  function viewLibrary() {
    const tabs = [
      ["saved", `Saved (${S.fav.length})`],
      ["recent", "Recent"],
      ["mine", `My words (${Object.keys(S.mine).length})`],
    ];
    let body;
    if (libTab === "saved")
      body = S.fav.length
        ? h(
            "div",
            { class: "list" },
            S.fav.map((k) => wordItem(k)),
          )
        : empty(
            "Nothing saved yet",
            "Tap the heart on any word to keep it here, even offline.",
          );
    else if (libTab === "recent")
      body = S.hist.length
        ? h(
            "div",
            { class: "list" },
            S.hist.map((k) => wordItem(k)),
          )
        : empty("No history yet", "Words you open will appear here.");
    else
      body = Object.keys(S.mine).length
        ? h(
            "div",
            { class: "list" },
            Object.keys(S.mine).map((k) => wordItem(k)),
          )
        : empty(
            "No words of your own yet",
            "Add local words, names or slang with their meaning and translations.",
          );
    render(
      h(
        "div",
        { class: "stack" },
        h(
          "div",
          {},
          h("p", { class: "eyebrow" }, "ቤተ መጻሕፍት · Kuusaa"),
          h("h1", {}, "Library"),
        ),
        h(
          "div",
          {
            class: "row-btns",
            style: "justify-content:space-between;margin:0",
          },
          h(
            "div",
            { class: "seg" },
            tabs.map(([v, t]) =>
              h(
                "button",
                {
                  class: libTab === v ? "on" : "",
                  onclick: () => {
                    libTab = v;
                    viewLibrary();
                  },
                },
                t,
              ),
            ),
          ),
          h(
            "button",
            { class: "btn gold", onclick: () => addWordDialog() },
            ic("plus"),
            "Add a word",
          ),
        ),
        body,
      ),
    );
  }
  const empty = (t, p) =>
    h("div", { class: "card empty-state" }, h("h3", {}, t), h("p", {}, p));

  /* ============================================================ speak: record your voice, translate it */
  const SRC = [
    ["en-US", "English", "en"],
    ["am-ET", "Amharic", "am"],
    ["ar-SA", "Arabic", "ar"],
    ["so-SO", "Somali", "so"],
    ["sw-KE", "Swahili", "sw"],
    ["om", "Afaan Oromo (type it)", "om"],
    ["ti", "Tigrinya (type it)", "ti"],
  ];
  const SPEAK_TARGETS = [
    ["en", "English", "en-US"],
    ...LANGS.filter((l) => l.core).map((l) => [l.code, l.name, l.speech]),
  ];
  let spSrc = "en-US",
    spTargets = ["am", "om", "ti", "so", "ar"],
    spText = "";
  async function translateText(text, src, code) {
    try {
      const r = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, lang: code, src }),
      });
      if (r.ok) return (await r.json()).text;
    } catch {
      /* no server: use the free service directly */
    }
    try {
      // free Google translation, much better than MyMemory for these languages
      const j = await (
        await fetch(
          `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${src}&tl=${code}&dt=t&q=${enc(text)}`,
        )
      ).json();
      const t = j[0]
        .map((x) => x[0])
        .join("")
        .trim();
      if (t) return t;
    } catch {
      /* blocked or offline */
    }
    try {
      const j = await (
        await fetch(
          `https://api.mymemory.translated.net/get?q=${enc(text)}&langpair=${src}|${code}`,
        )
      ).json();
      const t = j.responseData?.translatedText;
      if (j.responseStatus === 200 && t && !/MYMEMORY WARNING/i.test(t))
        return t;
    } catch {
      /* offline or blocked */
    }
    return null;
  }
  async function toWav(blob) {
    // 16 kHz mono WAV: the format the speech-to-text service accepts
    const ctx = new (window.AudioContext || window.webkitAudioContext)(),
      buf = await ctx.decodeAudioData(await blob.arrayBuffer());
    ctx.close();
    const off = new OfflineAudioContext(
        1,
        Math.ceil(buf.duration * 16000),
        16000,
      ),
      node = off.createBufferSource();
    node.buffer = buf;
    node.connect(off.destination);
    node.start();
    const pcm = (await off.startRendering()).getChannelData(0),
      v = new DataView(new ArrayBuffer(44 + pcm.length * 2));
    const w = (o, t) =>
      [...t].forEach((c, i) => v.setUint8(o + i, c.charCodeAt(0)));
    w(0, "RIFF");
    v.setUint32(4, 36 + pcm.length * 2, true);
    w(8, "WAVEfmt ");
    v.setUint32(16, 16, true);
    v.setUint16(20, 1, true);
    v.setUint16(22, 1, true);
    v.setUint32(24, 16000, true);
    v.setUint32(28, 32000, true);
    v.setUint16(32, 2, true);
    v.setUint16(34, 16, true);
    w(36, "data");
    v.setUint32(40, pcm.length * 2, true);
    pcm.forEach((x, i) =>
      v.setInt16(44 + i * 2, Math.max(-1, Math.min(1, x)) * 0x7fff, true),
    );
    return new Blob([v], { type: "audio/wav" });
  }
  function viewSpeak() {
    const Rec = window.SpeechRecognition || window.webkitSpeechRecognition;
    let rec = null;
    const ta = h("textarea", {
      class: "say",
      rows: "3",
      placeholder: "Tap the microphone and speak, or type here…",
      "aria-label": "Text to translate",
    });
    ta.value = spText;
    ta.addEventListener("input", () => (spText = ta.value));
    const out = h("div", { class: "langs" }),
      hint = h("div", {});
    const mic = h(
      "button",
      { class: "mic", "aria-label": "Record your voice" },
      ic("mic"),
    );
    const srcCode = () => SRC.find((x) => x[0] === spSrc)[2];
    async function go(pre = {}) {
      const text = ta.value.trim();
      spText = text;
      out.replaceChildren();
      hint.replaceChildren();
      if (!text) return toast("Say or type something first.");
      const key = norm(text);
      if (srcCode() === "en" && idxOf(key) >= 0)
        hint.append(
          h(
            "a",
            { class: "btn small", href: "#/w/" + enc(key) },
            ic("search"),
            `Open “${W[idxOf(key)]}” in the dictionary`,
          ),
        );
      for (const code of spTargets.filter((c) => c !== srcCode())) {
        const l = SPEAK_TARGETS.find((x) => x[0] === code),
          tx = h(
            "div",
            { class: "tx", dir: code === "ar" ? "rtl" : null },
            "Translating…",
          );
        const row = h(
          "div",
          { class: "row" },
          h("span", { class: "src" }, "Machine"),
          h(
            "span",
            { class: "mini" },
            h(
              "button",
              {
                "aria-label": "Listen",
                onclick: () => speak(tx.textContent, l[2]),
              },
              ic("volume"),
            ),
            h(
              "button",
              { "aria-label": "Copy", onclick: () => copyText(tx.textContent) },
              ic("copy"),
            ),
          ),
        );
        out.append(
          h(
            "div",
            { class: "lang " + (LANG[code]?.cls || "x") },
            h(
              "div",
              {},
              h("div", { class: "ln" }, h("span", {}, l[1])),
              tx,
              row,
            ),
          ),
        );
        if (pre[code]) tx.textContent = pre[code];
        else
          translateText(text, srcCode(), code).then((t) => {
            tx.textContent =
              t ||
              "Could not translate. Check your connection. If you typed Amharic in Latin letters, use Amharic letters (ሰላም).";
          });
      }
    }
    const player = h("audio", {
      controls: true,
      hidden: true,
      class: "player",
      "aria-label": "Your recording",
    });
    let mr = null,
      limit = null;
    async function finish(blob) {
      if (ta.value.trim()) return go();
      if (!navigator.onLine)
        return toast(
          "Your recording is saved above. Connect to the internet to translate it, or type what you said.",
        );
      toast("Listening to your recording…");
      try {
        const fd = new FormData();
        fd.append("audio", await toWav(blob), "voice.wav");
        fd.append("src", srcCode());
        fd.append("targets", spTargets.join(","));
        const r = await fetch("/api/transcribe", { method: "POST", body: fd });
        if (r.status === 501)
          return toast(
            "Recording saved above. To turn Amharic, Oromo or Tigrinya speech into text, run app.py with GEMINI_API_KEY, or type what you said.",
          );
        if (!r.ok) throw new Error("failed");
        const j = await r.json();
        ta.value = spText = j.transcript || "";
        if (!ta.value)
          return toast("No words heard. Try again, closer to the microphone.");
        go(j.translations || {});
      } catch {
        toast(
          "Could not understand the recording. Type what you said, then tap Translate.",
        );
      }
    }
    mic.addEventListener("click", async () => {
      if (mr || rec) {
        try {
          if (rec) rec.stop();
        } catch {
          /* already stopped */
        }
        if (mr && mr.state !== "inactive") mr.stop();
        return;
      }
      const canListen = Rec && spSrc.length >= 4;
      if (!window.MediaRecorder && !canListen)
        return toast(
          "Voice recording needs Chrome or Edge. You can type instead.",
        );
      let stream = null;
      if (window.MediaRecorder && navigator.mediaDevices?.getUserMedia) {
        try {
          stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        } catch {
          return toast("Allow the microphone to record your voice.");
        }
      }
      ta.value = spText = "";
      player.hidden = true;
      out.replaceChildren();
      mic.classList.add("on");
      toast("Recording… tap the microphone again to stop.");
      if (stream) {
        // 1) really record the audio, so you can play it back
        const chunks = [];
        mr = new MediaRecorder(stream);
        mr.ondataavailable = (e) => e.data.size && chunks.push(e.data);
        mr.onstop = () => {
          clearTimeout(limit);
          stream.getTracks().forEach((t) => t.stop());
          const mime = mr.mimeType;
          mr = null;
          mic.classList.remove("on");
          const blob = new Blob(chunks, { type: mime });
          player.src = URL.createObjectURL(blob);
          player.hidden = false;
          setTimeout(() => finish(blob), 700); // let the live recognizer deliver its last words first
        };
        mr.start();
        limit = setTimeout(
          () => mr && mr.state !== "inactive" && mr.stop(),
          30000,
        );
      }
      if (canListen) {
        // 2) at the same time, live speech-to-text where the browser can do it
        try {
          rec = new Rec();
          rec.lang = spSrc;
          rec.interimResults = true;
          rec.continuous = true;
          rec.onresult = (e) => {
            ta.value = spText = [...e.results]
              .map((r) => r[0].transcript)
              .join(" ");
          };
          rec.onerror = (e) => {
            if (!stream)
              toast("Could not hear you (" + e.error + "). Try again.");
          };
          rec.onend = () => {
            rec = null;
            if (!stream) {
              mic.classList.remove("on");
              if (ta.value.trim()) go();
            }
          };
          rec.start();
        } catch {
          rec = null;
        }
      }
    });
    const sel = h(
      "select",
      {
        class: "sel",
        "aria-label": "Language you speak",
        onchange: (e) => (spSrc = e.target.value),
      },
      SRC.map(([v, n]) => h("option", { value: v, selected: v === spSrc }, n)),
    );
    const chips = h(
      "div",
      { class: "chips" },
      SPEAK_TARGETS.map(([code, name]) =>
        h(
          "button",
          {
            class: "chip" + (spTargets.includes(code) ? " on" : ""),
            "data-l": code,
            onclick: (e) => {
              spTargets = spTargets.includes(code)
                ? spTargets.filter((c) => c !== code)
                : [...spTargets, code];
              e.currentTarget.classList.toggle("on");
            },
          },
          name,
        ),
      ),
    );
    render(
      h(
        "div",
        { class: "stack" },
        h(
          "div",
          {},
          h("p", { class: "eyebrow" }, "ተናገር · Dubbadhu"),
          h("h1", {}, "Speak & translate"),
        ),
        h(
          "div",
          { class: "card stack", style: "gap:14px" },
          h("label", { class: "eyebrow" }, "I speak", sel),
          h(
            "div",
            { class: "mic-wrap" },
            mic,
            h("small", {}, "Tap to record, tap again to stop"),
          ),
          player,
          ta,
          h("div", {}, h("p", { class: "eyebrow" }, "Translate into"), chips),
          h(
            "div",
            { class: "row-btns", style: "margin:0;justify-content:flex-start" },
            h(
              "button",
              { class: "btn primary", onclick: () => go() },
              ic("globe"),
              "Translate",
            ),
          ),
        ),
        hint,
        out,
      ),
    );
  }

  /* ============================================================ router + start */
  function route() {
    if (!DATA) return;
    const hash = decodeURIComponent(location.hash.slice(1) || "/"),
      [, a, ...rest] = hash.split("/"),
      arg = rest.join("/");
    document
      .querySelectorAll(".nav a")
      .forEach((n) =>
        n.classList.toggle(
          "on",
          n.dataset.nav ===
            ({ w: "home", s: "home", t: "topics" }[a] || a || "home"),
        ),
      );
    (
      ({
        w: () => viewWord(arg),
        s: () => viewSearch(arg),
        topics: viewTopics,
        t: () => viewTopic(arg),
        learn: viewLearn,
        speak: viewSpeak,
        library: viewLibrary,
      })[a] || viewHome
    )();
  }
  async function start() {
    document.querySelectorAll("[data-i]").forEach((e) => {
      e.innerHTML = svg(e.dataset.i);
    });
    $("#settingsBtn").innerHTML = svg("gear");
    setTheme(S.theme);
    $("#themeBtn").addEventListener("click", () =>
      setTheme(
        document.documentElement.dataset.theme === "dark" ? "light" : "dark",
      ),
    );
    $("#settingsBtn").addEventListener("click", () => settingsDialog());
    matchMedia("(prefers-color-scheme: dark)").addEventListener(
      "change",
      () => S.theme === "auto" && setTheme("auto"),
    );
    window.addEventListener("online", updateStatus);
    window.addEventListener("offline", updateStatus);
    window.addEventListener("hashchange", route);
    // tapping the tab you are already on (e.g. Learn during a session) should reset that page
    document.querySelectorAll(".nav a, .brand").forEach((a) =>
      a.addEventListener("click", () => {
        const t = a.getAttribute("href");
        if (t === (location.hash || "#/")) route();
      }),
    );
    document.addEventListener("keydown", (e) => {
      if (
        e.key === "/" &&
        !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName) &&
        !$dlg.open
      ) {
        const i = $("input[type=search]");
        if (i) {
          e.preventDefault();
          i.focus();
        }
      }
    });
    if ("serviceWorker" in navigator && location.protocol.startsWith("http"))
      navigator.serviceWorker
        .register("sw.js")
        .then(() => setTimeout(updateStatus, 2500))
        .catch(() => {});
    try {
      await loadData();
    } catch (err) {
      $("#splashMsg").textContent =
        "Could not load the dictionary. Check your connection and reload.";
      return;
    }
    route();
    updateStatus();
    $("#splash").classList.add("done");
    setTimeout(() => $("#splash").remove(), 500);
  }
  start();
})();
