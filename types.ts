
export enum ItemType {
  LIVING = 'living',
  NON_LIVING = 'non-living'
}

export interface IdentifiedItem {
  name: string;
  type: ItemType;
  description: string;
  scientificName?: {
    genus: string;
    species: string;
  };
  origin?: string;
}

export interface IdentificationResult {
  items: IdentifiedItem[];
}
