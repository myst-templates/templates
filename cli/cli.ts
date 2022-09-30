import fs from 'fs';
import { join } from 'path';
import { Command } from 'commander';
import { validateTemplateYml } from 'jtex';
import {
  clirun,
  getSession,
  ISession,
  createGitLogger,
  makeExecutable,
  writeFileToFolder,
} from 'myst-cli-utils';
import { validateTemplateIndex } from './validators';
import { createValidatorOpts, loadFileAsYaml } from './utils';
import { TemplateItem } from './types';

function cleanBuild(session: ISession) {
  const repoPath = '_build';
  if (!fs.existsSync(repoPath)) return;
  session.log.info(`Removing ${repoPath}`);
  fs.rmSync(repoPath, { recursive: true, force: true });
}

function cleanData(session: ISession) {
  const repoPath = join('api', 'data');
  if (!fs.existsSync(repoPath)) return;
  session.log.info(`Removing ${repoPath}`);
  fs.rmSync(repoPath, { recursive: true, force: true });
}

async function cloneTemplate(session: ISession, source: string, path: string, branch = 'main') {
  if (fs.existsSync(path)) throw new Error('Repository already exists');
  session.log.info(`Cloning ${source} to ${path}`);
  await makeExecutable(
    `git clone --depth 1 --branch ${branch} ${source}.git ${path}`,
    createGitLogger(session),
  )();
}

async function parseTemplateItem(session: ISession, kind: string, templateItem: TemplateItem) {
  const { source, organization, name, latest } = templateItem;
  const path = join('_build', kind, organization, name, latest);
  await cloneTemplate(session, source, path, latest);
  const templateFile = join(path, 'template.yml');
  const templateYaml = loadFileAsYaml(templateFile);
  const opts = createValidatorOpts(session, templateFile, 'template');
  const template = validateTemplateYml(templateYaml, { ...opts, templateDir: path });
  if (!template) throw new Error(`The template: ${templateFile} is not valid`);
  return template;
}

async function clean(session: ISession) {
  cleanBuild(session);
  cleanData(session);
}
async function parseTemplateIndex(session: ISession, file: string) {
  clean(session);
  const index = await validateTemplateIndex(session, file);
  if (!index) return;
  const templates = await Promise.all(
    index.templates.map(async (info) => {
      const template = await parseTemplateItem(session, index.kind, info);
      return { info, template };
    }),
  );
  writeFileToFolder(join('api', 'data', `${index.kind}.json`), JSON.stringify(templates));
}

function makeCleanCLI(program: Command) {
  const command = new Command('clean')
    .description('Clean the build folder and built data folder in the API')
    .action(clirun(clean, { program, getSession }));
  return command;
}

function makeDataCLI(program: Command) {
  const command = new Command('index')
    .description('Load and validate all templates in an index file.')
    .argument('<path>', 'A file to the template index to check')
    .action(clirun(parseTemplateIndex, { program, getSession }));
  return command;
}

export function addCLI(program: Command) {
  program.addCommand(makeCleanCLI(program));
  program.addCommand(makeDataCLI(program));
}
