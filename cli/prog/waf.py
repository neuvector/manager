import click

from prog.cli import create
from prog.cli import delete
from prog.cli import set
from prog.cli import show
from prog.cli import unset
from prog import client
from prog import output
from prog import utils
import json
from argparse import Namespace

CriteriaOpRegex = "regex"
CriteriaOpNotRegex = "!regex"


def _list_waf_rule_display_format(rule):
    f = "name"
    if f not in rule:
        rule[f] = ""

    f = "id"
    if f not in rule:
        rule[f] = ""

    f = "patterns"
    if f in rule:
        fo = output.key_output(f)
        s = ""
        for crt in rule[f]:
            op = "~"
            if crt["op"] == CriteriaOpRegex:
                op = "~"
            elif crt["op"] == CriteriaOpNotRegex:
                op = "!~"
            s += "%s %s context:%s; \n" % (op, crt["value"], crt["context"])
        rule[fo] = s.rstrip("\n")


def _list_waf_multival_display_format(rule, f):
    sens = ""
    if f in rule:
        for s in rule[f]:
            if sens == "":
                sens = s
            else:
                sens = sens + ", " + s
    rule[f] = sens


def _list_waf_multival_group_list_display_format(rule, f):
    sens = ""
    if f in rule:
        for s in rule[f]:
            if sens == "":
                sens = s
            else:
                sens = sens + ", " + s
    rule[f] = sens


@show.group("waf")
@click.pass_obj
def show_waf(data):
    """Show waf configuration."""


@show_waf.group("rule", invoke_without_command=True)
@click.option("--page", default=5, type=click.IntRange(1), help="list page size, default=5")
@click.option('--sort_dir', type=click.Choice(['asc', 'desc']), default='asc',
              help="sort direction.")
@click.pass_obj
@click.pass_context
def show_waf_rule(ctx, data, page, sort_dir):
    """Show waf rules."""
    if ctx.invoked_subcommand is not None:
        return

    args = {'start': 0, 'limit': page}
    while True:
        drs = data.client.list("waf/rule", "rule", **args)
        columns = ("name", "id", "patterns")
        for dr in drs:
            _list_waf_rule_display_format(dr)

        output.list(columns, drs)

        if args["limit"] > 0 and len(drs) < args["limit"]:
            break
        click.echo("Press <esc> to exit, press other key to continue ...")
        c = utils.keypress()
        if ord(c) == 27:
            break
        args["start"] += page


@show_waf_rule.command()
@click.argument("name")
@click.pass_obj
def detail(data, name):
    """Show waf rule detail."""
    rentry = data.client.show("waf/rule", "rule", name)
    if not rentry:
        return

    fdr = "sensors"
    if fdr not in rentry:
        rentry[fdr] = ""
    else:
        _list_waf_multival_display_format(rentry, fdr)

    click.echo("Used by sensor(s): %s" % rentry[fdr])

    columns = ("name", "id", "patterns")
    for r in rentry["rules"]:
        _list_waf_rule_display_format(r)
    output.list(columns, rentry["rules"])


@show_waf.group("sensor", invoke_without_command=True)
@click.option("--page", default=5, type=click.IntRange(1), help="list page size, default=5")
@click.option('--sort_dir', type=click.Choice(['asc', 'desc']), default='asc',
              help="sort direction.")
@click.pass_obj
@click.pass_context
def show_waf_sensor(ctx, data, page, sort_dir):
    """Show waf sensors."""
    if ctx.invoked_subcommand is not None:
        return

    args = {'start': 0, 'limit': page}
    while True:
        drs = data.client.list("waf/sensor", "sensor", **args)
        for dr in drs:
            click.echo("Sensor: %s" % (dr["name"]))

            gr = "groups"
            if gr not in dr:
                dr[gr] = ""
            else:
                _list_waf_multival_group_list_display_format(dr, gr)
            click.echo("Used by group(s):%s" % (dr[gr]))

            gr = "comment"
            if gr not in dr:
                dr[gr] = ""
            click.echo("Comment:\"%s\"" % (dr[gr]))
            click.echo("Type: %s" % (client.CfgTypeDisplay[dr["cfg_type"]]))

            gr = "predefine"
            if gr not in dr:
                dr[gr] = False
            if dr[gr]:
                click.echo("Predefined:True")
            else:
                click.echo("Predefined:False")

            columns = ("name", "patterns")

            fdr = "rules"
            if fdr not in dr:
                dr[fdr] = ""
                click.echo("%s" % (dr[fdr]))
            else:
                for dre in dr[fdr]:
                    _list_waf_rule_display_format(dre)
                output.list(columns, dr["rules"])

        if args["limit"] > 0 and len(drs) < args["limit"]:
            break
        click.echo("Press <esc> to exit, press other key to continue ...")
        c = utils.keypress()
        if ord(c) == 27:
            break
        args["start"] += page


@show_waf_sensor.command()
@click.argument("name")
@click.option("--page", default=5, type=click.IntRange(1), help="list page size, default=5")
@click.option('--sort_dir', type=click.Choice(['asc', 'desc']), default='asc',
              help="sort direction.")
