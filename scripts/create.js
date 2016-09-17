import fs from 'fs';
import fse from 'node-fs-extra';
import path from 'path';
import spawn from 'cross-spawn';
import chalk from 'chalk';
import semver from 'semver';
import pathExists from 'path-exists';

const isSafeToCreateProjectIn = (root) => {
  const validFiles = [
    '.DS_Store', 'Thumbs.db', '.git', '.gitignore', 'README.md', 'LICENSE'
  ];
  return fs.readdirSync(root)
    .every(function(file) {
      return validFiles.indexOf(file) >= 0;
    });
};

const checkAppName = (appName) => {
  const packageJsonPath = path.resolve(
    process.cwd(),
    'package.json'
  );
  const packageJson = require(packageJsonPath);
  const dependencies = packageJson.dependencies || {};
  const devDependencies = packageJson.devDependencies || {};
  var allDependencies = Object.keys(dependencies).concat(Object.keys(devDependencies)).sort();

  if (allDependencies.indexOf(appName) >= 0) {
    console.error(
      chalk.red(
        `Can't use '${appName}' as the app name because a dependency with the same name exists.\n\n` +
        `Following names ${chalk.red.bold('must not')} be used:\n\n`
      ) +
      chalk.cyan(
        allDependencies.map(depName => `  ${depName}`).join('\n')
      )
    );
    process.exit(1);
  }
};

const checkNodeVersion = (root) => {
  const packageJsonPath = path.resolve(
    root,
    'package.json'
  );
  const packageJson = require(packageJsonPath);
  if (!packageJson.engines || !packageJson.engines.node) {
    return;
  }

  if (!semver.satisfies(process.version, packageJson.engines.node)) {
    console.error(
      chalk.red(
        'You are currently running Node %s but create-react-app requires %s.' +
        ' Please use a supported version of Node.\n'
      ),
      process.version,
      packageJson.engines.node
    );
    process.exit(1);
  }
};

const run = (root, appName) => {
  const packageJson = require(path.join(root, 'package.json'));
  packageJson.name = appName;

  fs.writeFileSync(
    path.join(root, 'package.json'),
    JSON.stringify(packageJson, null, 2)
  );

  process.chdir(root);

  console.log('Installing packages. This might take a couple minutes.');
  console.log('Installing react-scripts from npm...');
  console.log();

  const args = ['install'];
  const proc = spawn('npm', args, { stdio: 'inherit' });
  proc.on('close', function(code) {
    if (code !== 0) {
      console.error(chalk.red(`npm ${args.join(' ')} failed`));
      return;
    } else {
      console.log(chalk.green(`Component ${appName} created successfully`));
    }
  });
};

const createApp = (name) => {
  var root = path.resolve(name);
  var appName = path.basename(root);

  checkAppName(appName);

  if (!pathExists.sync(name)) {
    fs.mkdirSync(root);
  } else if (!isSafeToCreateProjectIn(root)) {
    console.log(chalk.red('The directory `' + name + '` contains file(s) that could conflict. Aborting.'));
    process.exit(1);
  }

  checkNodeVersion(root);

  console.log(chalk.green(
    `Creating a new React app in ${root}.`
  ));

  fse.copy(path.join(__dirname, '../template'), root, function (err) {
    if (err) return console.error(err);
    console.log('Files copied!');
    run(root, appName);
  });
};

export default createApp;