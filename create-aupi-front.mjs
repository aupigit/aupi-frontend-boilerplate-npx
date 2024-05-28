#!/usr/bin/env node
'use strict'

import chalk from 'chalk'
import { exec } from 'child_process'
// import figlet from 'figlet'
import { existsSync, mkdirSync, readFileSync } from 'fs'
import { join, dirname } from 'path'
import inquirer from 'inquirer'
import readlineSync from 'readline-sync'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const repositoryUrls = {
  web: 'https://github.com/aupigit/aupi-web-frontend-boilerplate.git',
  mobile: 'https://github.com/aupigit/aupi-mobile-frontend-boilerplate.git',
}

console.log(
  chalk.blue.bold(
    'Welcome to ao Aupi boilerplate. To run this you need to be on Linux!',
  ),
)

exec('pnpm --version', (pnpmCheckError) => {
  if (pnpmCheckError) {
    console.log(chalk.yellow.bold('pnpm not found. You want to install pnpm?'))
    askForPnpmInstallation()
  } else {
    checkBun()
  }
})

function askForPnpmInstallation() {
  inquirer
    .prompt([
      {
        type: 'confirm',
        name: 'installPnpm',
        message: 'You want to install pnpm?',
        default: true,
      },
    ])
    .then(({ installPnpm }) => {
      if (installPnpm) {
        installPnpmGlobal()
      } else {
        console.log(
          chalk.red.bold(
            'pnpm is required to continue. Please install pnpm and run again.',
          ),
        )
        process.exit(1)
      }
    })
}

function installPnpmGlobal() {
  console.log(chalk.yellow.bold('Installing pnpm globally...'))
  exec('npm install -g pnpm', (installPnpmError) => {
    if (installPnpmError) {
      console.error(
        chalk.red.bold('Error installing pnpm globally:'),
        installPnpmError,
      )
      process.exit(1)
    }
    console.log(chalk.green.bold('pnpm installed globally successfully!'))
    checkBun()
  })
}

function checkBun() {
  exec('bun --version', (bunCheckError) => {
    if (bunCheckError) {
      console.log(chalk.yellow.bold('bun not found. You want to install bun?'))
      askForBunInstallation()
    } else {
      cloneRepository()
    }
  })
}

function askForBunInstallation() {
  inquirer
    .prompt([
      {
        type: 'confirm',
        name: 'installBun',
        message: 'You want to install bun?',
        default: true,
      },
    ])
    .then(({ installBun }) => {
      if (installBun) {
        installBunGlobal()
      } else {
        console.log(
          chalk.red.bold(
            'bun is required to continue. Please install bun and run again.',
          ),
        )
        process.exit(1)
      }
    })
}

function installBunGlobal() {
  console.log(chalk.yellow.bold('Installing bun globally...'))
  exec('curl -fsSL https://bun.sh/install | bash', (installBunError) => {
    if (installBunError) {
      console.error(
        chalk.red.bold('Error installing bun globally:'),
        installBunError,
      )
      process.exit(1)
    }
    console.log(chalk.green.bold('bun installed globally successfully!'))
    cloneRepository()
  })
}

function cloneRepository() {
  let projectName = readlineSync.question(
    chalk.blue.bold('? ') +
      chalk.white.bold('What is your project named? ') +
      chalk.gray('› '),
  )

  if (!projectName) {
    projectName = 'my-app'
  }

  const destinationPath = join(process.cwd(), projectName)

  inquirer
    .prompt([
      {
        type: 'list',
        name: 'chosenOption',
        message: 'Choose the type of project:',
        choices: ['web', 'mobile'],
      },
    ])
    .then((answers) => {
      const chosenOption = answers.chosenOption
      const repositoryUrl = repositoryUrls[chosenOption]

      if (existsSync(destinationPath)) {
        console.error(
          `The destination "${destinationPath}" already exists. Please choose another location.`,
        )
        process.exit(1)
      }

      mkdirSync(destinationPath, { recursive: true })

      exec(`git clone ${repositoryUrl} ${destinationPath}`, (error) => {
        if (error) {
          console.error(`Error cloning the repository: ${error}`)
          process.exit(1)
        }

        const installCommand =
          chosenOption === 'web' ? 'pnpm install' : 'bun install'
        const installSpinner = ['-', '\\', '|', '/']
        let i = 0
        const spinnerInterval = setInterval(() => {
          process.stdout.write(
            chalk.blue.bold('Installing dependencies... ') +
              installSpinner[i % installSpinner.length] +
              '\r',
          )
          i++
        }, 100)

        exec(installCommand, { cwd: destinationPath }, (installError) => {
          clearInterval(spinnerInterval)
          process.stdout.clearLine()
          process.stdout.cursorTo(0)

          if (installError) {
            console.error(`Error installing dependencies: ${installError}`)
            process.exit(1)
          }
          console.log(
            chalk.green.bold('✅ Dependencies installed successfully!'),
          )
        })

        exec('rm -rf .git', { cwd: destinationPath }, (rmError) => {
          if (rmError) {
            console.error(`Error removing .git: ${rmError}`)
            process.exit(1)
          }
        })

        const output = readFileSync(join(__dirname, 'output.txt'), 'utf8')

        console.log(output)
      })
    })
}
