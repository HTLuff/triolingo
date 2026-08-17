#!/usr/bin/env python3
"""
Generate src/data/german-verbs.json — the conjugation table German Quickfire draws from.

Tenses: Präsens, Präteritum, Perfekt, Futur I, Konjunktiv II.
Persons: ich, du, er/sie/es, wir, ihr, sie/Sie.

Perfekt, Futur and Konjunktiv II are multi-word by nature ("habe gesprochen",
"werde sprechen", "würde sprechen") — that is the point, since the auxiliary is
what learners actually get wrong.

Per-verb fields:

    kind        regular | strong | mixed | modal | separable  (drives the
                "Regular only" / "Tricky only" filter in the app)
    pres        du/er present stem when the vowel changes (sprechen -> "sprich",
                fahren -> "fähr"). Suppresses the -est/-et padding, since strong
                vowel-change verbs take the short endings (du hältst, er hält).
    praesens    full 6-form present override (sein, haben, werden, modals)
    prat        Präteritum stem, taking the strong endings (-/st/-/en/t/en):
                "sprach" -> sprach, sprachst, sprach…
                With prat_weak it takes the weak endings (-e/-est/-e/-en/-et/-en)
                instead, and the stem must carry its own -t: "bracht" -> brachte,
                "konnt" -> konnte, "hatt" -> hatte. Weak verbs need no override —
                their stem gets -t (or -et after t/d) automatically.
    part        past participle. Auto for weak verbs: ge + stem + t, with -et
                padding after t/d stems, no ge- after an inseparable prefix
                (besucht, verkauft) or on -ieren verbs (studiert).
    aux         "haben" (default) or "sein" for the Perfekt
    k2          Konjunktiv II stem (wär-, hätt-, könnt-). Without it the verb
                gets the würde-form, which is what a learner would actually say.
    sep         separable prefix. The prefix trails in Präsens/Präteritum
                ("stehe auf"), joins inside the participle ("aufgestanden") and
                rejoins the infinitive in Futur/Konjunktiv II ("werde aufstehen").

Run:  python3 scripts/generate-verbs-de.py

The script prints every form it produces — read that output before committing.
Each form is shown to a learner as a correct answer.
"""
import json
from pathlib import Path

PERSONS = ["ich", "du", "er", "wir", "ihr", "sie"]

INSEPARABLE = ("be", "ge", "er", "ver", "zer", "ent", "emp", "miss")

HABEN_PRES  = ["habe", "hast", "hat", "haben", "habt", "haben"]
SEIN_PRES   = ["bin", "bist", "ist", "sind", "seid", "sind"]
WERDEN_PRES = ["werde", "wirst", "wird", "werden", "werdet", "werden"]
WUERDE      = ["würde", "würdest", "würde", "würden", "würdet", "würden"]


def needs_e(stem):
    """Stems ending in t/d (and consonant + n/m) pad the ending: arbeitest, öffnet."""
    return stem.endswith(("t", "d")) or stem.endswith(("chn", "ffn", "gn", "tm"))


def sibilant(stem):
    """s/ß/z/x stems swallow the s of -st: du heißt, du sitzt, du liest."""
    return stem.endswith(("s", "ß", "z", "x"))


def present(stem, v):
    if "praesens" in v:
        return list(v["praesens"])
    alt = v.get("pres", stem)          # du/er stem, vowel-changed for strong verbs
    pad_alt = needs_e(alt) and "pres" not in v
    pad_plain = needs_e(stem)

    du = alt + ("t" if sibilant(alt) else "est" if pad_alt else "st")
    # a vowel-changed stem already ending in -t absorbs the ending: er hält, er rät
    er = alt if (alt.endswith("t") and "pres" in v) else alt + ("et" if pad_alt else "t")
    ihr = stem + ("et" if pad_plain else "t")
    return [stem + "e", du, er, stem + "en", ihr, stem + "en"]


def praeteritum(stem, v):
    if "praeteritum" in v:
        return list(v["praeteritum"])

    if "prat" in v and not v.get("prat_weak"):
        # strong: bare stem in ich/er
        s = v["prat"]
        du = s + ("est" if needs_e(s) or sibilant(s) else "st")
        ihr = s + ("et" if needs_e(s) else "t")
        return [s, du, s, s + "en", ihr, s + "en"]

    # Weak: the -t belongs to the stem (mach- -> macht-, arbeit- -> arbeitet-),
    # then e/est/e/en/et/en. Overridden stems carry their own -t already
    # (hatt-, wurd-, konnt-, bracht-), which is why they bypass the padding.
    s = v["prat"] if "prat" in v else stem + ("et" if needs_e(stem) else "t")
    return [s + e for e in ("e", "est", "e", "en", "et", "en")]


