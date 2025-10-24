export interface Topic {
  id: number;
  title: string;
  subtopics: string[];
}

export interface StoredBriefing {
  plan: string;
  imageUrl: string | null;
}
