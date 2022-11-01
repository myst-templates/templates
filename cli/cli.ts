import fs from 'fs';
import { join } from 'path';
import { Command } from 'commander';
import { TemplateYml, validateTemplateYml } from 'jtex';
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

function writeReadme(
  session: ISession,
  templates: {
    info: TemplateItem;
    template: TemplateYml;
  }[],
) {
  const path = join('readme', 'profile', 'README.md');
  if (!fs.existsSync(path)) {
    session.log.error(
      `The path "${path}" does not exist and cannot update the organization README.`,
    );
    session.log.info(
      `Try "git clone git@github.com:myst-templates/.github.git readme" to create the relevant folder`,
    );
    return;
  }
  const readme = fs.readFileSync(path).toString();
  let insert = false;
  const out: string[] = [];
  readme.split('\n').forEach((line) => {
    if (insert) {
      if (line.startsWith('#')) {
        // Turn the line back on when hiting the header.
        insert = false;
        out.push(line);
      }
      return;
    }
    if (line === '## LaTeX Templates') {
      insert = true;
      out.push(line);
      out.push('');
      const table = [
        ['Title (`id`)', 'Repository', 'CI'],
        [':---', ':---', ':---'],
      ];
      templates.forEach(({ info, template }) => {
        table.push([
          `${template.title ?? ''} (\`${info.name}\`)`,
          `[${info.name}](${info.source})`,
          `[![](${info.source}/actions/workflows/jtex.yml/badge.svg)](${info.source}/actions/workflows/jtex.yml)`,
        ]);
      });
      const sizes = table.reduce(
        (l, s) => [0, 1, 2].map((i) => Math.max(l[i], s[i].length)),
        [0, 0, 0],
      );
      const md = table
        .map((row, ri) =>
          row.map((cell, i) => cell.padEnd(sizes[i], ri === 1 ? '-' : ' ')).join(' | '),
        )
        .map((row) => `| ${row} |`)
        .join('\n');
      out.push(md);
      out.push('');
    } else {
      out.push(line);
    }
  });
  fs.writeFileSync(path, out.join('\n'));
}

async function parseTemplateIndex(session: ISession, files: string[]) {
  clean(session);
  const allTemplates: { info: TemplateItem; template: TemplateYml }[] = [];
  await Promise.all(
    files.map(async (file) => {
      const index = await validateTemplateIndex(session, file);
      if (!index) return;
      const templates = await Promise.all(
        index.templates.map(async (info) => {
          const template = await parseTemplateItem(session, index.kind, info);
          return { info, template };
        }),
      );
      writeFileToFolder(join('api', 'data', `${index.kind}.json`), JSON.stringify(templates));
      allTemplates.push(...templates);
    }),
  );
  writeReadme(session, allTemplates);
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
    .argument('<paths...>', 'Files for the template index to check')
    .action(clirun(parseTemplateIndex, { program, getSession }));
  return command;
}

export function addCLI(program: Command) {
  program.addCommand(makeCleanCLI(program));
  program.addCommand(makeDataCLI(program));
}
