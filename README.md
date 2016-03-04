# find-commit
[![npm version](https://badge.fury.io/js/find-commit.svg)](https://badge.fury.io/js/find-commit)
[![js-semistandard-style](https://img.shields.io/badge/code%20style-semistandard-brightgreen.svg?style=flat-square)](https://github.com/Flet/semistandard)

> Searches the repository's branches for the supplied commit.

![](https://raw.githubusercontent.com/martellaj/find-commit/master/find-commit.gif)

## Install
`$ npm install --save find-commit`

## Usage
There are 4 operations possible with *find-commit*: **save**, **delete**, **list**, and **search**.

### Save commit as an alias
Saving, using the `-s` or `--save` flag, saves the SHA value into an alias to use later on.

`$ find-commit -s <alias> <commit-sha>`

### Delete a saved alias
If you're no longer interested in a particular commit, delete it from your list of saved aliases with the `-d` flag.

`$ find-commit -d <alias>`

### List saved aliases
Use the `-l` or `--list` flag to list all of the aliases you've saved and their values.

`$ find-commit -l`

### Search for commit in branches
The default behavior of *find-commit* is to search your repository's branches for the supplied commit (either an alias or a raw SHA value). Additionally, you can supply a branch query that will force the operation to only return branches that contain the query and your commit.

`$ find-commit <alias> [branch-query]`

`$ find-commit <commit-sha> [branch-query]`

## Acknowledgements
* [*meow*](https://github.com/sindresorhus/meow) by [Sindre Sorhus](https://github.com/sindresorhus)  - A CLI app helper.

## License
MIT © [Joe Martella](http://www.joemartel.la)