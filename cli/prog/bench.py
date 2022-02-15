import click

from prog.cli import request
from prog.cli import show
from prog import client
from prog import output
from prog import utils


def _comp_list_display_format(comp):
    comp["counts"] = "%d:%d" % (len(comp["workloads"]), len(comp["nodes"]))
    comp["protected"] = True
    for e in comp["workloads"]:
        if e["policy_mode"] == "Discover":
            comp["protected"] = False
            return
    for e in comp["nodes"]:
        if e["policy_mode"] == "Discover":
            comp["protected"] = False
            return


@show.group('bench')
@click.pass_obj
def show_bench(data):
    """Show benchmark information."""


@show_bench.group("node")
@click.pass_obj
def show_bench_host(data):
    """Show node CIS benchmark report."""


@show_bench_host.command()
@click.argument("id_or_name")
@click.pass_obj
def docker(data, id_or_name):
    """Show node CIS docker benchmark report."""
    host = utils.get_managed_object(data.client, "host", "host", id_or_name)
    if not host:
        return

    report = data.client.show("bench/host", "items", "%s/docker" % host["id"])
    columns = ("level", "test_number", "scored", "profile", "description")
    output.list(columns, report)


@show_bench_host.command()
@click.argument("id_or_name")
@click.pass_obj
def kubernetes(data, id_or_name):
    """Show node CIS kubernetes benchmark report."""
    host = utils.get_managed_object(data.client, "host", "host", id_or_name)
    if not host:
        return

    report = data.client.show("bench/host", "items", "%s/kubernetes" % host["id"])
    columns = ("level", "test_number", "scored", "profile", "description")
    output.list(columns, report)


@show_bench_host.command()
@click.argument("id_or_name")
@click.pass_obj
def compliance(data, id_or_name):
    """Show node compliance report."""
    host = utils.get_managed_object(data.client, "host", "host", id_or_name)
    if not host:
        return

    try:
        report = data.client.show("host", "items", "%s/compliance" % host["id"])
    except client.ObjectNotFound:
        return

    columns = ("catalog", "type", "level", "test_number", "scored", "profile", "description")
    output.list(columns, report)


@show_bench.group("container")
@click.pass_obj
def show_bench_workload(data):
    """Show node CIS benchmark report."""


@show_bench_workload.command()
@click.argument("id_or_name")
@click.pass_obj
def compliance(data, id_or_name):
    """Show container compliance."""
    wl = utils.get_managed_object(data.client, "workload", "workload", id_or_name)
    if not wl:
        return

    try:
        items = data.client.show("workload", "items", "%s/compliance" % wl["id"])
    except client.ObjectNotFound:
        return

    columns = ("level", "test_number", "scored", "profile", "description", "group", "message")
    output.list(columns, items)


@show_bench.command()
@click.pass_obj
def all(data):
    """Show compliance report of all assets"""
    report = data.client.show("compliance/asset", "compliances", None)
    if report != None:
        for v in report:
            _comp_list_display_format(v)

        columns = ("level", "catalog", "type", "name", "scored", "profile", "description", "counts", "protected")
        output.list(columns, report)


# -- request

@request.group("bench")
@click.pass_obj
def request_bench(data):
    """Request CIS benchmark."""


@request_bench.group("node")
@click.pass_obj
def request_bench_host(data):
    """Request node CIS benchmark."""


@request_bench_host.command()
@click.argument("id_or_name")
@click.pass_obj
def docker(data, id_or_name):
    """Run node CIS docker benchmark."""
    host = utils.get_managed_object(data.client, "host", "host", id_or_name)
    if not host:
        return

    data.client.request("bench/host", host["id"], "docker", None)


@request_bench_host.command()
@click.argument("id_or_name")
@click.pass_obj
def kubernetes(data, id_or_name):
    """Run node CIS kubernetes benchmark."""
    host = utils.get_managed_object(data.client, "host", "host", id_or_name)
    if not host:
        return

    data.client.request("bench/host", host["id"], "kubernetes", None)
