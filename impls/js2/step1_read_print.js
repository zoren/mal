
import { read_str } from "./reader.js";
import { pr_str } from "./printer.js";

const READ = (str) => read_str(str);

const EVAL = (ast) => ast;

const PRINT = (str) => pr_str(str);

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
    try {
      console.log(rep(line));
    } catch (e) {
      console.log(e.message);
    }
    nextTick(prompt);
  });
};

prompt();
