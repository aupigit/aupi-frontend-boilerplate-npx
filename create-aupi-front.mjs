#!/usr/bin/env node
"use strict";

import chalk from 'chalk';
import { exec } from 'child_process';
import figlet from 'figlet';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import inquirer from 'inquirer';
import readlineSync from 'readline-sync';

// URLs dos repositórios GitHub
const repositoryUrls = {
    web: 'https://github.com/uBrunoow/create-aupi-front.git',
    mobile: 'https://github.com/uBrunoow/create-aupi-front-mobile.git'
};

console.log(chalk.blue.bold('Bem-vindo ao executável boilerplate da Aupi. Para rodar isso você precisa estar em um Linux!'));



// Verificar se pnpm está instalado
exec('pnpm --version', (pnpmCheckError, pnpmStdout, pnpmStderr) => {
    if (pnpmCheckError) {
        console.log(chalk.yellow.bold('pnpm não encontrado. Deseja instalar o pnpm?'));
        askForPnpmInstallation();
    } else {
        checkBun();
    }
});

function askForPnpmInstallation() {
    inquirer
        .prompt([
            {
                type: 'confirm',
                name: 'installPnpm',
                message: 'Você deseja instalar o pnpm?',
                default: true
            }
        ])
        .then(({ installPnpm }) => {
            if (installPnpm) {
                installPnpmGlobal();
            } else {
                console.log(chalk.red.bold('pnpm é necessário para continuar. Por favor, instale o pnpm e execute novamente.'));
                process.exit(1);
            }
        });
}

function installPnpmGlobal() {
    console.log(chalk.yellow.bold('Instalando pnpm globalmente...'));
    exec('npm install -g pnpm', (installPnpmError, installPnpmStdout, installPnpmStderr) => {
        if (installPnpmError) {
            console.error(chalk.red.bold('Erro ao instalar pnpm globalmente:'), installPnpmError);
            process.exit(1);
        }
        console.log(chalk.green.bold('pnpm instalado globalmente com sucesso!'));
        checkBun();
    });
}

function checkBun() {
    // Verificar se bun está instalado
    exec('bun --version', (bunCheckError, bunStdout, bunStderr) => {
        if (bunCheckError) {
            console.log(chalk.yellow.bold('bun não encontrado. Deseja instalar o bun?'));
            askForBunInstallation();
        } else {
            cloneRepository();
        }
    });
}

function askForBunInstallation() {
    inquirer
        .prompt([
            {
                type: 'confirm',
                name: 'installBun',
                message: 'Você deseja instalar o bun?',
                default: true
            }
        ])
        .then(({ installBun }) => {
            if (installBun) {
                installBunGlobal();
            } else {
                console.log(chalk.red.bold('bun é necessário para continuar. Por favor, instale o bun e execute novamente.'));
                process.exit(1);
            }
        });
}

function installBunGlobal() {
    console.log(chalk.yellow.bold('Instalando bun globalmente...'));
    exec('curl -fsSL https://bun.sh/install | bash', (installBunError, installBunStdout, installBunStderr) => {
        if (installBunError) {
            console.error(chalk.red.bold('Erro ao instalar bun globalmente:'), installBunError);
            process.exit(1);
        }
        console.log(chalk.green.bold('bun instalado globalmente com sucesso!'));
        cloneRepository();
    });
}

function cloneRepository() {
    // Diretório de destino onde o repositório será clonado
    let projectName = readlineSync.question(chalk.blue.bold('? ') + chalk.white.bold('What is your project named? ') + chalk.gray('› '));

    // Define 'my-app' como o nome padrão se nenhum nome for fornecido
    if (!projectName) {
        projectName = 'my-app';
    }

    // Diretório de destino onde o repositório será clonado
    const destinationPath = join(process.cwd(), projectName);

    // Solicitar ao usuário que escolha entre web ou mobile
    inquirer
        .prompt([
            {
                type: 'list',
                name: 'chosenOption',
                message: 'Escolha o tipo de projeto:',
                choices: ['web', 'mobile']
            }
        ])
        .then(answers => {
            const chosenOption = answers.chosenOption;
            const repositoryUrl = repositoryUrls[chosenOption];

            if (existsSync(destinationPath)) {
                console.error(`O destino "${destinationPath}" já existe. Por favor, escolha outro local.`);
                process.exit(1);
            }

            mkdirSync(destinationPath, { recursive: true });

            exec(`git clone ${repositoryUrl} ${destinationPath}`, (error, stdout, stderr) => {
                if (error) {
                    console.error(`Erro ao clonar o repositório: ${error}`);
                    process.exit(1);
                }

                // Instalar dependências
                const installCommand = chosenOption === 'web' ? 'pnpm install' : 'bun install';
                const installSpinner = ['-', '\\', '|', '/'];
                let i = 0;
                const spinnerInterval = setInterval(() => {
                    process.stdout.write(chalk.blue.bold('Instalando dependências... ') + installSpinner[i % installSpinner.length] + '\r');
                    i++;
                }, 100);

                exec(installCommand, { cwd: destinationPath }, (installError, installStdout, installStderr) => {
                    clearInterval(spinnerInterval);
                    process.stdout.clearLine();
                    process.stdout.cursorTo(0);

                    if (installError) {
                        console.error(`Erro ao instalar dependências: ${installError}`);
                        process.exit(1);
                    }
                    console.log(chalk.green.bold('✅ Dependências instaladas com sucesso!'));
                });

                // Remover diretório .git
                exec('rm -rf .git', { cwd: destinationPath }, (rmError, rmStdout, rmStderr) => {
                    if (rmError) {
                        console.error(`Erro ao remover diretório .git: ${rmError}`);
                        process.exit(1);
                    }
                });

                // Imprimir uma mensagem de boas-vindas
                console.log(chalk.blue(figlet.textSync('AUPI', { horizontalLayout: 'full', verticalLayout: 'full' })));
            });
        });
}
