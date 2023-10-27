import click

from prog.cli import show
from prog.cli import set
from prog.cli import unset
from prog import client
from prog import output


def _list_domain_display_format(d):
    f = "tags"
    if d.get(f):
        d[output.key_output(f)] = ",".join(d[f])


@show.command("domain")
@click.option("--page", default=40, type=click.IntRange(1), help="list page size, default=40")
@click.pass_obj
@click.pass_context
def show_domain(ctx, data, page):
    """Show domain."""
    args = {'start': 0, 'limit': page}

    while True:
        domains = data.client.list("domain", "domain", **args)
        if domains == None:
            break

        for domain in domains:
            _list_domain_display_format(domain)

        columns = ("name", "workloads", "running_pods", "services", "tags")
        output.list(columns, domains)

        if args["limit"] > 0 and len(domains) < args["limit"]:
            break

        click.echo("Press <esc> to exit, press other key to continue ...")
        c = utils.keypress()
        if ord(c) == 27:
            break

        args["start"] += page


@set.group("domain")
@click.pass_obj
@click.pass_context
def set_domain(ctx, data):
    """Set domain configuration."""


@set_domain.command("tag_per_domain")
@click.argument('status', type=click.Choice(['enable', 'disable']))
@click.pass_obj
@click.pass_context
def set_domain_entry(ctx, data, status):
    """Set domain tag per domain setting."""
    data.client.config("domain", "", {"config": {"tag_per_domain": status == 'enable'}})


@set_domain.command("entry")
@click.argument("name")
@click.option('--tag', multiple=True, help="domain tag.")
@click.pass_obj
@click.pass_context
def set_domain_entry(ctx, data, name, tag):
    """Set domain entry configuration."""
    data.id_or_name = name

    domain = {"name": data.id_or_name}
    if len(tag) > 0:
        domain["tags"] = tag

    data.client.config("domain", data.id_or_name, {"config": domain})


@unset.group("domain")
@click.pass_obj
@click.pass_context
def unset_domain(ctx, data):
    """Unset domain configuration."""


@unset_domain.command("entry")
@click.argument("name")
@click.pass_obj
@click.pass_context
def set_domain_entry(ctx, data, name):
    """Unset domain entry configuration."""
    data.id_or_name = name

    domain = {"name": data.id_or_name, "tags": []}

    data.client.config("domain", data.id_or_name, {"config": domain})
