# frontend

This starter React project has been generated using AlgoKit. See below for default getting started instructions.

# Setup

### Initial setup

1. Clone this repository locally
2. Install pre-requisites:
   - Make sure to have [Docker](https://www.docker.com/) installed and running on your machine.
   - Install `AlgoKit` - [Link](https://github.com/algorandfoundation/algokit-cli#install): The minimum required version is `1.1`. Ensure you can execute `algokit --version` and get `1.1` or later.
   - Bootstrap your local environment; run `algokit bootstrap all` within this folder, which will run `npm install` to install NPM packages and dependencies for your frontend component/webapp.
   - Run `algokit localnet start` to start a local Algorand network in Docker. If you are using VS Code launch configurations provided by the template, this will be done automatically for you.
3. Open the project and start debugging / developing via:
   - VS Code
     1. Open the repository root in VS Code
     2. Install recommended extensions
     3. Hit F5 (or whatever you have debug mapped to) and it should start running with breakpoint debugging.
   - Other
     1. Open the repository root in your text editor of choice
     2. In a terminal run `npm run dev`

### Subsequently

1. If you update to the latest source code and there are new dependencies you will need to run `algokit bootstrap all` again
2. Follow step 3 above

> Please note, by default frontend is pre configured to run against Algorand LocalNet. If you want to run against TestNet or MainNet, comment out the current environment variable and uncomment the relevant one in [`.env`](.env) file that is created after running bootstrap command and based on [`.env.template`](.env.template).

# Algorand Wallet integrations

The template comes with [`use-wallet`](https://github.com/txnlab/use-wallet) integration, which provides a React hook for connecting to an Algorand wallet providers. The following wallet providers are included by default:
- LocalNet:
- - [KMD/Local Wallet](https://github.com/TxnLab/use-wallet#kmd-algorand-key-management-daemon) - Algorand's Key Management Daemon (KMD) is a service that manages Algorand private keys and signs transactions. Works best with AlgoKit LocalNet and allows you to easily test and interact with your dApps locally.
- TestNet and others:
- - [Pera Wallet](https://perawallet.app).
- - [Defly Wallet](https://defly.app).
- - [Exodus Wallet](https://www.exodus.com).
- - [Daffi Wallet](https://www.daffi.me).

Refer to official [`use-wallet`](https://github.com/txnlab/use-wallet) documentation for detailed guidelines on how to integrate with other wallet providers (such as WalletConnect v2). Too see implementation details on the use wallet hook and initialization of extra wallet providers refer to [`App.tsx`](./src/App.tsx).

# Tools

This project makes use of React and Tailwind to provider a base project configuration to develop frontends for your Algorand dApps and interactions with smart contracts. The following tools are in use:

- [AlgoKit Utils](https://github.com/algorandfoundation/algokit-utils-ts) - Various TypeScript utilities to simplify interactions with Algorand and AlgoKit.
- [React](https://reactjs.org/) - A JavaScript library for building user interfaces.
- [Tailwind CSS](https://tailwindcss.com/) - A utility-first CSS framework for rapidly building custom designs.
- [daisyUI](https://daisyui.com/) - A component library for Tailwind CSS.
- [use-wallet](https://github.com/txnlab/use-wallet) - A React hook for connecting to an Algorand wallet providers.
- [npm](https://www.npmjs.com/): Node.js package manager
- [jest](https://jestjs.io/): JavaScript testing framework
- [playwright](https://playwright.dev/): Browser automation library
- [Prettier](https://prettier.io/): Opinionated code formatter
- [ESLint](https://eslint.org/): Tool for identifying and reporting on patterns in JavaScript
It has also been configured to have a productive dev experience out of the box in [VS Code](https://code.visualstudio.com/), see the [.vscode](./.vscode) folder.
# Integrating with smart contracts and application clients

Refer to the detailed guidance on [integrating with smart contracts and application clients](./src/contracts/README.md). In essence, for any smart contract codebase generated with AlgoKit or ther tools that produce compile contracts into ARC34 compliant app specifications, you can use the `algokit generate` command to generate TypeScript or Python typed client. Once generated simply drag and drop the generated client into `./src/contracts` and import it into your React components as you see fit.