def participle(stem, v, inf):
    if "part" in v:
        return v["part"]
    if inf.endswith("ieren") or inf.startswith(INSEPARABLE):
        return stem + ("et" if needs_e(stem) else "t")
    return "ge" + stem + ("et" if needs_e(stem) else "t")


def conjugate(v):
    inf = v["inf"]
    sep = v.get("sep", "")
    base_inf = inf[len(sep):]
    stem = base_inf[:-2] if base_inf.endswith("en") else base_inf[:-1]  # tun, sein

    pres = present(stem, v)
    prat = praeteritum(stem, v)
    part = participle(stem, v, base_inf)

    if sep:
        pres = [f"{f} {sep}" for f in pres]
        prat = [f"{f} {sep}" for f in prat]
        part = sep + part
        full_inf = inf
    else:
        full_inf = inf

    aux = SEIN_PRES if v.get("aux") == "sein" else HABEN_PRES
    perfekt = [f"{a} {part}" for a in aux]
    futur = [f"{w} {full_inf}" for w in WERDEN_PRES]

    if "k2" in v:
        k = v["k2"]
        konj = [k + e for e in ("e", "est", "e", "en", "et", "en")]
    elif "konjunktiv2" in v:
        konj = list(v["konjunktiv2"])
    else:
        konj = [f"{w} {full_inf}" for w in WUERDE]

    out = {
        "praesens": pres,
        "praeteritum": prat,
        "perfekt": perfekt,
        "futur": futur,
        "konjunktiv2": konj,
    }
    return {t: dict(zip(PERSONS, forms)) for t, forms in out.items()}


