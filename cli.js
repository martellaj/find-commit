#!/usr/bin/env node
'use strict';

const childProcess = require('child_process');
const meow = require('meow');
const chalk = require('chalk');

const cli = meow(`
	Usage
    $ obfero <commit-sha>

	Examples
    $ obfero 88990a5689f983f461f7934a42d5c689d0d9b4de
    $ obfero 88990a
`);

if (!cli.input[0]) {
  console.log(chalk.red('Please specify a commit message SHA to check out.'));
} else {
  childProcess.exec('git diff-tree --no-commit-id --name-status -r ' + cli.input[0], function (error, stdout, stderr) {
    if (error) {
      if (error) {
        console.log(chalk.red(stderr));
      }
    } else {
      console.log(stdout);
    }
  });
}

