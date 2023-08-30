import logging
import sys
from pathlib import Path

from dotenv import load_dotenv

from smart_contracts.config import contracts
from smart_contracts.helpers.build import build
from smart_contracts.helpers.deploy import deploy

logging.basicConfig(
    level=logging.DEBUG, format="%(asctime)s %(levelname)-10s: %(message)s"
)
logger = logging.getLogger(__name__)
logger.info("Loading .env")
load_dotenv()
root_path = Path(__file__).parent


def main(action: str) -> None:
    artifact_path = root_path / "artifacts"
    match action:
        case "build":
            for contract in contracts:
                logger.info(f"Building app {contract.app.name}")
                build(artifact_path / contract.app.name, contract.app)
        case "deploy":
            for contract in contracts:
                logger.info(f"Deploying app {contract.app.name}")
                app_spec_path = artifact_path / contract.app.name / "application.json"
                if contract.deploy:
                    deploy(app_spec_path, contract.deploy)
        case "all":
            for contract in contracts:
                logger.info(f"Building app {contract.app.name}")
                app_spec_path = build(artifact_path / contract.app.name, contract.app)
                logger.info(f"Deploying {contract.app.name}")
                if contract.deploy:
                    deploy(app_spec_path, contract.deploy)


if __name__ == "__main__":
    if len(sys.argv) > 1:
        main(sys.argv[1])
    else:
        main("all")
