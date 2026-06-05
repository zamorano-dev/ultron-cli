import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';

function isSymlink(filePath: string): boolean {
  try {
    return fs.lstatSync(filePath).isSymbolicLink();
  } catch {
    return false;
  }
}

function checkPathExists(filePath: string): boolean {
  try {
    fs.lstatSync(filePath);
    return true;
  } catch {
    return false;
  }
}

function removePath(filePath: string): void {
  try {
    const stat = fs.lstatSync(filePath);
    if (stat.isSymbolicLink() || stat.isFile()) {
      fs.unlinkSync(filePath);
    } else if (stat.isDirectory()) {
      fs.rmSync(filePath, { recursive: true, force: true });
    }
  } catch {
    // Ignore error
  }
}

function printUsage(): void {
  console.error("Usage: ultron [PROFILE] [OPTIONS]");
  console.error("Isolates the Codex environment allowing concurrent usage in different tabs,");
  console.error("sharing configurations but isolating login tokens.\n");
  console.error("Options:");
  console.error("  -o, --open   Opens Codex right after switching.");
  console.error("  -h, --help   Displays this help.");
}

class MenuSelector {
  private currentIndex = 0;
  private firstRender = true;
  private stdin = process.stdin;
  private stdout = process.stderr;
  constructor(private title: string, private options: string[]) {}
  private render(): void {
    if (!this.firstRender) {
      this.stdout.write(`\x1B[${this.options.length + 1}A`);
    }
    this.firstRender = false;
    this.stdout.write(`\r\x1b[K\x1b[35m? \x1b[1;37m${this.title}\x1b[0m\n`);
    for (let i = 0; i < this.options.length; i++) {
      this.stdout.write('\r\x1b[K');
      if (i === this.currentIndex) {
        this.stdout.write(`  \x1b[36m❯\x1b[0m \x1b[36m${this.options[i]}\x1b[0m\n`);
      } else {
        this.stdout.write(`    ${this.options[i]}\n`);
      }
    }
  }
  private cleanup(onKeypress: (str: any, key: any) => void): void {
    this.stdin.removeListener('keypress', onKeypress);
    if (this.stdin.isTTY) {
      this.stdin.setRawMode(false);
    }
    this.stdin.pause();
    this.stdout.write('\x1B[?25h');
  }
  private handleSelection(onKeypress: (str: any, key: any) => void, resolve: (value: number | null) => void): void {
    this.cleanup(onKeypress);
    this.stdout.write(`\x1B[${this.options.length}A`);
    for (let i = 0; i < this.options.length; i++) {
      this.stdout.write('\r\x1b[K\n');
    }
    this.stdout.write(`\x1B[${this.options.length}A`);
    this.stdout.write(`\x1B[1A\r\x1b[K\x1b[32m✔\x1b[0m \x1b[1;37m${this.title}\x1b[0m \x1b[90m›\x1b[0m \x1b[36m${this.options[this.currentIndex]}\x1b[0m\n\n`);
    resolve(this.currentIndex);
  }
  select(): Promise<number | null> {
    return new Promise((resolve) => {
      this.stdout.write('\x1B[?25l');
      this.render();
      readline.emitKeypressEvents(this.stdin);
      if (this.stdin.isTTY) {
        this.stdin.setRawMode(true);
      }
      this.stdin.resume();
      const onKeypress = (str: any, key: any) => {
        if (key.ctrl && key.name === 'c') {
          this.cleanup(onKeypress);
          this.stdout.write('\n');
          resolve(null);
        } else if (key.name === 'up' || key.name === 'k') {
          this.currentIndex = (this.currentIndex - 1 + this.options.length) % this.options.length;
          this.render();
        } else if (key.name === 'down' || key.name === 'j') {
          this.currentIndex = (this.currentIndex + 1) % this.options.length;
          this.render();
        } else if (key.name === 'return' || key.name === 'enter') {
          this.handleSelection(onKeypress, resolve);
        }
      };
      this.stdin.on('keypress', onKeypress);
    });
  }
}

function selectMenu(title: string, options: string[]): Promise<number | null> {
  const selector = new MenuSelector(title, options);
  return selector.select();
}

