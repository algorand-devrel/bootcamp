import logging
import subprocess
from pathlib import Path
from shutil import rmtree

import beaker

logger = logging.getLogger(__name__)
deployment_extension = "py"


def build(output_dir: Path, app: beaker.Application) -> Path:
    output_dir = output_dir.resolve()
    if output_dir.exists():
        rmtree(output_dir)
    output_dir.mkdir(exist_ok=True, parents=True)
    logger.info(f"Exporting {app.name} to {output_dir}")
    specification = app.build()
    specification.export(output_dir)

    result = subprocess.run(
        [
            "algokit",
            "generate",
            "client",
            output_dir / "application.json",
            "--output",
            output_dir / f"client.{deployment_extension}",
        ],
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
    )
    if result.returncode:
        if "No such command" in result.stdout:
            raise Exception(
                "Could not generate typed client, requires AlgoKit 1.1 or "
                "later. Please update AlgoKit"
            )
        else:
            raise Exception(f"Could not generate typed client:\n{result.stdout}")

    return output_dir / "application.json"
