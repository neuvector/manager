import click

from prog.cli import delete
from prog.cli import set
from prog.cli import show
from prog import client
from prog import output
from prog import utils
import time


def _list_profile_display_format(rule):
    rule["type"] = client.CfgTypeDisplay[rule["cfg_type"]]
    rule["modified"] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(rule["last_modified_timestamp"]))
    rule["created"] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(rule["created_timestamp"]))
    f = "name"
    if f not in rule:
        rule[f] = ""
    f = "path"
    if f not in rule:
        rule[f] = ""
    f = "user"
    if f not in rule:
        rule[f] = ""


@show.group("process")
@click.pass_obj
def show_process(data):
    """Show process profile."""


@show_process.group("profile", invoke_without_command=True)
@click.option('--scope', default="all", type=click.Choice(['fed', 'local', 'all']),
              help="Show federal, local or all profiles")
@click.option("--page", default=5, type=click.IntRange(1), help="list page size, default=5")
@click.option('--sort_dir', type=click.Choice(['asc', 'desc']), default='asc', help="sort direction.")
@click.pass_obj
@click.pass_context
def show_process_profile(ctx, data, scope, page, sort_dir):
    """Show process profile."""
    if ctx.invoked_subcommand is not None:
        return

    args = {'start': 0, 'limit': page}
    if scope == 'fed' or scope == 'local':
        args['scope'] = scope

    # args = {'sort': "group", 'sort_dir': sort_dir, 'start': 0, 'limit': page}
    while True:
        pfs = data.client.list("process_profile", "process_profile", **args)
        for p in pfs:
            click.echo("Group: %s, Mode: %s, Baseline: %s" % (p["group"], p["mode"], p["baseline"]))
            columns = ("name", "path", "user", "action", "type", "uuid", "allow_update")
            for r in p["process_list"]:
                _list_profile_display_format(r)
            output.list(columns, p["process_list"])

        if args["limit"] > 0 and len(pfs) < args["limit"]:
            break
        click.echo("Press <esc> to exit, press other key to continue ...")
        c = utils.keypress()
        if ord(c) == 27:
            break
        args["start"] += page


@show_process_profile.command("")
@click.argument("group")
@click.pass_obj
def group(data, group):
    """Show process profile."""
    profile = data.client.show("process_profile", "process_profile", group)
    if not profile:
        return

    for r in profile["process_list"]:
        _list_profile_display_format(r)

    click.echo("Mode: %s" % profile["mode"])
    if profile["baseline"] != "":
        click.echo("Baseline: %s" % profile["baseline"])

    columns = ("name", "path", "user", "action", "type", "uuid", "allow_update")
    output.list(columns, profile["process_list"])


@set.group("process")
@click.pass_obj
def set_process(data):
    """Set process profile. """


@set_process.command("profile")
@click.argument('group')
@click.option("--name", help="process name")
@click.option("--path", default="", help="process path")
@click.option("--user", default="", help="allowed user")
@click.option("--action", type=click.Choice(['allow', 'deny']), help="process action")
@click.option("--disable_alert", type=click.Choice(['true', 'false']), help="disable_alert")
@click.option("--baseline", type=click.Choice(['Default', 'Shield']), help="profile baseline")
@click.option("--allow_update", default='false', type=click.Choice(['true', 'false']),
              help="allow modified executable file")
@click.pass_obj
def set_process_profile(data, group, path, name, user, action, disable_alert, baseline, allow_update):
    """Set process profile. """

    cfg = {"group": group}
    if name == None and disable_alert == None and baseline == None:
        click.echo("Missing config")
        return

    if name != None:
        if action == None:
            click.echo("Rule must have an action")
            return
        cfg["process_change_list"] = [
            {"name": name, "path": path, "user": user, "action": action, "allow_update": allow_update == "true", }]

    if disable_alert != None:
        cfg["alert_disabled"] = (disable_alert == "true")

    if baseline != None:
        cfg["baseline"] = baseline

    # if enable_hash != None:
    #    cfg["hash_enabled"] = (enable_hash=="true")

    data.client.config("process_profile", group, {"process_profile_config": cfg})


@delete.group("process")
@click.pass_obj
def delete_process(data):
    """Delete process profile. """


@delete_process.command("profile")
@click.argument('group')
@click.option("--name", help="process name")
@click.option("--path", default="", help="process path")
@click.option("--user", default="", help="allowed user")
@click.pass_obj
def delete_process_profile(data, group, path, name, user):
    """Delete process profile. """

    if name != None:
        cfg = {"group": group, "process_delete_list": [{"name": name, "path": path, "user": user}]}
    else:
        click.echo("Invalid config!")
        return

    data.client.config("process_profile", group, {"process_profile_config": cfg})


@show_process.command("rule")
@click.argument("uuid")
@click.pass_obj
def show_process_rule(data, uuid):
    """Show process from uuid."""
    args = {'limit': 1}
    rules = data.client.list("process_rules/%s" % uuid, "process_rule", **args)
    if len(rules) != 1:
        click.echo("\nNot found: %s" % uuid)
        return

    _list_profile_display_format(rules[0]["rule"])
    click.echo("\nGroup: %s, Active: %d" % (rules[0]["group"], rules[0]["active"]))
    columns = ("uuid", "name", "path", "user", "action", "type", "update_alert", "created", "modified")
    output.show(columns, rules[0]["rule"])