function promptText(question: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stderr
    });
    rl.question(`\r\x1b[K\x1b[35m? \x1b[1;37m${question}\x1b[0m `, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

function parseArguments(args: string[]) {
  let profile = "";
  let openCodex = false;
  for (const arg of args) {
    if (arg === "-h" || arg === "--help") {
      printUsage();
      process.exit(0);
    } else if (arg === "-o" || arg === "--open") {
      openCodex = true;
    } else {
      profile = arg;
    }
  }
  return { profile, openCodex };
}

function resolveHomeDirectory(): string {
  const realHome = process.env.REAL_HOME || process.env.HOME || "";
  if (!realHome) {
    console.error("Error: Could not determine HOME directory.");
    process.exit(1);
  }
  return realHome;
}

function getExistingProfiles(realHome: string): string[] {
  const profiles: string[] = [];
  try {
    const files = fs.readdirSync(realHome);
    for (const file of files) {
      if (file.startsWith('.codex_') && fs.statSync(path.join(realHome, file)).isDirectory()) {
        const name = file.replace('.codex_', '');
        if (name && name !== 'global') {
          profiles.push(name);
        }
      }
    }
  } catch {
    // Ignore reading errors
  }
  return profiles.length === 0 ? ["aspen", "zamoranodev", "pessoal"] : profiles;
}

async function promptProfileCreation(): Promise<string> {
  const name = await promptText("Name of the new profile:");
  if (!name) {
    console.error("Error: Profile name cannot be empty.");
    process.exit(1);
  }
  if (!/^[a-zA-Z0-9_-]+$/.test(name)) {
    console.error("Error: Profile name must contain only letters, numbers, hyphens or underscores.");
    process.exit(1);
  }
  return name;
}

async function resolveProfile(profileArg: string, realHome: string): Promise<string> {
  if (profileArg) {
    return profileArg;
  }
  const profiles = getExistingProfiles(realHome);
  const options = [...profiles, "+ Create new profile...", "reset (default)"];
  const selectedIndex = await selectMenu("Select the Codex profile", options);
  if (selectedIndex === null) {
    process.exit(1);
  }
  const choice = options[selectedIndex];
  if (choice === "reset (default)") {
    return "reset";
  }
  if (choice === "+ Create new profile...") {
    return promptProfileCreation();
  }
  return choice;
}

function handleResetProfile(): void {
  console.log("unset ULTRON_CODEX_HOME");
  console.error("🔄 Profile cleared (using default).");
  process.exit(0);
}

function ensureDirectoryStructure(targetDir: string): void {
  for (const subDir of [".codex", ".claude"]) {
    const targetSubDir = path.join(targetDir, subDir);
    if (isSymlink(targetSubDir)) {
      fs.unlinkSync(targetSubDir);
    }
    fs.mkdirSync(targetSubDir, { recursive: true });
  }
}

function shareCodexItems(realHome: string, targetDir: string): void {
  const codexItems = [
    "config.toml",
    "mcp",
    "plugins",
    "rules",
    "scripts",
    "skills",
    "prompts",
    "AGENTS.md",
    "RTK.md",
    "chrome-native-hosts.json",
    "chrome-native-hosts-v2.json"
  ];
  for (const item of codexItems) {
    const realPath = path.join(realHome, ".codex", item);
    if (checkPathExists(realPath)) {
      const targetPath = path.join(targetDir, ".codex", item);
      if (checkPathExists(targetPath) && !isSymlink(targetPath)) {
        removePath(targetPath);
      }
      if (!checkPathExists(targetPath)) {
        fs.symlinkSync(realPath, targetPath);
      }
    }
  }
}

function shareClaudeItems(realHome: string, targetDir: string): void {
  const claudeItems = ["settings.json", "hooks"];
  for (const item of claudeItems) {
    const realPath = path.join(realHome, ".claude", item);
    if (checkPathExists(realPath)) {
      const targetPath = path.join(targetDir, ".claude", item);
      if (checkPathExists(targetPath) && !isSymlink(targetPath)) {
        removePath(targetPath);
      }
      if (!checkPathExists(targetPath)) {
        fs.symlinkSync(realPath, targetPath);
      }
    }
  }
}

function shareDevEnvItems(realHome: string, targetDir: string): void {
  const devEnvItems = [
    ".ssh",
    ".gitconfig",
    ".npmrc",
    ".nvm",
    ".bun",
    ".local",
    ".cache",
    ".zshrc",
    ".bash_profile",
    ".bashrc",
    "projects",
    "Obsidian",
    "Documents",
    "WebstormProjects",
    "Desktop",
    "Downloads"
  ];
  for (const item of devEnvItems) {
    const realPath = path.join(realHome, item);
    const targetPath = path.join(targetDir, item);
    if (checkPathExists(realPath) && !checkPathExists(targetPath)) {
      fs.symlinkSync(realPath, targetPath);
    }
  }
}

async function run(): Promise<void> {
  const args = process.argv.slice(2);
  const { profile: profileArg } = parseArguments(args);
  const realHome = resolveHomeDirectory();
  const profile = await resolveProfile(profileArg, realHome);
  if (profile === "reset") {
    handleResetProfile();
  }
  const targetDir = path.join(realHome, `.codex_${profile}`);
  ensureDirectoryStructure(targetDir);
  shareCodexItems(realHome, targetDir);
  shareClaudeItems(realHome, targetDir);
  shareDevEnvItems(realHome, targetDir);
  console.log(`export ULTRON_CODEX_HOME="${targetDir}"`);
  console.error(`✅ Environment '${profile}' configured for concurrent and isolated use!`);
}

run().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
