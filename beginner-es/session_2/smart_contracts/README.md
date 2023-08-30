## How to add new smart contracts?

By the default the template creates a single `HelloWorld` contract under auction folder in the `smart_contracts` directory. To add a new contract:

1. From the root of the repository execute `algokit generate smart-contract`. This will create a new starter smart contract and deployment configuration file under `{your_contract_name}` subfolder under `smart_contracts` directory.
2. Each contract potentially has different creation parameters and deployment steps. Hence, you need to define your deployment logic in `deploy_config.py`file.
3. `config.py` file will automatically build all contracts under `smart_contracts` directory. If you want to build specific contracts manually, modify the default code provided by the template in `config.py` file.

> Please note, above is just a suggested convention tailored for the base configuration and structure of this template. Default code supplied by the template in `config.py` and `index.ts` (if using ts clients) files are tailored for the suggested convention. You are free to modify the structure and naming conventions as you see fit.
