# session_3

This project has been generated using AlgoKit. See below for default getting started instructions.

# Setup

### Initial setup

1. Clone this repository: `git clone {repository_url}`
2. Install pre-requisites:
   - If you have AlgoKit installed, run `algokit bootstrap poetry` within this folder;
   - or:
     - Install `Python` - [Link](https://www.python.org/downloads/): The minimum required version is `3.10`. Ensure you can execute `python -V` and get `3.10`+.
     - Install `Poetry` - [Link](https://python-poetry.org/docs/#installation): The minimum required version is `1.2`. Ensure you can execute `poetry -V` and get `1.2`+.
     - If you're not using PyCharm, then run `poetry install` in the root directory (this should set up `.venv` and also install all Python dependencies) - PyCharm will do this for you automatically on startup 🪄.
3. Open the project and start debugging / developing via:
   - VS Code
     1. Open the repository root in VS Code
     2. Install recommended extensions
     3. Hit F5 (or whatever you have debug mapped to) and it should start running with breakpoint debugging.
        (**NOTE:** The first time you run, VS Code may prompt you to select the Python Interpreter. Select python from the .venv path within this project)
   - IDEA (e.g. PyCharm)
     1. Open the repository root in the IDE
     2. It should automatically detect it's a Poetry project and set up a Python interpreter and virtual environment.
     3. Hit Shift+F9 (or whatever you have debug mapped to) and it should start running with breakpoint debugging.
   - Other
     1. Open the repository root in your text editor of choice
     2. In a terminal run `poetry shell`
     3. Run `python app.py` through your debugger of choice

### Subsequently

1. If you update to the latest source code and there are new dependencies you will need to run `poetry install` again
2. Follow step 3 above

# Tools

This project makes use of Python to build Algorand smart contracts. The following tools are in use:

- [Poetry](https://python-poetry.org/): Python packaging and dependency management.- [Black](https://github.com/psf/black): A Python code formatter.
- [Ruff](https://github.com/charliermarsh/ruff): An extremely fast Python linter.

- [mypy](https://mypy-lang.org/): Static type checker.

It has also been configured to have a productive dev experience out of the box in VS Code, see the [.vscode](./.vscode) folder.
