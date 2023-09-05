## How to add new Algorand smart contracts into the frontend project?

The following folder is reserved for the Algorand Application Clients. The clients are used to interact with instances of Algorand Smart Contracts (ASC1s) deployed on-chain.

When you initially create your project the frontend starter automatically compiles (see [`generate:app-clients`](../../package.json)) the default `auction` contract as `AuctionClient` and provides the [`AppCalls.tsx`](../components/AppCalls.tsx) component showcasing how to interact with that application client.

When you create new Beaker contracts on the backend folder and build them (so that they are available under `artifacts` folder) - simply run `npm run build` to automatically:
1. generate new typed clients based on all contracts currently available under `artifacts` folder.
2. move them to `frontend/src/contracts` folder.

Afterwards you are free to use the newly generated clients in your frontend code (such as using them in your custom components, functions and etc) as you wish.
