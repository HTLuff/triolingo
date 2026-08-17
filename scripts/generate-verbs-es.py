#!/usr/bin/env python3
"""
Generate src/data/spanish-verbs.json — the conjugation table Quickfire draws from.

Forms are built from regular endings plus per-verb overrides, so adding a verb
usually means one line in the V list below. Overrides available per verb:

    sc          stem change applied to the boot forms: "ie" (e->ie), "ue" (o->ue),
                "i" (e->i), "uue" (u->ue, jugar)
    yo          irregular yo present (tengo, hago, conozco). Also becomes the
                subjunctive stem for every person.
    present     full present override, 5 forms, when nothing else fits
    pret_stem   strong preterite stem (tuv-, dij-); endings e/iste/o/imos/ieron,
                and -eron after a j-stem
    pret_o      irregular 3rd singular preterite (hacer -> hizo)
    preterite   full preterite override
    y_pret      i -> y in the 3rd person preterite (leyó, creyeron)
    imperfect   full imperfect override (only ser, ir, ver need it)
    fut_stem    stem for future + conditional (tendr-, dir-)
    subjunctive full present subjunctive override

Orthographic changes for -car/-gar/-zar verbs (busqué, llegué, empecé, and their
subjunctives) are handled by rule — no override needed.

Run from anywhere:  python3 scripts/generate-verbs.py

Spot-check the printed output after adding verbs. Every form here ends up in
front of a learner as a right answer, so treat a wrong one as a bug.
"""
import json
from pathlib import Path

PERSONS = ["yo", "tu", "el", "nosotros", "ellos"]

REG = {
    "present":   {"ar": ["o","as","a","amos","an"],       "er": ["o","es","e","emos","en"],      "ir": ["o","es","e","imos","en"]},
    "preterite": {"ar": ["é","aste","ó","amos","aron"],   "er": ["í","iste","ió","imos","ieron"],"ir": ["í","iste","ió","imos","ieron"]},
    "imperfect": {"ar": ["aba","abas","aba","ábamos","aban"], "er": ["ía","ías","ía","íamos","ían"], "ir": ["ía","ías","ía","íamos","ían"]},
}
FUT_END  = ["é","ás","á","emos","án"]
COND_END = ["ía","ías","ía","íamos","ían"]
SUBJ_END = {"ar": ["e","es","e","emos","en"], "er": ["a","as","a","amos","an"], "ir": ["a","as","a","amos","an"]}
STRONG_END = ["e","iste","o","imos","ieron"]


def apply_change(stem, kind):
    """Boot-form stem change, applied to the last stem vowel."""
    src, dst = {"ie": ("e","ie"), "ue": ("o","ue"), "i": ("e","i"), "uue": ("u","ue")}[kind]
    idx = stem.rfind(src)
    if idx == -1:
        raise ValueError(f"no '{src}' in stem {stem}")
    return stem[:idx] + dst + stem[idx+1:]


def weak_change(stem, kind):
    """The -ir 'weak' change: e->i, o->u. Used in the 3rd person preterite and
    the nosotros subjunctive (durmió, pidamos)."""
    if kind in ("ie", "i"):
        src, dst = "e", "i"
    elif kind == "ue":
        src, dst = "o", "u"
    else:
        return stem
    idx = stem.rfind(src)
    return stem[:idx] + dst + stem[idx+1:] if idx != -1 else stem


