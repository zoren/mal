const READ = (str) => str;

const EVAL = (ast) => ast;

const PRINT = (str) => str;

const rep = (str) => PRINT(EVAL(READ(str)));

import * as readline from "node:readline";
import { stdin as input, nextTick, stdout as output } from "node:process";

const rl = readline.createInterface({ input, output });

const prompt = () => {
  rl.question(`user> `, (line) => {
    if (line === "") {
      console.log(`Bye!`);
      rl.close();
      return;
    }
    console.log(rep(line));
    nextTick(prompt);
  });
};

prompt();
