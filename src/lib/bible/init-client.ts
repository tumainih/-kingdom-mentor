import { setVerseLoader } from "./verse-lookup";
import { readVersesFromNetwork } from "./load-verses.client";

setVerseLoader(readVersesFromNetwork);
