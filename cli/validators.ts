import fetch from 'node-fetch';
import { ISession } from 'myst-cli-utils';
import {
  incrementOptions,
  validateString,
  validateEnum,
  validateList,
  validateObjectKeys,
  ValidationOptions,
  validateUrl,
  defined,
  validationError,
} from 'simple-validators';
import { createValidatorOpts, loadFileAsYaml } from './utils';
import { TemplateIndex, TemplateItem, TemplateKinds } from './types';

async function validateTemplateItem(
  session: ISession,
  template: any,
  opts: ValidationOptions,
): Promise<TemplateItem | undefined> {
  const value = validateObjectKeys(
    template,
    { required: ['organization', 'name', 'source', 'latest'] },
    opts,
  );
  if (!value) return;
  const organization = validateString(value.organization, incrementOptions('organization', opts));
  const name = validateString(value.name, incrementOptions('name', opts));
  const source = validateUrl(value.source, incrementOptions('source', opts));
  const latest = validateString(value.latest, incrementOptions('latest', opts));
  if (!organization || !name || !source || !latest) return;
  if (!source.startsWith('https://github.com')) {
    return validationError(
      `Only github repositories are supported at this time: "${source}"`,
      incrementOptions('source', opts),
    );
  }
  session.log.debug(`Fetching link: ${source}`);
  const resp = await fetch(source);
  if (resp.status !== 200) {
    return validationError(`URL "${source}" does not exist.`, incrementOptions('source', opts));
  }
  const item: TemplateItem = { organization, name, source, latest };
  if (defined(value.versions)) {
    item.versions = validateList(value.versions, incrementOptions('versions', opts), (val, ind) => {
      return validateString(val, incrementOptions(`versions.${ind}`, opts));
    });
  }
  return item;
}

export async function validateTemplateIndex(
  session: ISession,
  file: string,
): Promise<TemplateIndex | undefined> {
  const indexYaml = loadFileAsYaml(file);
  const opts = createValidatorOpts(session, file);
  const value = validateObjectKeys(indexYaml, { required: ['kind', 'templates'] }, opts);
  if (!value) return;
  const kind = validateEnum<TemplateKinds>(value.kind, {
    ...incrementOptions('kind', opts),
    enum: TemplateKinds,
  });
  const templates = (
    await Promise.all(
      validateList(value.templates, incrementOptions('templates', opts), (item, index) =>
        validateTemplateItem(session, item, incrementOptions(`templates.${index}`, opts)),
      ) ?? [],
    )
  ).filter((i) => !!i) as TemplateItem[];
  if (!kind || templates.length === 0) return undefined;
  const output: TemplateIndex = { kind, templates };
  return output;
}
