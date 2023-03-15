import { TemplateKind } from 'myst-common';

export type TemplateItem = {
  organization: string;
  name: string;
  source: string;
  latest: string;
  versions?: string[];
};

export type TemplateIndex = {
  kind: TemplateKind;
  templates: TemplateItem[];
};
