export interface BibleVerse {
  ref: string;
  /** English reference when locale is Swahili */
  refEn?: string;
  book: string;
  bookEn?: string;
  chapter: number;
  verse: number;
  text: string;
}

export interface RetrievedPassage {
  ref: string;
  text: string;
  refEn?: string;
}
