import yaml from 'js-yaml';
import fs from 'fs';
import { ISession } from 'myst-cli-utils';
import { ValidationOptions } from 'simple-validators';

export function errorLogger(session: ISession) {
  return (message: string) => session.log.error(message);
}

export function warningLogger(session: ISession) {
  return (message: string) => session.log.warn(message);
}

export function loadFileAsYaml(file: string) {
  if (!fs.existsSync(file)) throw new Error(`The file "${file}" does not exist`);
  try {
    return yaml.load(fs.readFileSync(file).toString());
  } catch (error) {
    throw new Error(`The file "${file}" could not be loaded as YAML`);
  }
}

export function createValidatorOpts(
  session: ISession,
  file: string,
  property?: string,
): ValidationOptions {
  return {
    file,
    property: property ?? '',
    messages: {},
    errorLogFn: errorLogger(session),
    warningLogFn: warningLogger(session),
  };
}
