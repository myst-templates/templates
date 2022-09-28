export type TemplateKinds = 'tex';
export const templateKinds: TemplateKinds[] = ['tex'];

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
