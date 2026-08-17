#!/usr/bin/env python3
"""
Generate src/data/stories/cafe-muenchen.json — the German story, "Café in München".

Each line is authored ONCE, as a list of tokens in German word order. The three
reading levels are derived from it, so a0's word order can't drift from a2's:

    a0   English words in German order; content words carry the German reveal
    a1   content words switch to German, function words stay English
    a2   real German, with an English gloss on anything non-obvious

Token syntax:  [leading punctuation][*]german[:english][trailing punctuation]

    Haus:house      German word with its English counterpart
    Café            same word in both languages — no gloss is emitted
    *arbeitet:works the * marks a content word: it gets the reveal at a0 and
                    switches to German at a1
    zum_ersten_Mal:for_the_first_time   underscores become spaces

Because a0 is generated from the same token order as a2, the levels teach word
order for free: "Every morning opens Lena at seven" shows the verb-second rule
before the learner meets a single German word.

Run:  python3 scripts/generate-story-de.py
"""
import json
from pathlib import Path

LEAD = '"„(¿'
TRAIL = '.,!?";:…'


def parse(spec):
    """One token spec -> (german, english, is_content_word)."""
    lead = ''
    while spec and spec[0] in LEAD:
        lead, spec = lead + spec[0], spec[1:]

    key = spec.startswith('*')
    spec = spec.lstrip('*')

    de, en = spec.split(':', 1) if ':' in spec else (spec, spec)
    en = en.replace('_', ' ')

    trail = ''
    while en and en[-1] in TRAIL:
        trail, en = en[-1] + trail, en[:-1]
    while de and de[-1] in TRAIL:
        de = de[:-1]

    return lead + de + trail, lead + en + trail, key


def build_line(speaker, english, spec):
    tokens = [parse(t) for t in spec.split()]

    a0, a1, a2 = [], [], []
    for de, en, key in tokens:
        # a0: English throughout, German revealed behind the content words
        a0.append({"t": en, "r": de} if key else {"t": en})
        # a1: content words in German with a gloss, the frame still English
        a1.append({"t": de, "g": en} if key else {"t": en})
        # a2: all German; gloss anything whose English differs
        a2.append({"t": de, "g": en} if de != en else {"t": de})

    line = {"en": english, "a0": a0, "a1": a1, "a2": a2}
    if speaker:
        line = {"speaker": speaker, **line}
    return line