def conjugate(v):
    inf = v["inf"]
    group = "ir" if inf.endswith("ír") else inf[-2:]
    stem = inf[:-2]
    sc = v.get("sc")
    out = {}

    # ---- present ----
    if "present" in v:
        pres = list(v["present"])
    else:
        boot = apply_change(stem, sc) if sc else stem
        e = REG["present"][group]
        pres = [boot+e[0], boot+e[1], boot+e[2], stem+e[3], boot+e[4]]
        if "yo" in v:
            pres[0] = v["yo"]
    out["present"] = pres

    # ---- preterite ----
    if "preterite" in v:
        pret = list(v["preterite"])
    elif "pret_stem" in v:
        ps = v["pret_stem"]
        end = list(STRONG_END)
        if ps.endswith("j"):
            end[4] = "eron"
        pret = [ps+e for e in end]
        if v.get("pret_o"):
            pret[2] = v["pret_o"]
    else:
        e = list(REG["preterite"][group])
        yo_stem = stem
        if group == "ar":
            if inf.endswith("car"):   yo_stem = stem[:-1] + "qu"
            elif inf.endswith("gar"): yo_stem = stem[:-1] + "gu"
            elif inf.endswith("zar"): yo_stem = stem[:-1] + "c"
        third = stem
        if group == "ir" and sc:
            third = weak_change(stem, sc)
        elif v.get("y_pret"):
            e[2], e[4] = "yó", "yeron"
            e[1], e[3] = "íste", "ímos"
        pret = [yo_stem+e[0], stem+e[1], third+e[2], stem+e[3], third+e[4]]
    out["preterite"] = pret

    # ---- imperfect ----
    if "imperfect" in v:
        out["imperfect"] = list(v["imperfect"])
    else:
        e = REG["imperfect"][group]
        out["imperfect"] = [stem+x for x in e]

    # ---- future / conditional ----
    fs = v.get("fut_stem", inf)
    out["future"] = [fs+e for e in FUT_END]
    out["conditional"] = [fs+e for e in COND_END]

    # ---- present subjunctive ----
    if "subjunctive" in v:
        out["subjunctive"] = list(v["subjunctive"])
    else:
        yo_form = pres[0]
        if not yo_form.endswith("o"):
            raise ValueError(f"{inf}: cannot derive subjunctive from yo '{yo_form}' — needs a subjunctive override")
        boot_stem = yo_form[:-1]
        if not sc or v.get("yo"):
            # regular verbs, and verbs whose yo-form carries a consonant
            # irregularity (tengo -> tengamos, digo -> digamos), keep the
            # yo-stem throughout
            nos_stem = boot_stem
        else:
            # pure vowel stem-changers revert in nosotros (-ar/-er) or weaken (-ir)
            nos_stem = weak_change(stem, sc) if group == "ir" else stem
        if group == "ar":
            if inf.endswith("car"):
                boot_stem, nos_stem = boot_stem[:-1] + "qu", nos_stem[:-1] + "qu"
            elif inf.endswith("gar"):
                boot_stem, nos_stem = boot_stem[:-1] + "gu", nos_stem[:-1] + "gu"
            elif inf.endswith("zar"):
                boot_stem, nos_stem = boot_stem[:-1] + "c",  nos_stem[:-1] + "c"
        e = SUBJ_END[group]
        out["subjunctive"] = [boot_stem+e[0], boot_stem+e[1], boot_stem+e[2], nos_stem+e[3], boot_stem+e[4]]

    return {t: dict(zip(PERSONS, forms)) for t, forms in out.items()}


