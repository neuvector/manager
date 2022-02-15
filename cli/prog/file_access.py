import click

from prog.cli import set
from prog.cli import delete
from prog.cli import show
from prog import client
from prog import output
from prog import utils
from argparse import Namespace


def _list_filter_display_format(flt):
    apps = flt["applications"]
    v = []
    if apps != None:
        for a in apps:
            v.append(a["name"])
    flt["applications"] = v


@show.group("file_access")
@click.pass_obj
def show_file_access(data):
    """Show file monitor."""


@show_file_access.group("profile", invoke_without_command=True)
@click.option('--scope', default="all", type=click.Choice(['fed', 'local', 'all']),
              help="Show federal, local or all profiles")
@click.option('-p', '--predefined', is_flag=True, help="show predefined")
@click.pass_obj
@click.pass_context
def show_file_access_profile(ctx, data, scope, predefined):
    """Show file monitor."""
    if ctx.invoked_subcommand is not None:
        return

    args = {}
    if predefined:
        args['predefined'] = True
    if scope == 'fed' or scope == 'local':
        args['scope'] = scope

    pfs = data.client.list("file_monitor", "profile", **args)
    for p in pfs:
        click.echo("Group: %s" % p["group"])
        columns = ("filter", "recursive", "applications", "behavior", "type")
        filters = p["filters"]
        for filter in filters:
            filter["type"] = client.CfgTypeDisplay[filter["cfg_type"]]
        output.list(columns, filters)


@show_file_access_profile.command("")
@click.argument("group")
@click.option('-p', '--predefined', is_flag=True, help="show predefined")
@click.pass_obj
def detail(data, group, predefined):
    """Show file monitor profile."""
    args = {}
    if predefined:
        args['predefined'] = True
    profile = data.client.show("file_monitor", "profile", group, **args)
    if not profile:
        return
    filters = profile["filters"]
    for filter in filters:
        filter["type"] = client.CfgTypeDisplay[filter["cfg_type"]]
    columns = ("filter", "recursive", "applications", "behavior", "type")
    output.list(columns, filters)


@show_file_access.command("file")
@click.argument("id_or_name")
@click.pass_obj
def file(data, id_or_name):
    """Show file monitor files."""
    wl = utils.get_managed_object(data.client, "workload", "workload", id_or_name)
    if not wl:
        return

    filter = {}
    filter["workload"] = wl["id"]
    try:
        resp = data.client.show("file_monitor_file", None, None, **filter)
    except client.ObjectNotFound:
        return

    if not resp:
        return
    columns = ("path", "mask", "is_dir", "protect")
    files = resp["files"]
    output.list(columns, files)


@set.group("file_access")
@click.pass_obj
def set_file_access(data):
    """Set file_access configuration."""


@set_file_access.command("profile")
@click.argument('group')
@click.option('--add_filter', help="add filter, example: /home/*/.ssh/*")
@click.option('-r', '--recursive', type=click.Choice(['enable', 'disable']), help="recursive")
@click.option('-o', '--option', default='monitor_change', type=click.Choice(['block_access', 'monitor_change']),
              help="behavior")
@click.pass_obj
def set_file_access_profile(data, group, add_filter, recursive, option):
    """Create file monitor filters for group."""

    if add_filter == None:
        click.echo("Missing filter")
        return
    config = {}
    recur = False
    if recursive == 'enable':
        recur = True

    config["add_filters"] = [{"filter": add_filter, "recursive": recur, "behavior": option}]
    ret = data.client.config("file_monitor", group, {"config": config})


@set_file_access.command("rule")
@click.argument('group')
@click.option('-f', '--flt', help="filter")
@click.option('--path', help="application path")
@click.option('-r', '--recursive', default='no_change', type=click.Choice(['enable', 'disable', 'no_change']),
              help="recursive")
@click.option('-o', '--option', default='monitor_change', type=click.Choice(['block_access', 'monitor_change']),
              help="behavior")
@click.pass_obj
def set_file_access_rule(data, group, flt, path, recursive, option):
    """Update file access apps for group."""

    profile = data.client.show("file_monitor", "profile", group)
    if not profile:
        click.echo("group not found")
        return

    filters = profile["filters"]
    nft = {}
    for ft in filters:
        if ft["filter"] == flt:
            nft = ft
            apps = nft["applications"]
            if apps == None:
                apps = [path]
            else:
                apps.append(path)
            nft["applications"] = apps
            if recursive != "no_change":
                recur = False
                if recursive == 'enable':
                    recur = True
                nft["recursive"] = recur
            nft["behavior"] = option
            config = {}
            config["update_filters"] = [nft]
            ret = data.client.config("file_monitor", group, {"config": config})
            return

    click.echo("can not find the rule")


@delete.group("file_access")
@click.pass_obj
def delete_file_access(data):
    """Delete file access profile and rule. """


@delete_file_access.command("profile")
@click.argument('group')
@click.option('--del_filter', help="filter")
@click.pass_obj
def delete_file_access_profile(data, group, del_filter):
    """Delete file monitor profile. """

    if del_filter == None:
        click.echo("Missing filter")
        return
    config = {}

    config["delete_filters"] = [{"filter": del_filter}]
    ret = data.client.config("file_monitor", group, {"config": config})
