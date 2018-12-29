#!/usr/bin/env node

import * as program from "commander";
import * as fs from "mz/fs";
import * as readline from "readline";
import * as child_process from "mz/child_process";

program
	.version("1.0.0", "-v, --version")
	.usage("[options] [procs...]")
	.option("-p, --proc <file>", "Specify the Procfile to use", "Procfile")
	.option("-e, --env <file>", "Specify the environment file to use", ".env")
	.action(async (...args) => {
		let command = args.pop();
		if (!await fs.exists(command.proc)) {
			throw `Procfile ${command.proc} doesn't exist!`;
		}
		if (!await fs.exists(command.env)) {
			throw `Environment file ${command.env} doesn't exist!`;
		}
		let proc: any = {};
		let env: any = process.env;
		let procLines = (await fs.readFile(command.proc)).toString().split("\n");
		for (let procLine of procLines) {
			let sections = procLine.split(":");
			if (sections.length < 2) {
				continue;
			}
			let key = sections.shift() as string;
			let val = sections.join(":").trim();
			proc[key] = val;
		}
		let envLines = (await fs.readFile(command.env)).toString().split("\n");
		for (let envLine of envLines) {
			let sections = envLine.split("=");
			if (sections.length < 2) {
				continue;
			}
			let key = sections.shift() as string;
			let val = sections.join("=").trim();
			env[key] = val;
		}

		let procs = args;
		if (procs.length == 0) {
			for (let key of Object.keys(proc)) {
				procs.push(key);
			}
		}
		for (let p of procs) {
			if (p.indexOf(":") !== -1) {
				p = p.split(":")[0];
			}
			if (!proc[p]) {
				throw `Proc ${p} doesn't exist in Procfile!`;
			}
		}

		for (let p of procs) {
			let times = 1;
			if (p.indexOf(":") !== -1) {
				let sections = p.split(":", 2);
				p = sections[0];
				times = parseInt(sections[1]);
			}
			for (let i = 0; i < times; i++) {
				console.log(`Running ${proc[p]} (${p})`);
				let cmd = proc[p].split(" ");
				let first = cmd.shift();
				child_process.spawn(first, cmd, {
					stdio: "inherit",
					env: env
				});
			}
		}
	});

program.parse(process.argv);
