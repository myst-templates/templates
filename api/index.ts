import express, { Request, Response } from 'express';
import { TemplateKind } from 'myst-templates';
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

const TEMPLATES = {
  tex: texTemplates,
  docx: docxTemplates,
};

const app = express();
app.disable('x-powered-by');

app.get('/', (req: Request, res: Response) => {
  const data = {
    version,
    message: '👋 Welcome to the MyST API 👋',
    links: {
      templates: asUrl('/templates'),
      docs: 'https://myst.tools',
    },
  };
  sendData(res, data);
});

app.get('/templates', (req: Request, res: Response) => {
  const data = {
    version,
    links: {
      tex: asUrl('/templates/tex'),
      docx: asUrl('/templates/docx'),
    },
  };
  sendData(res, data);
});

app.get('/templates/:kind', (req: Request, res: Response) => {
  const { kind } = req.params;
  if (!TEMPLATES[kind]) return send404(res);
  const data = {
    version,
    items: TEMPLATES[kind].map(({ info, template }) =>
      templateSummary(kind as TemplateKind, info, template),
    ),
  };
  sendData(res, data);
});

app.get('/templates/:kind/:organization/:name', (req: Request, res: Response) => {
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
      thumbnail: thumbnailUrl(data.info.source, thumbnail, data.info.latest),
      download: downloadUrl(data.info.source, data.info.latest),
      original: source,
    },
  });
});

app.use((req, res, next) => {
  send404(res);
});

module.exports = app;