V = [
    # ---------- weak / regular ----------
    {"inf":"machen","en":"to do / make","kind":"regular"},
    {"inf":"sagen","en":"to say","kind":"regular"},
    {"inf":"fragen","en":"to ask","kind":"regular"},
    {"inf":"spielen","en":"to play","kind":"regular"},
    {"inf":"lernen","en":"to learn","kind":"regular"},
    {"inf":"wohnen","en":"to live / reside","kind":"regular"},
    {"inf":"kaufen","en":"to buy","kind":"regular"},
    {"inf":"kochen","en":"to cook","kind":"regular"},
    {"inf":"lachen","en":"to laugh","kind":"regular"},
    {"inf":"hören","en":"to hear","kind":"regular"},
    {"inf":"leben","en":"to live","kind":"regular"},
    {"inf":"lieben","en":"to love","kind":"regular"},
    {"inf":"brauchen","en":"to need","kind":"regular"},
    {"inf":"suchen","en":"to look for","kind":"regular"},
    {"inf":"zeigen","en":"to show","kind":"regular"},
    {"inf":"stellen","en":"to put / place","kind":"regular"},
    {"inf":"legen","en":"to lay","kind":"regular"},
    {"inf":"glauben","en":"to believe","kind":"regular"},
    {"inf":"danken","en":"to thank","kind":"regular"},
    {"inf":"tanzen","en":"to dance","kind":"regular"},
    {"inf":"arbeiten","en":"to work","kind":"regular"},
    {"inf":"warten","en":"to wait","kind":"regular"},
    {"inf":"reden","en":"to talk","kind":"regular"},
    {"inf":"öffnen","en":"to open","kind":"regular"},
    {"inf":"reisen","en":"to travel","kind":"regular","aux":"sein"},
    {"inf":"besuchen","en":"to visit","kind":"regular"},
    {"inf":"erzählen","en":"to tell","kind":"regular"},
    {"inf":"verkaufen","en":"to sell","kind":"regular"},
    {"inf":"bezahlen","en":"to pay","kind":"regular"},
    {"inf":"studieren","en":"to study","kind":"regular"},
    {"inf":"telefonieren","en":"to phone","kind":"regular"},
    {"inf":"probieren","en":"to try","kind":"regular"},
    {"inf":"passieren","en":"to happen","kind":"regular","aux":"sein"},
    # ---------- strong ----------
    {"inf":"sein","en":"to be","kind":"strong","aux":"sein",
     "praesens":["bin","bist","ist","sind","seid","sind"],
     "praeteritum":["war","warst","war","waren","wart","waren"],
     "part":"gewesen",
     "konjunktiv2":["wäre","wärst","wäre","wären","wärt","wären"]},
    {"inf":"haben","en":"to have","kind":"strong",
     "praesens":["habe","hast","hat","haben","habt","haben"],
     "prat":"hatt","prat_weak":True,"part":"gehabt","k2":"hätt"},
    {"inf":"werden","en":"to become","kind":"strong","aux":"sein",
     "praesens":["werde","wirst","wird","werden","werdet","werden"],
     "prat":"wurd","prat_weak":True,"part":"geworden","k2":"würd"},
    {"inf":"gehen","en":"to go","kind":"strong","aux":"sein","prat":"ging","part":"gegangen","k2":"ging"},
    {"inf":"kommen","en":"to come","kind":"strong","aux":"sein","prat":"kam","part":"gekommen","k2":"käm"},
    {"inf":"sehen","en":"to see","kind":"strong","pres":"sieh","prat":"sah","part":"gesehen","k2":"säh"},
    {"inf":"geben","en":"to give","kind":"strong","pres":"gib","prat":"gab","part":"gegeben","k2":"gäb"},
    {"inf":"nehmen","en":"to take","kind":"strong","pres":"nimm","prat":"nahm","part":"genommen","k2":"nähm"},
    {"inf":"sprechen","en":"to speak","kind":"strong","pres":"sprich","prat":"sprach","part":"gesprochen"},
    {"inf":"essen","en":"to eat","kind":"strong","pres":"iss","prat":"aß","part":"gegessen"},
    {"inf":"trinken","en":"to drink","kind":"strong","prat":"trank","part":"getrunken"},
    {"inf":"fahren","en":"to drive / go","kind":"strong","aux":"sein","pres":"fähr","prat":"fuhr","part":"gefahren"},
    {"inf":"laufen","en":"to run / walk","kind":"strong","aux":"sein","pres":"läuf","prat":"lief","part":"gelaufen"},
    {"inf":"lesen","en":"to read","kind":"strong","pres":"lies","prat":"las","part":"gelesen"},
    {"inf":"schreiben","en":"to write","kind":"strong","prat":"schrieb","part":"geschrieben"},
    {"inf":"schlafen","en":"to sleep","kind":"strong","pres":"schläf","prat":"schlief","part":"geschlafen"},
    {"inf":"tragen","en":"to carry / wear","kind":"strong","pres":"träg","prat":"trug","part":"getragen"},
    {"inf":"finden","en":"to find","kind":"strong","prat":"fand","part":"gefunden","k2":"fänd"},
    {"inf":"sitzen","en":"to sit","kind":"strong","prat":"saß","part":"gesessen"},
    {"inf":"stehen","en":"to stand","kind":"strong","prat":"stand","part":"gestanden"},
    {"inf":"liegen","en":"to lie / be located","kind":"strong","prat":"lag","part":"gelegen"},
    {"inf":"bleiben","en":"to stay","kind":"strong","aux":"sein","prat":"blieb","part":"geblieben"},
    {"inf":"heißen","en":"to be called","kind":"strong","prat":"hieß","part":"geheißen"},
    {"inf":"halten","en":"to hold / stop","kind":"strong","pres":"hält","prat":"hielt","part":"gehalten"},
    {"inf":"helfen","en":"to help","kind":"strong","pres":"hilf","prat":"half","part":"geholfen"},
    {"inf":"treffen","en":"to meet","kind":"strong","pres":"triff","prat":"traf","part":"getroffen"},
    {"inf":"vergessen","en":"to forget","kind":"strong","pres":"vergiss","prat":"vergaß","part":"vergessen"},
    {"inf":"verstehen","en":"to understand","kind":"strong","prat":"verstand","part":"verstanden"},
    {"inf":"gefallen","en":"to please / like","kind":"strong","pres":"gefäll","prat":"gefiel","part":"gefallen"},
    {"inf":"bekommen","en":"to receive","kind":"strong","prat":"bekam","part":"bekommen"},
    {"inf":"beginnen","en":"to begin","kind":"strong","prat":"begann","part":"begonnen"},
    {"inf":"gewinnen","en":"to win","kind":"strong","prat":"gewann","part":"gewonnen"},
    {"inf":"singen","en":"to sing","kind":"strong","prat":"sang","part":"gesungen"},
    {"inf":"fliegen","en":"to fly","kind":"strong","aux":"sein","prat":"flog","part":"geflogen"},
    {"inf":"schwimmen","en":"to swim","kind":"strong","aux":"sein","prat":"schwamm","part":"geschwommen"},
    {"inf":"waschen","en":"to wash","kind":"strong","pres":"wäsch","prat":"wusch","part":"gewaschen"},
    {"inf":"rufen","en":"to call / shout","kind":"strong","prat":"rief","part":"gerufen"},
    {"inf":"lassen","en":"to let / leave","kind":"strong","pres":"läss","prat":"ließ","part":"gelassen"},
    {"inf":"fallen","en":"to fall","kind":"strong","aux":"sein","pres":"fäll","prat":"fiel","part":"gefallen"},
    {"inf":"tun","en":"to do","kind":"strong","prat":"tat","part":"getan",
     "praesens":["tue","tust","tut","tun","tut","tun"]},
    {"inf":"ziehen","en":"to pull / move","kind":"strong","prat":"zog","part":"gezogen"},
    # ---------- mixed ----------
    {"inf":"bringen","en":"to bring","kind":"mixed","prat":"bracht","prat_weak":True,"part":"gebracht"},
    {"inf":"denken","en":"to think","kind":"mixed","prat":"dacht","prat_weak":True,"part":"gedacht"},
    {"inf":"kennen","en":"to know (be familiar with)","kind":"mixed","prat":"kannt","prat_weak":True,"part":"gekannt"},
    {"inf":"wissen","en":"to know (facts)","kind":"mixed",
     "praesens":["weiß","weißt","weiß","wissen","wisst","wissen"],
     "prat":"wusst","prat_weak":True,"part":"gewusst","k2":"wüsst"},
    # ---------- modals ----------
    {"inf":"können","en":"can / to be able to","kind":"modal",
     "praesens":["kann","kannst","kann","können","könnt","können"],
     "prat":"konnt","prat_weak":True,"part":"gekonnt","k2":"könnt"},
    {"inf":"müssen","en":"must / to have to","kind":"modal",
     "praesens":["muss","musst","muss","müssen","müsst","müssen"],
     "prat":"musst","prat_weak":True,"part":"gemusst","k2":"müsst"},
    {"inf":"wollen","en":"to want to","kind":"modal",
     "praesens":["will","willst","will","wollen","wollt","wollen"],
     "prat":"wollt","prat_weak":True,"part":"gewollt","k2":"wollt"},
    {"inf":"sollen","en":"should / to be supposed to","kind":"modal",
     "praesens":["soll","sollst","soll","sollen","sollt","sollen"],
     "prat":"sollt","prat_weak":True,"part":"gesollt","k2":"sollt"},
    {"inf":"dürfen","en":"may / to be allowed to","kind":"modal",
     "praesens":["darf","darfst","darf","dürfen","dürft","dürfen"],
     "prat":"durft","prat_weak":True,"part":"gedurft","k2":"dürft"},
    {"inf":"mögen","en":"to like","kind":"modal",
     "praesens":["mag","magst","mag","mögen","mögt","mögen"],
     "prat":"mocht","prat_weak":True,"part":"gemocht","k2":"möcht"},
    # ---------- separable ----------
    {"inf":"aufstehen","en":"to get up","kind":"separable","sep":"auf","aux":"sein",
     "prat":"stand","part":"gestanden"},
    {"inf":"anrufen","en":"to call (phone)","kind":"separable","sep":"an",
     "prat":"rief","part":"gerufen"},
    {"inf":"einkaufen","en":"to shop","kind":"separable","sep":"ein"},
    {"inf":"mitkommen","en":"to come along","kind":"separable","sep":"mit","aux":"sein",
     "prat":"kam","part":"gekommen"},
    {"inf":"ankommen","en":"to arrive","kind":"separable","sep":"an","aux":"sein",
     "prat":"kam","part":"gekommen"},
    {"inf":"anfangen","en":"to start","kind":"separable","sep":"an",
     "pres":"fäng","prat":"fing","part":"gefangen"},
]

def main():
    seen = set()
    out = []
    for v in V:
        if v["inf"] in seen:
            raise SystemExit(f"duplicate verb: {v['inf']}")
        seen.add(v["inf"])
        try:
            conj = conjugate(v)
        except Exception as ex:
            raise SystemExit(f"FAILED {v['inf']}: {ex}")
        out.append({
            "infinitive": v["inf"],
            "english": v["en"],
            "kind": v["kind"],
            "conjugations": conj,
        })

    path = Path(__file__).resolve().parent.parent / "src" / "data" / "german-verbs.json"
    path.write_text(json.dumps(out, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    forms = sum(len(f) for v in out for f in v["conjugations"].values())
    print(f"{len(out)} verbs, {forms} forms -> {path}")
    for v in out:
        print(v["infinitive"], "|", " · ".join(
            f"{t}: {'/'.join(f.values())}" for t, f in v["conjugations"].items()))


if __name__ == "__main__":
    main()
