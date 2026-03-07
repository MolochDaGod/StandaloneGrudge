#!/usr/bin/env node

/**
 * Grudge Warlords MMO - CLI AI Manager
 * Command-line interface for managing the game server with AI assistance
 */

const readline = require('readline');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

class GrudgeWarlordsCLI {
  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: colors.cyan + 'grudge-cli> ' + colors.reset
    });
    
    this.commands = {
      help: this.showHelp.bind(this),
      deploy: this.deploy.bind(this),
      build: this.build.bind(this),
      status: this.checkStatus.bind(this),
      logs: this.showLogs.bind(this),
      ai: this.aiAssist.bind(this),
      config: this.manageConfig.bind(this),
      exit: this.exit.bind(this)
    };
  }

  start() {
    this.showBanner();
    console.log(colors.yellow + 'Type "help" for available commands\n' + colors.reset);
    
    this.rl.prompt();
    
    this.rl.on('line', (line) => {
      const input = line.trim();
      if (!input) {
        this.rl.prompt();
        return;
      }
      
      const [command, ...args] = input.split(' ');
      this.executeCommand(command, args);
      this.rl.prompt();
    });
    
    this.rl.on('close', () => {
      this.exit();
    });
  }

  showBanner() {
    console.log(colors.bright + colors.green);
    console.log('╔════════════════════════════════════════╗');
    console.log('║   Grudge Warlords MMO - CLI Manager   ║');
    console.log('║        AI-Powered Server Control      ║');
    console.log('╚════════════════════════════════════════╝');
    console.log(colors.reset);
  }

  executeCommand(command, args) {
    const cmd = this.commands[command.toLowerCase()];
    if (cmd) {
      try {
        cmd(args);
      } catch (error) {
        console.error(colors.red + `Error executing command: ${error.message}` + colors.reset);
      }
    } else {
      console.log(colors.red + `Unknown command: ${command}. Type "help" for available commands.` + colors.reset);
    }
  }

  showHelp() {
    console.log(colors.bright + '\nAvailable Commands:' + colors.reset);
    console.log(colors.green + '  help' + colors.reset + '              - Show this help message');
    console.log(colors.green + '  deploy' + colors.reset + '            - Deploy to VPS server');
    console.log(colors.green + '  build' + colors.reset + '             - Build the game server');
    console.log(colors.green + '  status' + colors.reset + '            - Check server status');
    console.log(colors.green + '  logs [lines]' + colors.reset + '      - Show server logs (default: 50 lines)');
    console.log(colors.green + '  ai <query>' + colors.reset + '        - Ask AI for assistance');
    console.log(colors.green + '  config [key] [val]' + colors.reset + ' - View or set configuration');
    console.log(colors.green + '  exit' + colors.reset + '              - Exit the CLI\n');
  }

  deploy(args) {
    console.log(colors.yellow + 'Starting deployment to VPS...' + colors.reset);
    try {
      const result = execSync('bash scripts/deploy-to-vps.sh', { 
        stdio: 'inherit',
        cwd: path.join(__dirname, '..')
      });
      console.log(colors.green + '✓ Deployment completed' + colors.reset);
    } catch (error) {
      console.error(colors.red + '✗ Deployment failed' + colors.reset);
    }
  }

  build(args) {
    console.log(colors.yellow + 'Building game server...' + colors.reset);
    try {
      execSync('bash scripts/build-server.sh', { 
        stdio: 'inherit',
        cwd: path.join(__dirname, '..')
      });
      console.log(colors.green + '✓ Build completed' + colors.reset);
    } catch (error) {
      console.error(colors.red + '✗ Build failed' + colors.reset);
    }
  }

  checkStatus(args) {
    console.log(colors.yellow + 'Checking server status...' + colors.reset);
    
    const envPath = path.join(__dirname, '..', '.env');
    if (!fs.existsSync(envPath)) {
      console.log(colors.red + '✗ .env file not found' + colors.reset);
      console.log(colors.yellow + '  Copy .env.example to .env and configure it' + colors.reset);
      return;
    }
    
    console.log(colors.green + '✓ Configuration file found' + colors.reset);
    
    // Check if VPS is configured
    const envContent = fs.readFileSync(envPath, 'utf8');
    if (envContent.includes('VPS_HOST=') && !envContent.includes('VPS_HOST=your-vps')) {
      console.log(colors.green + '✓ VPS configured' + colors.reset);
    } else {
      console.log(colors.yellow + '⚠ VPS not configured' + colors.reset);
    }
    
    // Check if builds directory exists
    const buildsPath = path.join(__dirname, '..', 'builds');
    if (fs.existsSync(buildsPath)) {
      console.log(colors.green + '✓ Builds directory exists' + colors.reset);
    } else {
      console.log(colors.yellow + '⚠ No builds found' + colors.reset);
    }
  }

  showLogs(args) {
    const lines = args[0] || '50';
    const logPath = path.join(__dirname, '..', 'logs', 'grudge-warlords.log');
    
    if (!fs.existsSync(logPath)) {
      console.log(colors.yellow + 'No log file found at: ' + logPath + colors.reset);
      return;
    }
    
    try {
      const logs = execSync(`tail -n ${lines} "${logPath}"`, { encoding: 'utf8' });
      console.log(colors.blue + '\n=== Last ' + lines + ' lines of logs ===' + colors.reset);
      console.log(logs);
    } catch (error) {
      console.error(colors.red + 'Error reading logs' + colors.reset);
    }
  }

  aiAssist(args) {
    const query = args.join(' ');
    
    if (!query) {
      console.log(colors.yellow + 'Usage: ai <your question>' + colors.reset);
      console.log(colors.yellow + 'Example: ai how do I optimize server performance?' + colors.reset);
      return;
    }
    
    console.log(colors.yellow + 'Querying AI...' + colors.reset);
    
    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.includes('your-openai')) {
      console.log(colors.red + '✗ OpenAI API key not configured' + colors.reset);
      console.log(colors.yellow + '  Set OPENAI_API_KEY in your .env file to use AI features' + colors.reset);
      
      // Provide basic help without AI
      this.provideBasicHelp(query);
      return;
    }
    
    // Here you would integrate with OpenAI API
    console.log(colors.blue + 'AI Response:' + colors.reset);
    console.log(colors.yellow + '  (AI integration requires OpenAI API - see documentation)' + colors.reset);
    this.provideBasicHelp(query);
  }

  provideBasicHelp(query) {
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('deploy')) {
      console.log('\nTo deploy:');
      console.log('1. Configure .env with your VPS details');
      console.log('2. Run: deploy');
      console.log('3. The script will build and upload to your VPS');
    } else if (lowerQuery.includes('build')) {
      console.log('\nTo build:');
      console.log('1. Ensure Unity project is in ./UnityProject');
      console.log('2. Run: build');
      console.log('3. Built files will be in ./builds/server');
    } else if (lowerQuery.includes('config')) {
      console.log('\nConfiguration:');
      console.log('1. Copy .env.example to .env');
      console.log('2. Update values for your environment');
      console.log('3. Never commit .env to git');
    } else {
      console.log('\nFor more help, use the "help" command');
    }
  }

  manageConfig(args) {
    const envPath = path.join(__dirname, '..', '.env');
    const examplePath = path.join(__dirname, '..', '.env.example');
    
    if (args.length === 0) {
      // Show current config
      if (fs.existsSync(envPath)) {
        console.log(colors.blue + '\nCurrent configuration:' + colors.reset);
        const content = fs.readFileSync(envPath, 'utf8');
        const lines = content.split('\n').filter(l => l && !l.startsWith('#'));
        lines.forEach(line => {
          const [key, val] = line.split('=');
          if (key && val) {
            // Hide sensitive values
            const displayVal = key.toLowerCase().includes('key') || 
                             key.toLowerCase().includes('password') || 
                             key.toLowerCase().includes('secret')
              ? '***hidden***'
              : val;
            console.log(`  ${colors.green}${key}${colors.reset} = ${displayVal}`);
          }
        });
      } else {
        console.log(colors.yellow + '.env file not found. Copy .env.example to .env' + colors.reset);
      }
    } else if (args.length === 1) {
      // Show specific config value
      if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, 'utf8');
        const regex = new RegExp(`^${args[0]}=(.*)$`, 'm');
        const match = content.match(regex);
        if (match) {
          console.log(`${colors.green}${args[0]}${colors.reset} = ${match[1]}`);
        } else {
          console.log(colors.yellow + `Key "${args[0]}" not found` + colors.reset);
        }
      }
    } else {
      console.log(colors.yellow + 'Config modification not implemented. Edit .env file directly.' + colors.reset);
    }
  }

  exit() {
    console.log(colors.green + '\nGoodbye! May your grudges be eternal.\n' + colors.reset);
    process.exit(0);
  }
}

// Start CLI if run directly
if (require.main === module) {
  const cli = new GrudgeWarlordsCLI();
  cli.start();
}

module.exports = GrudgeWarlordsCLI;
