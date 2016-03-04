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
  LIST: 2,
  DELETE: 3
};

const cli = meow(`
	Save commit as an alias
    $ find-commit -s <alias> <commit-sha>
    
  Delete a saved alias
    $ find-commit -d <alias> [branch-query]
    
  List saved aliases
    $ find-commit -l

	Search for commit in branches
    $ find-commit <commit-sha>
    $ find-commit <alias>
`, {
  alias: {
    s: 'save',
    l: 'list',
    d: 'delete'
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
    find(cli.input[0], cli.input[1]);
    break;
  case MODE.LIST:
    list();
    break;
  case MODE.DELETE:
    deleteAlias(cli.flags.d);
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
  alias = alias.toString().trim();

  if (!sha) {
    missingInputError(MODE.SAVE);
    return;
  } else if (!alias.match(/^[a-zA-Z0-9-_]+$/)) {
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
        console.log(chalk.green.bold('Successfully saved ' + chalk.bold.cyan(sha) + ' as ' + chalk.bold.magenta(alias) + '.'));
      }
    });
  });
}

/**
 * Finds the branches in which the commit message lives.
 *
 * @name find
 */
function find (targetCommit, targetBranch) {
  if (!targetCommit) {
    missingInputError(MODE.FIND);
    return;
  }

  checkForAlias(targetCommit)
    .then(function (commit) {
      doGitCommand(commit, targetBranch);
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

    let hasAlias = false;

    for (let prop in aliases) {
      if (aliases.hasOwnProperty(prop) && prop !== 'cb6b7b52-ad1c-4a4e-a66a-fbc3a0c3b503') {
        hasAlias = true;
        console.log('* ' + chalk.bold.magenta(prop) + ' => ' + chalk.bold.cyan(aliases[prop]));
      }
    }
    
    if (!hasAlias) {
      console.log(chalk.bold.yellow('No saved aliases.'));
    }
  });
}

/**
 * Deletes the alias specified.
 * 
 * @name deleteAlias
 */
function deleteAlias (alias) {
  if (typeof alias === 'boolean' || alias.toString().trim() === '') {
    missingInputError(MODE.DELETE);
    return;
  }
  
  jsonfile.readFile(STORAGE, function (error, aliases) {
    if (error) {
      // TODO: Handle this error.
    }

    let aliasToDelete = alias;

    if (aliases[aliasToDelete] !== undefined) {
      delete aliases[aliasToDelete];

      jsonfile.writeFile(STORAGE, aliases, function (error) {
        if (error) {
          console.log(chalk.red.bold('Unable to save that alias.'));
        } else {
          console.log(chalk.green.bold('Successfully deleted ' + chalk.bold.magenta(alias) + '.'));
        }
      });
    } else {
      console.log(chalk.bold.yellow('Did not find a matching alias to delete.'));      
    }
  });
}

/**
 * Determines what the user is trying to do with the app.
 *
 * @name getMode
 */
function getMode () {
  if (Object.keys(cli.flags).length > 2) {
    return MODE.ERROR;
  } else if (cli.flags.s) {
    return MODE.SAVE;
  } else if (cli.flags.l) {
    return MODE.LIST;
  } else if (cli.flags.d) {
    return MODE.DELETE;
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
    case MODE.DELETE:
      console.log(chalk.red.bold('Please specify an alias to delete.')); 
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
 * @param targetBranch The branch that the user is checking for.
 */
function doGitCommand (commit, targetBranch) {
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
          
          if (!targetBranch) {
            console.log('   * ' + chalk.green.bold(branch.trim()));
          } else if (branch.trim().indexOf(targetBranch) > -1) {
            console.log('   * ' + chalk.green.bold(branch.trim()));            
          }
        }
      });
    }
  });
}
