#!/usr/bin/env node
import { Command } from 'commander';
import { addValidateCLI } from './validate';

const program = new Command();

addValidateCLI(program);

program.option('-d, --debug', 'Log out any errors to the console.');
program.parse(process.argv);
