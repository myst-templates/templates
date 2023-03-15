import express from 'express';
import {
  version,
  sendData,
  asUrl,
  templateSummary,
  send404,
  downloadUrl,
  thumbnailUrl,
} from './utils';
import docxTemplates from './data/docx.json';
import texTemplates from './data/tex.json';
import siteTemplates from './data/site.json';
import { TemplateItem } from '../cli/types';
import { TemplateYml } from 'myst-templates';

const TEMPLATES = {
  tex: texTemplates,
  docx: docxTemplates,
  site: siteTemplates,
} as Record<string, { info: TemplateItem; template: TemplateYml; kind: string }[]>;

const app = express();
app.disable('x-powered-by');

app.get('/', (req, res) => {
  const data = {
    version,
    message: '👋 Welcome to the MyST API 👋',
    links: {
      templates: asUrl('/templates'),
      docs: 'https://myst-tools.org',
    },
  };
  sendData(res, data);
});

app.get('/templates', (req, res) => {
  const data = {
    version,
    links: {
      tex: asUrl('/templates/tex'),
      docx: asUrl('/templates/docx'),
      site: asUrl('/templates/site'),
    },
  };
  sendData(res, data);
});

app.get('/templates/:kind', (req, res) => {
  const { kind } = req.params;
  if (!TEMPLATES[kind]) return send404(res);
  const data = {
    version,
    items: TEMPLATES[kind].map(({ info, template }) =>
      templateSummary(kind as string, info, template),
    ),
  };
  sendData(res, data);
});

app.get('/templates/:kind/:organization/:name', (req, res) => {
  const { kind, organization, name } = req.params;
  if (!TEMPLATES[kind]) return send404(res);
  const data = TEMPLATES[kind].find(
    ({ info }) => info.organization === organization && info.name === name,
  );
  if (!data) return send404(res);
  const clean = { ...data.template };
  const { source, thumbnail } = clean;
  delete clean.thumbnail;
  delete clean.source;
  sendData(res, {
    id: `${kind}/${data.info.organization}/${data.info.name}`,
    ...clean,
    links: {
      self: asUrl(req.url),
      source: data.info.source,
      thumbnail: thumbnail
        ? thumbnailUrl(data.info.source, thumbnail, data.info.latest)
        : undefined,
      download: downloadUrl(kind as any, data.info.source, data.info.latest),
      original: source,
    },
  });
});

app.use((req, res, next) => {
  send404(res);
});

module.exports = app;