# Each line: (speaker or None, natural English, token spec in German order)
CHAPTERS = [
 (1, "Das Café", [
  (None, "Lena works in a café in Munich.",
   "Lena *arbeitet:works in einem:a Café in München:Munich."),
  (None, "The café is called Café Luna.",
   "Das:The Café *heißt:is_called Café Luna."),
  (None, "It is small and very cosy.",
   "Es:It *ist:is *klein:small und:and *sehr:very *gemütlich:cosy."),
  (None, "Every morning Lena opens at seven.",
   "*Jeden:Every *Morgen:morning *öffnet:opens Lena um:at *sieben:seven *Uhr:o'clock."),
  (None, "She makes coffee and cuts cake.",
   "Sie:She *macht:makes *Kaffee:coffee und:and *schneidet:cuts *Kuchen:cake."),
  (None, "The first guests come at half past seven.",
   "Die:The *ersten:first *Gäste:guests *kommen:come um:at *halb:half *acht:eight."),
  (None, "Lena knows almost all the guests.",
   "Lena *kennt:knows *fast:almost *alle:all *Gäste:guests."),
  (None, "Mr Weber always drinks an espresso.",
   "Herr:Mr Weber *trinkt:drinks *immer:always einen:an Espresso."),
  (None, "Mrs Koch takes tea with milk.",
   "Frau:Mrs Koch *nimmt:takes *Tee:tea mit:with *Milch:milk."),
  (None, "Today a new guest comes into the café.",
   "*Heute:Today *kommt:comes ein:a *neuer:new *Gast:guest ins:into_the Café."),
  (None, "He is tall and wears a blue coat.",
   "Er:He *ist:is *groß:tall und:and *trägt:wears einen:a *blauen:blue *Mantel:coat."),
  ("Daniel", "\"Good morning,\" he says.",
   "\"*Guten:Good *Morgen:morning\", *sagt:says er:he."),
  ("Lena", "\"Good morning,\" Lena answers.",
   "\"*Guten:Good *Morgen:morning\", *antwortet:answers Lena."),
  ("Lena", "\"What would you like?\" she asks.",
   "\"*Was:What *möchten:would_like Sie:you?\" *fragt:asks sie:she."),
  ("Daniel", "\"A coffee, please,\" says the man.",
   "\"Einen:A *Kaffee:coffee, *bitte:please\", *sagt:says der:the *Mann:man."),
  (None, "Lena makes the coffee and smiles.",
   "Lena *macht:makes den:the *Kaffee:coffee und:and *lächelt:smiles."),
  ("Lena", "\"Are you new here?\" she asks.",
   "\"*Sind:Are Sie:you *neu:new *hier:here?\" *fragt:asks sie:she."),
  ("Daniel", "\"Yes, I have lived in Munich for a week,\" he answers.",
   "\"*Ja:Yes, ich:I *wohne:live *seit:since einer:a *Woche:week in München:Munich\", *antwortet:answers er:he."),
  ("Daniel", "\"My name is Daniel.\"",
   "\"Ich:I *heiße:am_called Daniel.\""),
  ("Lena", "\"Welcome to Munich, Daniel,\" says Lena.",
   "\"*Willkommen:Welcome in:in München:Munich, Daniel\", *sagt:says Lena."),
 ]),

 (2, "Noch einmal", [
  (None, "The next morning Daniel comes again.",
   "Am:On_the *nächsten:next *Morgen:morning *kommt:comes Daniel *wieder:again."),
  (None, "He sits down by the window.",
   "Er:He *setzt:sits sich:himself ans:at_the *Fenster:window."),
  (None, "Lena brings him a coffee.",
   "Lena *bringt:brings ihm:him einen:a *Kaffee:coffee."),
  ("Daniel", "\"Thank you,\" he says.",
   "\"*Danke:Thank_you\", *sagt:says er:he."),
  ("Lena", "\"Do you work near here?\" Lena asks.",
   "\"*Arbeiten:Work Sie:you hier:here in:in der:the *Nähe:vicinity?\" *fragt:asks Lena."),
  ("Daniel", "\"Yes, I work in an office on Marienplatz.\"",
   "\"*Ja:Yes, ich:I *arbeite:work in einem:an *Büro:office am:on_the Marienplatz.\""),
  ("Daniel", "\"I'm an architect.\"",
   "\"Ich:I *bin:am *Architekt:architect.\""),
  ("Lena", "\"That's interesting,\" says Lena.",
   "\"Das:That *ist:is *interessant:interesting\", *sagt:says Lena."),
  (None, "Daniel reads the newspaper every morning.",
   "Daniel *liest:reads *jeden:every *Morgen:morning die:the *Zeitung:newspaper."),
  (None, "He stays half an hour.",
   "Er:He *bleibt:stays eine:a *halbe:half *Stunde:hour."),
  (None, "Then he goes to work.",
   "*Dann:Then *geht:goes er:he zur:to_the *Arbeit:work."),
  (None, "On Thursday it rains hard.",
   "Am:On_the *Donnerstag:Thursday *regnet:rains es:it *stark:hard."),
  (None, "Daniel comes into the café soaking wet.",
   "Daniel *kommt:comes *nass:wet ins:into_the Café."),
  ("Lena", "\"You need a hot tea,\" says Lena.",
   "\"Sie:You *brauchen:need einen:a *heißen:hot *Tee:tea\", *sagt:says Lena."),
  (None, "She gives him the tea and a piece of cake.",
   "Sie:She *gibt:gives ihm:him den:the *Tee:tea und:and ein:a *Stück:piece *Kuchen:of_cake."),
  ("Lena", "\"The cake is from me,\" she says.",
   "\"Der:The *Kuchen:cake *ist:is von:from mir:me\", *sagt:says sie:she."),
  (None, "Daniel laughs for the first time.",
   "Daniel *lacht:laughs zum:for_the *ersten:first *Mal:time."),
  ("Daniel", "\"Thank you very much, that's very kind.\"",
   "\"*Vielen:Many *Dank:thanks, das:that *ist:is *sehr:very *nett:kind.\""),
  (None, "That day he stays an hour.",
   "An:On *diesem:this *Tag:day *bleibt:stays er:he eine:an *Stunde:hour."),
  (None, "Lena thinks about him all day.",
   "Lena *denkt:thinks den:the *ganzen:whole *Tag:day an:of ihn:him."),
 ]),

 (3, "Sophie", [
  (None, "Lena works with her friend Sophie.",
   "Lena *arbeitet:works mit:with ihrer:her *Freundin:friend Sophie."),
  (None, "Sophie is young and very funny.",
   "Sophie *ist:is *jung:young und:and *sehr:very *lustig:funny."),
  ("Sophie", "\"Who is the man over there?\" Sophie asks.",
   "\"*Wer:Who *ist:is der:the *Mann:man *dort:over_there?\" *fragt:asks Sophie."),
  ("Lena", "\"That's Daniel, a new guest,\" Lena answers.",
   "\"Das:That *ist:is Daniel, ein:a *neuer:new *Gast:guest\", *antwortet:answers Lena."),
  ("Sophie", "\"He looks good,\" says Sophie with a smile.",
   "\"Er:He *sieht:looks *gut:good aus:out\", *sagt:says Sophie mit:with einem:a *Lächeln:smile."),
  (None, "Lena laughs, but she doesn't answer.",
   "Lena *lacht:laughs, *aber:but sie:she *antwortet:answers *nicht:not."),
  ("Sophie", "\"You like him,\" says Sophie.",
   "\"Du:You *magst:like ihn:him\", *sagt:says Sophie."),
  ("Lena", "\"He's only a guest,\" Lena says quickly.",
   "\"Er:He *ist:is *nur:only ein:a *Gast:guest\", *sagt:says Lena *schnell:quickly."),
  ("Sophie", "\"Of course,\" says Sophie. \"Only a guest.\"",
   "\"*Natürlich:Of_course\", *sagt:says Sophie. \"*Nur:Only ein:a *Gast:guest.\""),
  (None, "On Friday Daniel comes at eight.",
   "Am:On_the *Freitag:Friday *kommt:comes Daniel um:at *acht:eight *Uhr:o'clock."),
  (None, "Sophie is standing behind the counter.",
   "Sophie *steht:stands *hinter:behind der:the *Theke:counter."),
  ("Sophie", "\"Good morning,\" she says loudly. \"Lena is in the kitchen!\"",
   "\"*Guten:Good *Morgen:morning\", *sagt:says sie:she *laut:loudly. \"Lena *ist:is in der:the *Küche:kitchen!\""),
  (None, "Lena goes red.",
   "Lena *wird:becomes *rot:red."),
  (None, "She comes slowly out of the kitchen.",
   "Sie:She *kommt:comes *langsam:slowly aus:out_of der:the *Küche:kitchen."),
  ("Lena", "\"Good morning, Daniel.\"",
   "\"*Guten:Good *Morgen:morning, Daniel.\""),
  ("Daniel", "\"Good morning, Lena.\"",
   "\"*Guten:Good *Morgen:morning, Lena.\""),
  (None, "Sophie looks at the two of them and smiles.",
   "Sophie *sieht:looks die:the *beiden:two_of_them an:at und:and *lächelt:smiles."),
  ("Sophie", "Later she says: \"He isn't coming for the coffee.\"",
   "*Später:Later *sagt:says sie:she: \"Er:He *kommt:comes *nicht:not *wegen:because_of des:the *Kaffees:coffee.\""),
  ("Lena", "\"The coffee here is very good,\" says Lena.",
   "\"Der:The *Kaffee:coffee *hier:here *ist:is *sehr:very *gut:good\", *sagt:says Lena."),
  ("Sophie", "\"Yes,\" says Sophie. \"But he comes because of you.\"",
   "\"*Ja:Yes\", *sagt:says Sophie. \"*Aber:But er:he *kommt:comes *wegen:because_of dir:you.\""),
 ]),

 (4, "Die Einladung", [
  (None, "It's Saturday and the café is full.",
   "Es:It *ist:is *Samstag:Saturday und:and das:the Café *ist:is *voll:full."),
  (None, "Daniel sits at his table by the window.",
   "Daniel *sitzt:sits an:at seinem:his *Tisch:table am:by_the *Fenster:window."),
  (None, "He waits until the café gets emptier.",
   "Er:He *wartet:waits, *bis:until das:the Café *leerer:emptier *wird:becomes."),
  (None, "At four o'clock he stands up.",
   "Um:At *vier:four *Uhr:o'clock *steht:stands er:he auf:up."),
  (None, "He walks slowly to the counter.",
   "Er:He *geht:goes *langsam:slowly zur:to_the *Theke:counter."),
  ("Daniel", "\"Lena, I'd like to ask you something.\"",
   "\"Lena, ich:I *möchte:would_like Sie:you *etwas:something *fragen:ask.\""),
  (None, "Lena puts the cup down and listens.",
   "Lena *stellt:puts die:the *Tasse:cup hin:down und:and *hört:listens zu:to."),
  ("Daniel", "\"Do you have time on Sunday?\"",
   "\"*Haben:Have Sie:you am:on_the *Sonntag:Sunday *Zeit:time?\""),
  ("Daniel", "\"We could eat together.\"",
   "\"Wir:We *könnten:could *zusammen:together *essen:eat *gehen:go.\""),
  (None, "Lena says nothing for a moment.",
   "Lena *sagt:says *nichts:nothing für:for einen:a *Moment:moment."),
  (None, "Her heart beats fast.",
   "Ihr:Her *Herz:heart *schlägt:beats *schnell:fast."),
  ("Lena", "\"Yes,\" she says quietly. \"I'd love to.\"",
   "\"*Ja:Yes\", *sagt:says sie:she *leise:quietly. \"*Sehr:Very *gern:gladly.\""),
  ("Daniel", "Daniel smiles. \"At seven?\"",
   "Daniel *lächelt:smiles. \"Um:At *sieben:seven *Uhr:o'clock?\""),
  ("Lena", "\"At seven,\" Lena repeats.",
   "\"Um:At *sieben:seven *Uhr:o'clock\", *wiederholt:repeats Lena."),
  (None, "He writes his number on a napkin.",
   "Er:He *schreibt:writes seine:his *Nummer:number auf:on eine:a *Serviette:napkin."),
  (None, "Then he goes out of the café.",
   "*Dann:Then *geht:goes er:he aus:out_of dem:the Café."),
  (None, "Sophie comes straight over to Lena.",
   "Sophie *kommt:comes *sofort:immediately zu:to Lena."),
  ("Sophie", "\"What did he say?\" she asks.",
   "\"*Was:What *hat:has er:he *gesagt:said?\" *fragt:asks sie:she."),
  ("Lena", "\"We're eating together tomorrow,\" says Lena.",
   "\"Wir:We *essen:eat *morgen:tomorrow *zusammen:together\", *sagt:says Lena."),
  (None, "Sophie almost shouts with joy.",
   "Sophie *schreit:shouts *fast:almost vor:with *Freude:joy."),
 ]),

 (5, "Das Abendessen", [
  (None, "On Sunday evening it isn't raining any more.",
   "Am:On_the *Sonntagabend:Sunday_evening *regnet:rains es:it *nicht:not *mehr:more."),
  (None, "Lena wears a blue dress.",
   "Lena *trägt:wears ein:a *blaues:blue *Kleid:dress."),
  (None, "She's nervous and arrives too early.",
   "Sie:She *ist:is *nervös:nervous und:and *kommt:comes zu:too *früh:early."),
  (None, "The restaurant is near the river.",
   "Das:The *Restaurant:restaurant *liegt:lies in der:the *Nähe:vicinity vom:of_the *Fluss:river."),
  (None, "Daniel is already waiting outside the door.",
   "Daniel *wartet:waits *schon:already vor:in_front_of der:the *Tür:door."),
  ("Daniel", "\"You look beautiful,\" he says.",
   "\"Du:You *siehst:look *wunderschön:beautiful aus:out\", *sagt:says er:he."),
  (None, "For the first time he says \"du\".",
   "Zum:For_the *ersten:first *Mal:time *sagt:says er:he \"du\"."),
  (None, "They sit down at a table by the window.",
   "Sie:They *setzen:sit sich:themselves an:at einen:a *Tisch:table am:by_the *Fenster:window."),
  (None, "The waiter brings the menu.",
   "Der:The *Kellner:waiter *bringt:brings die:the *Karte:menu."),
  (None, "Lena orders fish, Daniel takes the soup.",
   "Lena *bestellt:orders *Fisch:fish, Daniel *nimmt:takes die:the *Suppe:soup."),
  (None, "They talk about their families.",
   "Sie:They *sprechen:speak *über:about ihre:their *Familien:families."),
  (None, "Daniel has a brother in Hamburg.",
   "Daniel *hat:has einen:a *Bruder:brother in Hamburg."),
  (None, "Lena talks about her mother in Rosenheim.",
   "Lena *erzählt:tells von:of ihrer:her *Mutter:mother in Rosenheim."),
  ("Lena", "\"Why did you come to Munich?\" she asks.",
   "\"*Warum:Why *bist:are du:you nach:to München:Munich *gekommen:come?\" *fragt:asks sie:she."),
  ("Daniel", "\"Because of work,\" he says. \"And now I'm glad to stay.\"",
   "\"*Wegen:Because_of der:the *Arbeit:work\", *sagt:says er:he. \"Und:And *jetzt:now *bleibe:stay ich:I *gern:gladly.\""),
  (None, "They eat slowly and laugh a lot.",
   "Sie:They *essen:eat *langsam:slowly und:and *lachen:laugh *viel:a_lot."),
  (None, "After the meal they walk along the river.",
   "Nach:After dem:the *Essen:meal *gehen:go sie:they am:along_the *Fluss:river *spazieren:for_a_walk."),
  (None, "The city is quiet and the air is cool.",
   "Die:The *Stadt:city *ist:is *ruhig:quiet und:and die:the *Luft:air *ist:is *kühl:cool."),
  (None, "At the bridge Daniel stops.",
   "An:At der:the *Brücke:bridge *bleibt:stays Daniel *stehen:standing."),
  ("Daniel", "\"I'm glad that I came into your café.\"",
   "\"Ich:I *bin:am *froh:glad, *dass:that ich:I in dein:your Café *gekommen:come *bin:am.\""),
 ]),

 (6, "Ein Problem im Büro", [
  (None, "On Monday Daniel doesn't come to the café.",
   "Am:On_the *Montag:Monday *kommt:comes Daniel *nicht:not ins:into_the Café."),
  (None, "He doesn't come on Tuesday either.",
   "*Auch:Also am:on_the *Dienstag:Tuesday *kommt:comes er:he *nicht:not."),
  (None, "Lena often looks towards the door.",
   "Lena *schaut:looks *oft:often zur:to_the *Tür:door."),
  ("Sophie", "\"Maybe he's ill,\" says Sophie.",
   "\"*Vielleicht:Maybe *ist:is er:he *krank:ill\", *sagt:says Sophie."),
  (None, "On Wednesday Lena writes him a message.",
   "Am:On_the *Mittwoch:Wednesday *schreibt:writes Lena ihm:him eine:a *Nachricht:message."),
  (None, "He only answers in the evening.",
   "Er:He *antwortet:answers *erst:only am:in_the *Abend:evening."),
  ("Daniel", "\"I'm sorry. We have a problem at the office.\"",
   "\"Es:It *tut:does mir:me *leid:sorry. Wir:We *haben:have ein:a *Problem:problem im:in_the *Büro:office.\""),
  ("Daniel", "\"I work until eleven every day.\"",
   "\"Ich:I *arbeite:work *jeden:every *Tag:day *bis:until *elf:eleven *Uhr:o'clock.\""),
  (None, "Lena understands, but she's sad.",
   "Lena *versteht:understands es:it, *aber:but sie:she *ist:is *traurig:sad."),
  (None, "On Thursday the café is very full.",
   "Am:On_the *Donnerstag:Thursday *ist:is das:the Café *sehr:very *voll:full."),
  (None, "A cup falls on the floor.",
   "Eine:A *Tasse:cup *fällt:falls auf:on den:the *Boden:floor."),
  (None, "Lena cuts her finger.",
   "Lena *schneidet:cuts sich:herself in den:the *Finger:finger."),
  (None, "Sophie helps her straight away.",
   "Sophie *hilft:helps ihr:her *sofort:immediately."),
  ("Sophie", "\"Go home,\" says Sophie. \"I'll do this.\"",
   "\"*Geh:Go nach:to *Hause:home\", *sagt:says Sophie. \"Ich:I *mache:do das:this.\""),
  (None, "Lena goes home and falls asleep early.",
   "Lena *geht:goes nach:to *Hause:home und:and *schläft:sleeps *früh:early ein:in."),
  (None, "At midnight her phone rings.",
   "Um:At *Mitternacht:midnight *klingelt:rings ihr:her *Handy:phone."),
  ("Daniel", "It's Daniel. \"Are you still awake?\"",
   "Es:It *ist:is Daniel. \"*Bist:Are du:you *noch:still *wach:awake?\""),
  ("Lena", "\"I am now,\" says Lena, laughing.",
   "\"*Jetzt:Now *schon:already\", *sagt:says Lena und:and *lacht:laughs."),
  (None, "They talk for an hour.",
   "Sie:They *reden:talk eine:an *Stunde:hour *lang:long."),
  ("Daniel", "In the end Daniel says: \"I miss you.\"",
   "Am:At_the *Ende:end *sagt:says Daniel: \"Ich:I *vermisse:miss dich:you.\""),
 ]),

 (7, "Der Regen", [
  (None, "On Saturday it rains all day.",
   "Am:On_the *Samstag:Saturday *regnet:rains es:it den:the *ganzen:whole *Tag:day."),
  (None, "At six o'clock Lena closes the café.",
   "Um:At *sechs:six *Uhr:o'clock *schließt:closes Lena das:the Café."),
  (None, "Outside Daniel is waiting without an umbrella.",
   "*Draußen:Outside *wartet:waits Daniel *ohne:without *Schirm:umbrella."),
  (None, "His jacket is completely wet.",
   "Seine:His *Jacke:jacket *ist:is *ganz:completely *nass:wet."),
  ("Lena", "\"How long have you been standing here?\" Lena asks.",
   "\"*Wie:How *lange:long *stehst:stand du:you *schon:already *hier:here?\" *fragt:asks Lena."),
  ("Daniel", "\"For twenty minutes,\" he says.",
   "\"*Seit:Since *zwanzig:twenty *Minuten:minutes\", *sagt:says er:he."),
  ("Lena", "\"You're crazy!\"",
   "\"Du:You *bist:are *verrückt:crazy!\""),
  (None, "She takes his hand and they run together.",
   "Sie:She *nimmt:takes seine:his *Hand:hand und:and sie:they *laufen:run *zusammen:together."),
  (None, "They arrive at Lena's place.",
   "Sie:They *kommen:come bei:at Lena an:on."),
  (None, "Her flat is small but warm.",
   "Ihre:Her *Wohnung:flat *ist:is *klein:small, *aber:but *warm:warm."),
  (None, "Lena gives him a towel.",
   "Lena *gibt:gives ihm:him ein:a *Handtuch:towel."),
  (None, "Daniel looks at the photos on the wall.",
   "Daniel *sieht:looks die:the *Fotos:photos an:on der:the *Wand:wall an:at."),
  ("Daniel", "\"Is that your mother?\"",
   "\"*Ist:Is das:that deine:your *Mutter:mother?\""),
  ("Lena", "\"Yes, the photo is old.\"",
   "\"*Ja:Yes, das:the *Foto:photo *ist:is *alt:old.\""),
  (None, "Lena makes tea for them both.",
   "Lena *macht:makes *Tee:tea für:for *beide:both."),
  (None, "They sit on the sofa and listen to the rain.",
   "Sie:They *sitzen:sit auf:on dem:the *Sofa:sofa und:and *hören:listen dem:the *Regen:rain zu:to."),
  ("Daniel", "\"I have something for you,\" says Daniel.",
   "\"Ich:I *habe:have *etwas:something für:for dich:you\", *sagt:says Daniel."),
  (None, "He gives her a small key.",
   "Er:He *gibt:gives ihr:her einen:a *kleinen:small *Schlüssel:key."),
  ("Daniel", "\"The key is for my new office.\"",
   "\"Der:The *Schlüssel:key *ist:is für:for mein:my *neues:new *Büro:office.\""),
  ("Daniel", "\"I want you to see it first.\"",
   "\"Ich:I *möchte:want, *dass:that du:you es:it *zuerst:first *siehst:see.\""),
 ]),

 (8, "Die Zukunft", [
  (None, "A year has passed.",
   "Ein:A *Jahr:year *ist:is *vergangen:passed."),
  (None, "Café Luna is well known in the city now.",
   "Das:The Café Luna *ist:is *jetzt:now *bekannt:well_known in der:the *Stadt:city."),
  (None, "Lena has two new colleagues.",
   "Lena *hat:has *zwei:two *neue:new *Kollegen:colleagues."),
  (None, "Sophie still works at the weekend.",
   "Sophie *arbeitet:works *immer:always *noch:still am:on_the *Wochenende:weekend."),
  (None, "Daniel comes every morning at half past seven.",
   "Daniel *kommt:comes *jeden:every *Morgen:morning um:at *halb:half *acht:eight."),
  (None, "He drinks his coffee and reads the newspaper.",
   "Er:He *trinkt:drinks seinen:his *Kaffee:coffee und:and *liest:reads die:the *Zeitung:newspaper."),
  (None, "But today he is very quiet.",
   "*Aber:But *heute:today *ist:is er:he *sehr:very *ruhig:quiet."),
  ("Lena", "\"What's wrong?\" Lena asks.",
   "\"*Was:What *ist:is *los:the_matter?\" *fragt:asks Lena."),
  ("Daniel", "\"I have a question,\" he says.",
   "\"Ich:I *habe:have eine:a *Frage:question\", *sagt:says er:he."),
  (None, "The café suddenly goes quiet.",
   "Das:The Café *wird:becomes *plötzlich:suddenly *still:quiet."),
  (None, "Sophie turns the music off.",
   "Sophie *schaltet:switches die:the *Musik:music aus:off."),
  (None, "Daniel stands up and goes to the counter.",
   "Daniel *steht:stands auf:up und:and *geht:goes zur:to_the *Theke:counter."),
  ("Daniel", "\"Lena, do you want to live with me?\"",
   "\"Lena, *willst:want du:you mit:with mir:me *leben:live?\""),
  (None, "He shows her a second key.",
   "Er:He *zeigt:shows ihr:her einen:a *zweiten:second *Schlüssel:key."),
  ("Daniel", "\"The flat has a big window.\"",
   "\"Die:The *Wohnung:flat *hat:has ein:a *großes:big *Fenster:window.\""),
  ("Daniel", "\"And the kitchen is big enough for two.\"",
   "\"Und:And die:the *Küche:kitchen *ist:is *groß:big *genug:enough für:for *zwei:two.\""),
  (None, "For a moment Lena can't speak.",
   "Lena *kann:can einen:a *Moment:moment *nicht:not *sprechen:speak."),
  ("Lena", "Then she says: \"Yes. Of course yes.\"",
   "*Dann:Then *sagt:says sie:she: \"*Ja:Yes. *Natürlich:Of_course *ja:yes.\""),
  (None, "The guests in the café clap loudly.",
   "Die:The *Gäste:guests im:in_the Café *klatschen:clap *laut:loudly."),
  (None, "Sophie cries and takes a photo.",
   "Sophie *weint:cries und:and *macht:makes ein:a *Foto:photo."),
 ]),
]

STORY = {
    "id": "cafe-muenchen",
    "title": "Café in München",
    "blurb": ("Lena works in a small café in Munich. One morning a new customer walks in. "
              "A gentle story about work, coffee and getting to know someone — read it at your level."),
    "chapters": [
        {"id": cid, "title": title, "lines": [build_line(*l) for l in lines]}
        for cid, title, lines in CHAPTERS
    ],
}


def main():
    counts = [len(c["lines"]) for c in STORY["chapters"]]
    for c in STORY["chapters"]:
        if len(c["lines"]) != 20:
            raise SystemExit(f"chapter {c['id']} has {len(c['lines'])} lines, expected 20")

    path = Path(__file__).resolve().parent.parent / "src" / "data" / "stories" / "cafe-muenchen.json"
    path.write_text(json.dumps(STORY, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"{len(STORY['chapters'])} chapters, lines per chapter {counts} -> {path}")

    for c in STORY["chapters"]:
        print(f"\n── {c['id']}. {c['title']}")
        for line in c["lines"][:3]:
            for lv in ("a0", "a1", "a2"):
                print(f"   {lv}: " + " ".join(t["t"] for t in line[lv]))
            print()


if __name__ == "__main__":
    main()
