This is a template repository for getting started with building the client-side of an Algorand Dapp. This template includes

* TypeScript
* Webpack
* ESLint
* Algorand SDK
* WalletConnect

# Usage

## Dependencies

Install all the necessary dependencies via npm run `npm i`

## Dev Server

To run the dev server run `npm run serve`. This server will automatically update upon any file changes. 

## Wallets

Under [src/wallets/](src/wallets/) there are class definitions for connecting to common algorand wallets. Uncomment the related imports in [src/index.ts](src/index.ts) to use them.
