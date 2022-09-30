#!/usr/bin/env node
import { Command } from 'commander';
import { addCLI } from './cli';

const program = new Command();

addCLI(program);

program.option('-d, --debug', 'Log out any errors to the console.');
program.parse(process.argv);
