import click

from prog.cli import create
from prog.cli import delete
from prog.cli import set
from prog.cli import show
from prog.cli import unset
from prog import client
from prog import output
from prog import utils
from argparse import Namespace

CriteriaOpRegex = "regex"
CriteriaOpNotRegex = "!regex"


def _list_dlp_rule_display_format(rule):
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


def _list_dlp_derived_rule_display_format(rule):
    f = "name"
    if f not in rule:
        rule[f] = ""

    f = "patterns"
    if f in rule:
        fo = output.key_output(f)
        s = ""
        for crt in rule[f]:
            s += "%s\n" % (crt)
        rule[fo] = s.rstrip("\n")


def _list_dlp_multival_display_format(rule, f):
    sens = ""
    if f in rule:
        for s in rule[f]:
            if sens == "":
                sens = s
            else:
                sens = sens + ", " + s
    rule[f] = sens


def _list_dlp_multival_display_format2str(rule, f):
    sens = ""
    if f in rule:
        for s in rule[f]:
            if sens == "":
                sens = str(s)
            else:
                sens = sens + ", " + str(s)
    rule[f] = sens


def _list_dlp_multival_group_list_display_format(rule, f):
    sens = ""
    if f in rule:
        for s in rule[f]:
            if sens == "":
                sens = s
            else:
                sens = sens + ", " + s
    rule[f] = sens


@show.group("dlp")
@click.pass_obj
def show_dlp(data):
    """Show dlp configuration."""


@show_dlp.group("rule", invoke_without_command=True)
@click.option("--page", default=5, type=click.IntRange(1), help="list page size, default=5")
@click.option('--sort_dir', type=click.Choice(['asc', 'desc']), default='asc',
              help="sort direction.")
@click.pass_obj
@click.pass_context
def show_dlp_rule(ctx, data, page, sort_dir):
    """Show dlp rules."""
    if ctx.invoked_subcommand is not None:
        return

    args = {'start': 0, 'limit': page}
    while True:
        drs = data.client.list("dlp/rule", "rule", **args)
        columns = ("name", "id", "patterns")
        for dr in drs:
            _list_dlp_rule_display_format(dr)

        output.list(columns, drs)

        if args["limit"] > 0 and len(drs) < args["limit"]:
            break
        click.echo("Press <esc> to exit, press other key to continue ...")
        c = utils.keypress()
        if ord(c) == 27:
            break
        args["start"] += page


@show_dlp_rule.command()
@click.argument("name")
@click.pass_obj
def detail(data, name):
    """Show dlp rule detail."""
    rentry = data.client.show("dlp/rule", "rule", name)
    if not rentry:
        return

    fdr = "sensors"
    if fdr not in rentry:
        rentry[fdr] = ""
    else:
        _list_dlp_multival_display_format(rentry, fdr)

    click.echo("Used by sensor(s): %s" % rentry[fdr])

    columns = ("name", "id", "patterns")
    for r in rentry["rules"]:
        _list_dlp_rule_display_format(r)
    output.list(columns, rentry["rules"])


def _list_dlp_derived_display_format(dr):
    f = "mode"
    if f not in dr:
        dr[f] = ""

    f = "defact"
    if f not in dr:
        dr[f] = 0

    f = "applydir"
    if f not in dr:
        dr[f] = 0


def _output_dlp_one_derived(p):
    id = p["dlp_workload"]["id"]
    _list_dlp_derived_display_format(p)
    click.echo("Container: id=%s name=%s mode=%s defact=%d applydir=%d rules=%d macs=%d ruletype=%s" %
               (id[:output.SHORT_ID_LENGTH], p["dlp_workload"]["name"], p["mode"], p["defact"], p["applydir"],
                len(p["dlp_rules"]), len(p["dlp_macs"]), p["ruletype"]))
    for mac in p["dlp_macs"]:
        click.echo("mac==> %s" % (mac))

    fld = "rids"
    if fld in p:
        _list_dlp_multival_display_format2str(p, fld)
        click.echo("rid==> %s" % (p[fld]))

    columns = ("name", "action")
    output.list(columns, p["dlp_rules"])

    wld = "wafrids"
    if wld in p:
        _list_dlp_multival_display_format2str(p, wld)
        click.echo("wafrid==> %s" % (p[wld]))

    columns = ("name", "action")
    output.list(columns, p["waf_rules"])


@show_dlp.command()
@click.option("-e", "--enforcer", default=None, help="filter sessions by enforcer")
@click.option("-c", "--container", default=None, help="filter sessions by container")
@click.pass_obj
def derivedwl(data, enforcer, container):
    """List derived dlp workload rules"""
    try:
        filter = {}
        if enforcer:
            obj = utils.get_managed_object(data.client, "enforcer", "enforcer", enforcer)
            if obj:
                filter["enforcer"] = obj["id"]
        if container:
            obj = utils.get_managed_object(data.client, "workload", "workload", container)
            if obj:
                filter["workload"] = obj["id"]

        dlp_derived = data.client.list("debug/dlp/wlrule", "rule", **filter)
        for p in dlp_derived:
            _output_dlp_one_derived(p)

    except client.NotEnoughFilter:
        click.echo("Error: 'enforcer' or 'container' filter must be specified.")


