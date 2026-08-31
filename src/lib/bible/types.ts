export interface BibleVerse {
  ref: string;
  book: string;
  chapter: number;
  verse: number;
  text: string;
}

export interface RetrievedPassage {
  ref: string;
  text: string;
}
