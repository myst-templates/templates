export enum TemplateKinds {
  tex = 'tex',
  docx = 'docx',
}

export type TemplateItem = {
  organization: string;
  name: string;
  source: string;
  latest: string;
  versions?: string[];
};
export type TemplateIndex = {
  kind: TemplateKinds;
  templates: TemplateItem[];
};