@show_dlp.command()
@click.option("-e", "--enforcer", default=None, help="filter sessions by enforcer")
@click.pass_obj
def derived(data, enforcer):
    """List derived dlp rule entries"""
    try:
        filter = {}
        if enforcer:
            obj = utils.get_managed_object(data.client, "enforcer", "enforcer", enforcer)
            if obj:
                filter["enforcer"] = obj["id"]

        dlp_derived_rule = data.client.list("debug/dlp/rule", "rule", **filter)

        for dr in dlp_derived_rule:
            _list_dlp_derived_rule_display_format(dr)

        columns = ("name", "patterns")
        output.list(columns, dlp_derived_rule)

    except client.NotEnoughFilter:
        click.echo("Error: 'enforcer' filter must be specified.")


@show_dlp.command()
@click.option("-e", "--enforcer", default=None, help="filter sessions by enforcer")
@click.pass_obj
def derivedmac(data, enforcer):
    """List derived dlp rule macs"""
    try:
        filter = {}
        if enforcer:
            obj = utils.get_managed_object(data.client, "enforcer", "enforcer", enforcer)
            if obj:
                filter["enforcer"] = obj["id"]

        dlp_derived_mac = data.client.list("debug/dlp/mac", "mac", **filter)
        if len(dlp_derived_mac) > 0:
            click.echo("macs len=%d" % (len(dlp_derived_mac)))

        columns = ("mac",)
        output.list(columns, dlp_derived_mac)

    except client.NotEnoughFilter:
        click.echo("Error: 'enforcer' filter must be specified.")


@show_dlp.group("sensor", invoke_without_command=True)
@click.option("--page", default=5, type=click.IntRange(1), help="list page size, default=5")
@click.option('--sort_dir', type=click.Choice(['asc', 'desc']), default='asc',
              help="sort direction.")
@click.pass_obj
@click.pass_context
def show_dlp_sensor(ctx, data, page, sort_dir):
    """Show dlp sensors."""
    if ctx.invoked_subcommand is not None:
        return

    args = {'start': 0, 'limit': page}
    while True:
        drs = data.client.list("dlp/sensor", "sensor", **args)
        for dr in drs:
            click.echo("Sensor: %s" % (dr["name"]))

            gr = "groups"
            if gr not in dr:
                dr[gr] = ""
            else:
                _list_dlp_multival_group_list_display_format(dr, gr)
            click.echo("Used by group(s):%s" % (dr[gr]))

            gr = "comment"
            if gr not in dr:
                dr[gr] = ""
            click.echo("Comment:\"%s\"" % (dr[gr]))

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
                    _list_dlp_rule_display_format(dre)
                output.list(columns, dr["rules"])

        if args["limit"] > 0 and len(drs) < args["limit"]:
            break
        click.echo("Press <esc> to exit, press other key to continue ...")
        c = utils.keypress()
        if ord(c) == 27:
            break
        args["start"] += page


@show_dlp_sensor.command()
@click.argument("name")
@click.option("--page", default=5, type=click.IntRange(1), help="list page size, default=5")
@click.option('--sort_dir', type=click.Choice(['asc', 'desc']), default='asc',
              help="sort direction.")
@click.pass_obj
def detail(data, page, sort_dir, name):
    """Show dlp sensor detail."""
    dr = data.client.show("dlp/sensor", "sensor", name)
    if not dr:
        return

    gr = "groups"
    if gr not in dr:
        dr[gr] = ""
    else:
        _list_dlp_multival_group_list_display_format(dr, gr)
    click.echo("Used by group(s):%s" % (dr[gr]))

    gr = "comment"
    if gr not in dr:
        dr[gr] = ""
    click.echo("Comment:\"%s\"" % (dr[gr]))

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
            _list_dlp_rule_display_format(r)
        # columns = ("name", "id", "pattern")
        columns = ("name", "patterns")
        output.list(columns, dr["rules"])


# create
def _add_dlp_criterion(key, value, context):
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


def _add_dlp_criteria(pct, key, value, context):
    e = _add_dlp_criterion(key, value, context)
    if not e:
        click.echo("Error: Invalid input of --%s %s" % (key, value))
        return False
    pct.append(e)
    return True


@create.group("dlp")
@click.pass_obj
def create_dlp(data):
    """Create dlp object. """


