#!/usr/bin/env node
'use strict';

const childProcess = require('child_process');
const chalk = require('chalk');
const jsonfile = require('jsonfile');
const meow = require('meow');
const path = require('path');
const Q = require('q');

const STORAGE = path.join(__dirname, '/alias-storage.json');

const MODE = {
  ERROR: -1,
  SAVE: 0,
  FIND: 1,
  LIST: 2
};

const cli = meow(`
	Save commit as alias
    $ find-commit -s <alias> <commit-sha>

	Look for commit in branches
    $ find-commit <commit-sha>
    $ find-commit <alias>
`, {
  alias: {
    s: 'save',
    l: 'list'
  }
});

let mode = getMode();

// Perform the operation based on the mode.
switch (mode) {
  case MODE.ERROR:
    break;
  case MODE.SAVE:
    save(cli.flags.s, cli.input[0]);
    break;
  case MODE.FIND:
    find();
    break;
  case MODE.LIST:
    list();
    break;
  default:
    find();
    break;
}

/**
 * Saves a commit message SHA into an alias for later use.
 *
 * @name save
 */
function save (alias, sha) {
  if (!sha) {
    missingInputError(0);
    return;
  } else if (!alias.match(/^([0-9]|[a-z])+([0-9a-z]+)$/i)) {
    console.log(chalk.red.bold('Aliases must be alphanumeric.'));
    return;
  }

  jsonfile.readFile(STORAGE, function (error, aliases) {
    if (error) {
      // TODO: Handle this error.
    }

    aliases[alias] = sha;
    jsonfile.writeFile(STORAGE, aliases, function (error) {
      if (error) {
        console.log(chalk.red.bold('Unable to save that alias.'));
      } else {
        console.log(chalk.green.bold('Successfully saved ' + chalk.bold.cyan(sha) + ' as "' + alias + '".'));
      }
    });
  });
}

/**
 * Finds the branches in which the commit message lives.
 *
 * @name find
 */
function find () {
  if (!cli.input[0]) {
    missingInputError(1);
    return;
  }

  checkForAlias(cli.input[0])
    .then(function (commit) {
      doGitCommand(commit);
    });
}

/**
 * Lists the aliases the user has created.
 *
 * @name list
 */
function list () {
  jsonfile.readFile(STORAGE, function (error, aliases) {
    if (error) {
      // TODO: Handle this error.
    }

    for (var prop in aliases) {
      if (aliases.hasOwnProperty(prop) && prop !== 'cb6b7b52-ad1c-4a4e-a66a-fbc3a0c3b503') {
        console.log('* ' + chalk.bold.magenta(prop) + ' => ' + chalk.bold.cyan(aliases[prop]));
      }
    }
  });
}

/**
 * Determines what the user is trying to do with the app.
 *
 * @name getMode
 */
function getMode () {
  if (cli.flags.s && cli.flags.l) {
    return MODE.ERROR;
  } else if (cli.flags.s) {
    return MODE.SAVE;
  } else if (cli.flags.l) {
    return MODE.LIST;
  } else {
    return MODE.FIND;
  }
}

/**
 * Prints out an appropriate "missing input" error message for the mode.
 *
 * @name missingInputError
 * @param mode The mode the user is in.
 */
function missingInputError (mode) {
  switch (mode) {
    case MODE.SAVE:
      console.log(chalk.red.bold('Please specify both an alias and a commit message SHA.'));
      break;
    case MODE.FIND:
      console.log(chalk.red.bold('Please specify an alias or a commit message SHA.'));
      break;
  }
}

/**
 * Checks if input is a valid alias or a commit message SHA.
 */
function checkForAlias (input) {
  const deferred = Q.defer();

  let inputInfo = {
    isAlias: false,
    alias: null,
    sha: input
  };

  jsonfile.readFile(STORAGE, function (error, aliases) {
    if (error) {
      // TODO: Handle this error.
    }

    if (aliases[input] !== undefined) {
      inputInfo.isAlias = true;
      inputInfo.alias = input;
      inputInfo.sha = aliases[input];
    } else {
      inputInfo.isAlias = false;
      inputInfo.alias = null;
      inputInfo.sha = input;
    }

    deferred.resolve(inputInfo);
  });

  return deferred.promise;
}

/**
 * Does the git command to search for commit in branches.
 *
 * @name doGitCommand
 * @param commit An object that determines the value of the CLI input (the SHA and if it was loaded).
 */
function doGitCommand (commit) {
  childProcess.exec('git branch -r --contains ' + commit.sha, function (error, stdout, stderr) {
    if (error) {
      if (stderr.indexOf('malformed')) {
        if (commit.isAlias) {
          console.log(chalk.bold.red('The commit ' + chalk.bold.magenta(commit.alias) + ' (' + chalk.bold.cyan(commit.sha) + ') was not found in this repository.'));
        } else {
          console.log(chalk.bold.red('The commit (' + chalk.bold.cyan(commit.sha) + ') was not found in this repository.'));
        }
      }
    } else {
      var branches = stdout.split('\n');

      if (commit.isAlias) {
        console.log('Branches that contain commit ' + chalk.magenta.bold(commit.alias) + ' (' + chalk.cyan.bold(commit.sha) + '):');
      } else {
        console.log('Branches that contain the commit (' + chalk.cyan.bold(commit.sha) + '):');
      }

      branches.forEach(branch => {
        if (branch !== '') {
          console.log('   * ' + chalk.green.bold(branch.trim()));
        }
      });
    }
  });
}
