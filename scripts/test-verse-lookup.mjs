import { lookupVerseReference, looksLikeVerseRequest } from "../src/lib/bible/verse-lookup.ts";

const tests = [
  "John 3:16",
  "John3:16",
  "Jn3:16",
  "Jn 3:16",
  "Psalm 23:1",
  "Ps 23:1",
  "Psalms 23",
  "please read John 3:16",
  "can you show me John 3:16",
  "what is John 3:16",
  "Genesis 1:1-5",
  "1 Cor 13:4",
  "1 Corinthians 13:4",
  "Song of Solomon 1:1",
  "Mathew 5:3",
  "Matthew 5:3",
  "Yohana 3:16",
  "Zaburi 23:1",
  "Mwanzo 1:1",
  "John 3:16 please",
  "nisomee Yohana 3:16",
];

for (const t of tests) {
  const en = await lookupVerseReference(t, "en");
  const sw = await lookupVerseReference(t, "sw");
  console.log(
    JSON.stringify({
      t,
      kind: looksLikeVerseRequest(t),
      en: en.passages.length,
      sw: sw.passages.length,
    }),
  );
}