@click.pass_obj
def detail(data, page, sort_dir, name):
    """Show waf sensor detail."""
    dr = data.client.show("waf/sensor", "sensor", name)
    if not dr:
        return

    gr = "groups"
    if gr not in dr:
        dr[gr] = ""
    else:
        _list_waf_multival_group_list_display_format(dr, gr)
    click.echo("Used by group(s):%s" % (dr[gr]))

    gr = "comment"
    if gr not in dr:
        dr[gr] = ""
    click.echo("Comment:\"%s\"" % (dr[gr]))
    click.echo("Type: %s" % (client.CfgTypeDisplay[dr["cfg_type"]]))

    gr = "predefine"
    if gr not in dr:
        dr[gr] = False
    if dr[gr]:
        click.echo("Predefined:True")
    else:
        click.echo("Predefined:False")

    fdr = "rules"
    if fdr not in dr:
        dr[fdr] = ""
        click.echo("%s" % (dr[fdr]))
    else:
        for r in dr["rules"]:
            _list_waf_rule_display_format(r)
        # columns = ("name", "id", "pattern")
        columns = ("name", "patterns")
        output.list(columns, dr["rules"])


# create
def _add_waf_criterion(key, value, context):
    k = key
    v = value
    op = CriteriaOpRegex
    ctxt = context
    # Empty value is not allowed.
    if len(v) > 1:
        if v[0] == '~':
            op = CriteriaOpRegex
            v = v[1:]
        elif len(v) > 2 and v[0] == '!' and v[1] == '~':
            op = CriteriaOpNotRegex
            v = v[2:]
        else:
            return None
    else:
        return None

    return {"key": k, "value": v, "op": op, "context": ctxt}


def _add_waf_criteria(pct, key, value, context):
    e = _add_waf_criterion(key, value, context)
    if not e:
        click.echo("Error: Invalid input of --%s %s" % (key, value))
        return False
    pct.append(e)
    return True


@create.group("waf")
@click.pass_obj
def create_waf(data):
    """Create waf object. """


@create_waf.group("sensor")
@click.argument('name')
@click.option("--comment", default="", help="Sensor comment")
@click.pass_obj
def create_waf_sensor(data, name, comment):
    """Create waf sensor."""
    data.id_or_name = name
    data.comment = comment


@create_waf_sensor.command("rule")
@click.argument('name')
@click.argument('pattern')
@click.option("--context", default="packet", type=click.Choice(['url', 'header', 'body', 'packet']),
              help="Set pattern match context, eg. HTTP URL, HEADER , BODY or PACKET")
@click.pass_obj
def create_waf_sensor_rule(data, name, pattern, context):
    """Create waf sensor with rule

    For PATTERN, use regex: ~'value', empty string pattern is not allowed.
    """
    pct = []
    if not _add_waf_criteria(pct, "pattern", pattern, context):
        return

    if len(pct) == 0:
        click.echo("Error: Must create waf rule with pattern.")
        return

    rule = {"name": name, "patterns": pct}
    cfg = {"name": data.id_or_name, "rules": [rule], "comment": data.comment}
    data.client.create("waf/sensor", {"config": cfg})


# delete

@delete.group("waf")
@click.pass_obj
def delete_waf(data):
    """Delete waf object. """


@delete_waf.command("sensor")
@click.argument('name')
@click.pass_obj
def delete_waf_sensor(data, name):
    """Delete waf sensor."""
    data.client.delete("waf/sensor", name)


# set

@set.group("waf")
@click.pass_obj
def set_waf(data):
    """Set waf configuration. """


@set_waf.group("sensor")
@click.argument('name')
@click.option("--comment", default="", help="Sensor comment")
@click.pass_obj
def set_waf_sensor(data, name, comment):
    """Set waf sensor configuration."""
    data.id_or_name = name
    data.comment = comment


@set_waf_sensor.command("rule")
@click.argument('name')
@click.argument('pattern')
@click.option("--context", default="packet", type=click.Choice(['url', 'header', 'body', 'packet']),
              help="Set pattern match context, eg. HTTP URL, HEADER , BODY or PACKET")
@click.pass_obj
def set_waf_sensor_rule(data, name, pattern, context):
    """Add waf rule to sensor

    For PATTERN, use regex: ~'value', empty string pattern is not allowed.
    """

    pct = []
    if not _add_waf_criteria(pct, "pattern", pattern, context):
        return

    if len(pct) == 0:
        click.echo("Error: Must create waf rule with pattern.")
        return

    rule = {"name": name, "patterns": pct}
    cfg = {"name": data.id_or_name, "change": [rule], "comment": data.comment}
    data.client.config("waf/sensor", data.id_or_name, {"config": cfg})


@unset.group("waf")
@click.pass_obj
def unset_waf(data):
    """Unset waf configuration. """


@unset_waf.group("sensor")
@click.argument('name')
@click.pass_obj
def unset_waf_sensor(data, name):
    """Set waf sensor configuration."""
    data.id_or_name = name


@unset_waf_sensor.command("rule")
@click.argument('name')
@click.pass_obj
def unset_waf_sensor_rule(data, name):
    """Delete rule from sensor. """

    cfg = {"name": data.id_or_name, "delete": [{"name": name}]}
    data.client.config("waf/sensor", data.id_or_name, {"config": cfg})