# kind drives the "Verbs" filter on the Quickfire setup screen:
#   regular / spelling -> "Regular only",  stem / irregular -> "Tricky only"
V = [
    # ---------- regular -ar ----------
    {"inf":"hablar","en":"to speak","kind":"regular"},
    {"inf":"trabajar","en":"to work","kind":"regular"},
    {"inf":"estudiar","en":"to study","kind":"regular"},
    {"inf":"tomar","en":"to take / drink","kind":"regular"},
    {"inf":"llamar","en":"to call","kind":"regular"},
    {"inf":"llevar","en":"to carry / wear","kind":"regular"},
    {"inf":"dejar","en":"to leave / let","kind":"regular"},
    {"inf":"mirar","en":"to look at","kind":"regular"},
    {"inf":"esperar","en":"to wait / hope","kind":"regular"},
    {"inf":"necesitar","en":"to need","kind":"regular"},
    {"inf":"ayudar","en":"to help","kind":"regular"},
    {"inf":"comprar","en":"to buy","kind":"regular"},
    {"inf":"escuchar","en":"to listen","kind":"regular"},
    {"inf":"viajar","en":"to travel","kind":"regular"},
    {"inf":"cocinar","en":"to cook","kind":"regular"},
    {"inf":"caminar","en":"to walk","kind":"regular"},
    {"inf":"pasar","en":"to pass / spend (time)","kind":"regular"},
    {"inf":"terminar","en":"to finish","kind":"regular"},
    {"inf":"usar","en":"to use","kind":"regular"},
    {"inf":"entrar","en":"to enter","kind":"regular"},
    # ---------- regular -er ----------
    {"inf":"comer","en":"to eat","kind":"regular"},
    {"inf":"beber","en":"to drink","kind":"regular"},
    {"inf":"aprender","en":"to learn","kind":"regular"},
    {"inf":"correr","en":"to run","kind":"regular"},
    {"inf":"comprender","en":"to understand","kind":"regular"},
    {"inf":"deber","en":"to owe / should","kind":"regular"},
    {"inf":"vender","en":"to sell","kind":"regular"},
    # ---------- regular -ir ----------
    {"inf":"vivir","en":"to live","kind":"regular"},
    {"inf":"escribir","en":"to write","kind":"regular"},
    {"inf":"abrir","en":"to open","kind":"regular"},
    {"inf":"recibir","en":"to receive","kind":"regular"},
    {"inf":"decidir","en":"to decide","kind":"regular"},
    {"inf":"subir","en":"to go up","kind":"regular"},
    # ---------- spelling changes ----------
    {"inf":"llegar","en":"to arrive","kind":"spelling"},
    {"inf":"pagar","en":"to pay","kind":"spelling"},
    {"inf":"buscar","en":"to look for","kind":"spelling"},
    {"inf":"tocar","en":"to touch / play (music)","kind":"spelling"},
    {"inf":"leer","en":"to read","kind":"spelling","y_pret":True},
    {"inf":"creer","en":"to believe","kind":"spelling","y_pret":True},
    # ---------- stem changers ----------
    {"inf":"pensar","en":"to think","kind":"stem","sc":"ie"},
    {"inf":"cerrar","en":"to close","kind":"stem","sc":"ie"},
    {"inf":"empezar","en":"to begin","kind":"stem","sc":"ie"},
    {"inf":"entender","en":"to understand","kind":"stem","sc":"ie"},
    {"inf":"perder","en":"to lose","kind":"stem","sc":"ie"},
    {"inf":"volver","en":"to return","kind":"stem","sc":"ue"},
    {"inf":"contar","en":"to count / tell","kind":"stem","sc":"ue"},
    {"inf":"encontrar","en":"to find","kind":"stem","sc":"ue"},
    {"inf":"recordar","en":"to remember","kind":"stem","sc":"ue"},
    {"inf":"dormir","en":"to sleep","kind":"stem","sc":"ue"},
    {"inf":"pedir","en":"to ask for","kind":"stem","sc":"i"},
    {"inf":"servir","en":"to serve","kind":"stem","sc":"i"},
    {"inf":"repetir","en":"to repeat","kind":"stem","sc":"i"},
    {"inf":"sentir","en":"to feel","kind":"stem","sc":"ie"},
    {"inf":"preferir","en":"to prefer","kind":"stem","sc":"ie"},
    {"inf":"jugar","en":"to play","kind":"stem","sc":"uue"},
    {"inf":"seguir","en":"to follow / continue","kind":"stem","sc":"i","yo":"sigo",
     "subjunctive":["siga","sigas","siga","sigamos","sigan"]},
    # ---------- irregulars ----------
    {"inf":"ser","en":"to be (permanent)","kind":"irregular",
     "present":["soy","eres","es","somos","son"],
     "preterite":["fui","fuiste","fue","fuimos","fueron"],
     "imperfect":["era","eras","era","éramos","eran"],
     "subjunctive":["sea","seas","sea","seamos","sean"]},
    {"inf":"estar","en":"to be (state / place)","kind":"irregular",
     "present":["estoy","estás","está","estamos","están"],
     "pret_stem":"estuv",
     "subjunctive":["esté","estés","esté","estemos","estén"]},
    {"inf":"ir","en":"to go","kind":"irregular",
     "present":["voy","vas","va","vamos","van"],
     "preterite":["fui","fuiste","fue","fuimos","fueron"],
     "imperfect":["iba","ibas","iba","íbamos","iban"],
     "subjunctive":["vaya","vayas","vaya","vayamos","vayan"]},
    {"inf":"tener","en":"to have","kind":"irregular","sc":"ie","yo":"tengo",
     "pret_stem":"tuv","fut_stem":"tendr"},
    {"inf":"hacer","en":"to do / make","kind":"irregular","yo":"hago",
     "pret_stem":"hic","pret_o":"hizo","fut_stem":"har"},
    {"inf":"poder","en":"to be able / can","kind":"irregular","sc":"ue",
     "pret_stem":"pud","fut_stem":"podr"},
    {"inf":"decir","en":"to say / tell","kind":"irregular","sc":"i","yo":"digo",
     "pret_stem":"dij","fut_stem":"dir"},
    {"inf":"ver","en":"to see","kind":"irregular",
     "present":["veo","ves","ve","vemos","ven"],
     "preterite":["vi","viste","vio","vimos","vieron"],
     "imperfect":["veía","veías","veía","veíamos","veían"]},
    {"inf":"dar","en":"to give","kind":"irregular",
     "present":["doy","das","da","damos","dan"],
     "preterite":["di","diste","dio","dimos","dieron"],
     "subjunctive":["dé","des","dé","demos","den"]},
    {"inf":"saber","en":"to know (facts)","kind":"irregular",
     "present":["sé","sabes","sabe","sabemos","saben"],
     "pret_stem":"sup","fut_stem":"sabr",
     "subjunctive":["sepa","sepas","sepa","sepamos","sepan"]},
    {"inf":"querer","en":"to want / love","kind":"irregular","sc":"ie",
     "pret_stem":"quis","fut_stem":"querr"},
    {"inf":"poner","en":"to put","kind":"irregular","yo":"pongo",
     "pret_stem":"pus","fut_stem":"pondr"},
    {"inf":"venir","en":"to come","kind":"irregular","sc":"ie","yo":"vengo",
     "pret_stem":"vin","fut_stem":"vendr"},
    {"inf":"salir","en":"to leave / go out","kind":"irregular","yo":"salgo","fut_stem":"saldr"},
    {"inf":"traer","en":"to bring","kind":"irregular","yo":"traigo","pret_stem":"traj"},
    {"inf":"conocer","en":"to know (people / places)","kind":"irregular","yo":"conozco"},
    {"inf":"oír","en":"to hear","kind":"irregular","fut_stem":"oir",
     "present":["oigo","oyes","oye","oímos","oyen"],
     "preterite":["oí","oíste","oyó","oímos","oyeron"],
     "subjunctive":["oiga","oigas","oiga","oigamos","oigan"]},
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

    path = Path(__file__).resolve().parent.parent / "src" / "data" / "spanish-verbs.json"
    path.write_text(json.dumps(out, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    forms = sum(len(f) for v in out for f in v["conjugations"].values())
    print(f"{len(out)} verbs, {forms} forms -> {path}")
    for v in out:
        print(v["infinitive"], "|", " · ".join(
            f"{t}: {'/'.join(f.values())}" for t, f in v["conjugations"].items()))


if __name__ == "__main__":
    main()
