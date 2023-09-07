import beaker
import pyteal as pt
from algokit_utils import DELETABLE_TEMPLATE_NAME, UPDATABLE_TEMPLATE_NAME


def deploy_time_immutability_control(app: beaker.Application) -> None:
    @app.update(authorize=beaker.Authorize.only_creator(), bare=True)
    def update() -> pt.Expr:
        return pt.Assert(
            pt.Tmpl.Int(UPDATABLE_TEMPLATE_NAME),
            comment="Check app is updatable",
        )


def deploy_time_permanence_control(app: beaker.Application) -> None:
    @app.delete(authorize=beaker.Authorize.only_creator(), bare=True)
    def delete() -> pt.Expr:
        return pt.Assert(
            pt.Tmpl.Int(DELETABLE_TEMPLATE_NAME),
            comment="Check app is deletable",
        )