@create_dlp.group("sensor")
@click.argument('name')
@click.option("--comment", default="", help="Sensor comment")
@click.pass_obj
def create_dlp_sensor(data, name, comment):
    """Create dlp sensor."""
    data.id_or_name = name
    data.comment = comment


@create_dlp_sensor.command("rule")
@click.argument('name')
@click.argument('pattern')
@click.option("--context", default="packet", type=click.Choice(['url', 'header', 'body', 'packet']),
              help="Set pattern match context, eg. HTTP URL, HEADER , BODY or PACKET")
@click.pass_obj
def create_dlp_sensor_rule(data, name, pattern, context):
    """Create dlp sensor with rule

    For PATTERN, use regex: ~'value', empty string pattern is not allowed.
    """
    pct = []
    if not _add_dlp_criteria(pct, "pattern", pattern, context):
        return

    if len(pct) == 0:
        click.echo("Error: Must create dlp rule with pattern.")
        return

    rule = {"name": name, "patterns": pct}
    cfg = {"name": data.id_or_name, "rules": [rule], "comment": data.comment}
    data.client.create("dlp/sensor", {"config": cfg})


# @create_dlp.command("rule")
# @click.argument('name')
# @click.argument('pattern')
# @click.pass_obj
# def create_dlp_rule(data, name, pattern):
#    """Create dlp rule
#
#    For PATTERN, use regex: ~'value', empty string pattern is not allowed.
#    """
#    pct = []
#    if not _add_dlp_criteria(pct, "pattern", pattern):
#        return
#
#    if len(pct) == 0:
#        click.echo("Error: Must create dlp rule with pattern.")
#        return
#
#    rule = {"name": name, "patterns": pct}
#    data.client.create("dlp/rule", {"config": rule})

# delete

@delete.group("dlp")
@click.pass_obj
def delete_dlp(data):
    """Delete dlp object. """


@delete_dlp.command("sensor")
@click.argument('name')
@click.pass_obj
def delete_dlp_sensor(data, name):
    """Delete dlp sensor."""
    data.client.delete("dlp/sensor", name)


# @delete_dlp.command("rule")
# @click.argument('name')
# @click.pass_obj
# def delete_dlp_rule(data, name):
#    """Delete dlp rule."""
#    data.client.delete("dlp/rule", name)

# set

@set.group("dlp")
@click.pass_obj
def set_dlp(data):
    """Set dlp configuration. """


@set_dlp.group("sensor")
@click.argument('name')
@click.option("--comment", default="", help="Sensor comment")
@click.pass_obj
def set_dlp_sensor(data, name, comment):
    """Set dlp sensor configuration."""
    data.id_or_name = name
    data.comment = comment


@set_dlp_sensor.command("rule")
@click.argument('name')
@click.argument('pattern')
@click.option("--context", default="packet", type=click.Choice(['url', 'header', 'body', 'packet']),
              help="Set pattern match context, eg. HTTP URL, HEADER , BODY or PACKET")
@click.pass_obj
def set_dlp_sensor_rule(data, name, pattern, context):
    """Add dlp rule to sensor

    For PATTERN, use regex: ~'value', empty string pattern is not allowed.
    """

    pct = []
    if not _add_dlp_criteria(pct, "pattern", pattern, context):
        return

    if len(pct) == 0:
        click.echo("Error: Must create dlp rule with pattern.")
        return

    rule = {"name": name, "patterns": pct}
    cfg = {"name": data.id_or_name, "change": [rule], "comment": data.comment}
    data.client.config("dlp/sensor", data.id_or_name, {"config": cfg})


# @set_dlp.command("rule")
# @click.argument('name')
# @click.argument('pattern')
# @click.pass_obj
# def set_dlp_rule(data, name, pattern):
#    """Modify dlp rule
#
#    For PATTERN, use regex: ~'value', empty string pattern is not allowed.
#    """
#    data.id_or_name = name
#
#    pct = []
#    if not _add_dlp_criteria(pct, "pattern", pattern):
#        return
#
#    if len(pct) == 0:
#        click.echo("Error: Must create dlp rule with pattern.")
#        return
#
#    rule = {"name": name, "patterns": pct}
#    data.client.config("dlp/rule", data.id_or_name, {"config": rule})


@unset.group("dlp")
@click.pass_obj
def unset_dlp(data):
    """Unset dlp configuration. """


@unset_dlp.group("sensor")
@click.argument('name')
@click.pass_obj
def unset_dlp_sensor(data, name):
    """Set dlp sensor configuration."""
    data.id_or_name = name


@unset_dlp_sensor.command("rule")
@click.argument('name')
@click.pass_obj
def unset_dlp_sensor_rule(data, name):
    """Delete rule from sensor. """

    cfg = {"name": data.id_or_name, "delete": [{"name": name}]}
    data.client.config("dlp/sensor", data.id_or_name, {"config": cfg})
