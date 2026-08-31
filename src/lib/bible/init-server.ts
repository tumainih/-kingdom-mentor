import "server-only";
import { setVerseLoader } from "./verse-lookup";
import { readVersesFromDisk } from "./load-verses.server";

setVerseLoader(readVersesFromDisk);
