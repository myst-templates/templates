import type { TemplateKind, TemplateDTO } from 'myst-templates';
import { Response } from 'express';

export const version = 'v1';
const BASE_URL =
  process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : 'https://api.myst.tools';

export function asUrl(url: string) {
  return `${BASE_URL}${url}`;
}

export function send404(res: Response) {
  res.status(404).json({ status: 404, message: 'The endpoint was not found.' });
}

export function sendData(res: Response, data: Record<string, any>) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 's-max-age=1000, stale-while-revalidate');
  res.json(data);
}

type GitHubParts = { org: string; repo: string };

function getGithubParts(url: string): undefined | GitHubParts {
  const GITHUB_BLOB = /^(?:https?:\/\/)?github\.com\/([^/]+)\/([^/]+)/;
  const [, org, repo] = GITHUB_BLOB.exec(url) ?? [];
  if (!org || !repo) return;
  return { org, repo };
}

// https://github.com/myst-templates/tempaltes/archive/refs/heads/main.zip
export function downloadUrl(source: string, ref: string, isTag = false) {
  const parts = getGithubParts(source);
  if (!parts) return source;
  const refType = isTag ? 'tags' : 'heads';
  return `https://github.com/${parts.org}/${parts.repo}/archive/refs/${refType}/${ref}.zip`;
}

// https://raw.githubusercontent.com/myst-templates/arxiv_nips/main/thumbnail.png
export function thumbnailUrl(source: string, thumbnail: string, ref: string) {
  const parts = getGithubParts(source);
  if (!parts) return thumbnail;
  const relative = thumbnail.replace(/^\.?\//, '');
  return `https://raw.githubusercontent.com/${parts.org}/${parts.repo}/${ref}/${relative}`;
}

export function templateSummary(
  kind: TemplateKind,
  info: Record<string, any>,
  template: Record<string, any>,
): TemplateDTO {
  const id = `${kind}/${info.organization}/${info.name}`;
  return {
    id,
    kind,
    title: template.title ?? '',
    description: template.description ?? '',
    authors: template.authors,
    license: template.license,
    tags: template.tags,
    version: template.version,
    links: {
      self: asUrl(`/templates/${id}`),
      source: info.source,
      thumbnail: thumbnailUrl(info.source, template.thumbnail, info.latest),
      download: downloadUrl(info.source, info.latest),
    },
  };
}
