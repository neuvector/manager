import click

from prog.cli import create
from prog.cli import delete
from prog.cli import set
from prog.cli import show
from prog.cli import unset
from prog import client
from prog import output
from prog.policy import list_policy_display_format
from prog import utils
from argparse import Namespace

# group ---

CriteriaOpEqual = "="
CriteriaOpNotEqual = "!="
CriteriaOpContains = "contains"
CriteriaOpPrefix = "prefix"
CriteriaOpRegex = "regex"
CriteriaOpNotRegex = "!regex"


def get_groups(data, scope, args):
    """Get groups."""
    groups = {}
    if scope == 'fed' or scope == 'local':
        args["scope"] = scope

    groups = data.client.list("group", "group", **args)

    return groups


def _list_group_display_format(group):
    group["type"] = client.CfgTypeDisplay[group["cfg_type"]]
    if group["cfg_type"] == "federal":
        group["scope"] = "fed"
    else:
        group["scope"] = "local"
    f = "members"
    if f in group:
        fo = output.key_output(f)
        group[fo] = len(group[f])
    f = "policy_rules"
    if f in group:
        fo = output.key_output(f)
        group[fo] = len(group[f])
    f = "criteria"
    if f in group:
        fo = output.key_output(f)
        s = ""
        for crt in group[f]:
            op = "="
            if crt["op"] == CriteriaOpNotEqual:
                op = "!="
            elif crt["op"] == CriteriaOpContains:
                op = "@"
            elif crt["op"] == CriteriaOpPrefix:
                op = "^"
            elif crt["op"] == CriteriaOpRegex:
                op = "~"
            elif crt["op"] == CriteriaOpNotRegex:
                op = "!~"
            s += "%s %s %s\n" % (crt["key"], op, crt["value"])
        group[fo] = s.rstrip("\n")
    f = "policy_mode"
    if f not in group:
        fo = output.key_output(f)
        group[fo] = ""
    # f = "dlp_status"
    # if f not in group:
    #    fo = output.key_output(f)
    #    group[fo] = ""
    # else:
    #    fo = output.key_output(f)
    #    s = ""
    #    if group[f]:
    #        s = "enable"
    #    else:
    #        s = "disable"
    #    group[fo] = s
    # f = "sensors"
    # if f not in group:
    #    fo = output.key_output(f)
    #    group[fo] = ""
    # if f in group:
    #    fo = output.key_output(f)
    #    group[fo] = len(group[f])


def _show_group_display_format(group):
    _list_group_display_format(group)


@show.group("group", invoke_without_command=True)
@click.option('-b', '--brief', is_flag=True, default=False, help="brief output")
@click.option('--cap', is_flag=True, default=False, help="with cap")
@click.option('-t', '--filter_type', default=None, help="filter by type: container, ip_service, address")
@click.option('--scope', default='all', type=click.Choice(['fed', 'local', 'all']),
              help="Show federal, local or all groups")
@click.option("--page", default=40, type=click.IntRange(1), help="list page size, default=40")
@click.option('--sort', default=None, help="sort field.")
@click.option('--sort_dir', type=click.Choice(['asc', 'desc']), default='asc', help="sort direction.")
@click.pass_obj
@click.pass_context
def show_group(ctx, data, brief, cap, scope, page, sort, sort_dir, filter_type):
    """Show group."""
    if ctx.invoked_subcommand is not None:
        return

    if sort == "scope":
        click.echo("scope field cannot be used as sort option value")
        return
    args = {'sort': sort, 'sort_dir': sort_dir, 'brief': brief, 'with_cap': cap}
    args["start"] = 0
    args["limit"] = page

    if filter_type:
        args['kind'] = utils.filter_value_include(filter_type)

    while True:
        groups = get_groups(data, scope, args)
        if groups == None:
            break

        for group in groups:
            _list_group_display_format(group)

        # columns = ("name", "learned", "criteria", "members", "policy_rules", "policy_mode", "scope", "dlp_status", "sensors")
        columns = (
        "name", "learned", "criteria", "members", "policy_rules", "platform_role", "policy_mode", "profile_mode",
        "type")
        output.list(columns, groups)

        if args["limit"] > 0 and len(groups) < args["limit"]:
            break

        click.echo("Press <esc> to exit, press other key to continue ...")
        c = utils.keypress()
        if ord(c) == 27:
            break

        args["start"] += page


@show_group.command()
@click.argument("id_or_name")
@click.option('--cap', is_flag=True, default=False, help="with cap")
@click.pass_obj
def detail(data, id_or_name, cap):
    """Show group detail."""
    args = {'with_cap': cap}
    group = data.client.show("group", "group", id_or_name, **args)
    if not group:
        return

    _show_group_display_format(group)
    # columns = ("name", "learned", "criteria", "members", "policy_rules", "dlp_status", "sensors")
    columns = ("name", "learned", "policy_mode", "monitor_metric", "group_sess_cur", "group_sess_rate", "group_band_width", "criteria", "platform_role", "members", "policy_rules", "type")
    output.show(columns, group)

@show_group.command()
@click.argument("id_or_name")
@click.pass_obj
def stats(data, id_or_name):
    """Show group statistics."""
    stats = data.client.show("group", "stats", "%s/stats" % id_or_name)
    if not stats:
        return

    display = []

    span = 0
    stats["total"]["duration"] = "Total"
    utils.stats_display_format(stats["total"], span)
    display.append(stats["total"])

    span = stats["interval"]
    stats["span_1"]["duration"] = "Last %ss" % span
    utils.stats_display_format(stats["span_1"], span)
    display.append(stats["span_1"])

    span = stats["interval"] * 12
    stats["span_12"]["duration"] = "Last %ss" % span
    utils.stats_display_format(stats["span_12"], span)
    display.append(stats["span_12"])

    span = stats["interval"] * 60
    stats["span_60"]["duration"] = "Last %ss" % span
    utils.stats_display_format(stats["span_60"], span)
    display.append(stats["span_60"])

    column_map = (("duration", "Duration"),
                  ("cpu", "CPU (%)"),
                  ("memory", "Memory (MB)"),
                  ("session_in", "In Session"),
                  ("session_out", "Out Session"),
                  ("packet_in", "In Packet"),
                  ("packet_out", "Out Packet"),
                  ("byte_in", "In Tput"),
                  ("byte_out", "Out Tput"))
    output.list_with_map(column_map, display)


def _list_dlp_group_display_format(group):
    f = "status"
    if f not in group:
        fo = output.key_output(f)
        group[fo] = ""
    else:
        fo = output.key_output(f)
        s = ""
        if group[f]:
            s = "enable"
        else:
            s = "disable"
        group[fo] = s
    if "cfg_type" in group:
        group["type"] = client.CfgTypeDisplay[group["cfg_type"]]
    f = "sensors"
    if f not in group:
        fo = output.key_output(f)
        group[fo] = ""
    if f in group:
        fo = output.key_output(f)
        s = ""
        for sen in group[f]:
            if "comment" not in sen:
                s += "(\"%s\", %s)\n" % (sen["name"], sen["action"])
            else:
                s += "(\"%s\", %s, \"%s\")\n" % (sen["name"], sen["action"], sen["comment"])
        group[fo] = s.rstrip("\n")


@show_group.group("dlp", invoke_without_command=True)
@click.option('--scope', default='all', type=click.Choice(['fed', 'local', 'all']),
              help="Show federal, local or all groups")
@click.option("--page", default=5, type=click.IntRange(1), help="list page size, default=5")
@click.option('--sort_dir', type=click.Choice(['asc', 'desc']), default='asc',
              help="sort direction.")
@click.pass_obj
@click.pass_context
def show_group_dlp(ctx, data, scope, page, sort_dir):
    """Show dlp groups."""
    if ctx.invoked_subcommand is not None:
        return

    args = {'start': 0, 'limit': page}
    if scope == 'fed' or scope == 'local':
        args["scope"] = scope
    while True:
        drs = data.client.list("dlp/group", "dlp_group", **args)
        if drs == None:
            break
        for dr in drs:
            _list_dlp_group_display_format(dr)
            # click.echo("Group: %s, Status: %s" % (dr["name"], dr["status"]))
            # columns = ("name", "action")
        columns = ("name", "status", "sensors")
        # output.list(columns, dr["sensors"])
        output.list(columns, drs)

        if args["limit"] > 0 and len(drs) < args["limit"]:
            break
        click.echo("Press <esc> to exit, press other key to continue ...")
        c = utils.keypress()
        if ord(c) == 27:
            break
        args["start"] += page


@show_group_dlp.command()
@click.argument("name")
@click.option("--page", default=5, type=click.IntRange(1), help="list page size, default=5")
@click.option('--sort_dir', type=click.Choice(['asc', 'desc']), default='asc',
              help="sort direction.")
@click.pass_obj
def detail(data, page, sort_dir, name):
    """Show dlp group detail."""
    dr = data.client.show("dlp/group", "dlp_group", name)
    if not dr:
        return

    _list_dlp_group_display_format(dr)
    columns = ("name", "status", "sensors")
    output.show(columns, dr)
    # click.echo("Group: %s, Status: %s" % (dr["name"], dr["status"]))
    # columns = ("name", "action")
    # output.list(columns, dr["sensors"])


# waf
def _list_waf_group_display_format(group):
    f = "status"
    if f not in group:
        fo = output.key_output(f)
        group[fo] = ""
    else:
        fo = output.key_output(f)
        s = ""
        if group[f]:
            s = "enable"
        else:
            s = "disable"
        group[fo] = s
    if "cfg_type" in group:
        group["type"] = client.CfgTypeDisplay[group["cfg_type"]]
    f = "sensors"
    if f not in group:
        fo = output.key_output(f)
        group[fo] = ""
    if f in group:
        fo = output.key_output(f)
        s = ""
        for sen in group[f]:
            senType = "n/a"
            if sen["exist"] == True:
                sen["exist"] = "exist"
                if "cfg_type" in sen and sen["cfg_type"] != "":
                    senType = client.CfgTypeDisplay[sen["cfg_type"]]
            else:
                sen["exist"] = "non-exist"
            if "comment" not in sen:
                s += "(\"%s\", %s, %s, %s)\n" % (sen["name"], sen["action"], senType, sen["exist"])
            else:
                s += "(\"%s\", %s, %s, %s, \"%s\")\n" % (
                sen["name"], sen["action"], senType, sen["exist"], sen["comment"])
        group[fo] = s.rstrip("\n")


@show_group.group("waf", invoke_without_command=True)
@click.option('--scope', default='all', type=click.Choice(['fed', 'local', 'all']),
              help="Show federal, local or all groups")
@click.option("--page", default=5, type=click.IntRange(1), help="list page size, default=5")
@click.option('--sort_dir', type=click.Choice(['asc', 'desc']), default='asc',
              help="sort direction.")
@click.pass_obj
@click.pass_context
def show_group_waf(ctx, data, scope, page, sort_dir):
    """Show waf groups."""
    if ctx.invoked_subcommand is not None:
        return

    args = {'start': 0, 'limit': page}
    if scope == 'fed' or scope == 'local':
        args["scope"] = scope
    while True:
        drs = data.client.list("waf/group", "waf_group", **args)
        if drs == None:
            break
        for dr in drs:
            _list_waf_group_display_format(dr)

        columns = ("name", "status", "sensors", "type")
        output.list(columns, drs)

        if args["limit"] > 0 and len(drs) < args["limit"]:
            break
        click.echo("Press <esc> to exit, press other key to continue ...")
        c = utils.keypress()
        if ord(c) == 27:
            break
        args["start"] += page


@show_group_waf.command()
@click.argument("name")
@click.option("--page", default=5, type=click.IntRange(1), help="list page size, default=5")
@click.option('--sort_dir', type=click.Choice(['asc', 'desc']), default='asc',
              help="sort direction.")
@click.pass_obj
def detail(data, page, sort_dir, name):
    """Show waf group detail."""
    dr = data.client.show("waf/group", "waf_group", name)
    if not dr:
        return

    _list_waf_group_display_format(dr)
    columns = ("name", "status", "sensors", "type")
    output.show(columns, dr)


@show_group.command()
@click.argument("id_or_name")
@click.pass_obj
def custom_check(data, id_or_name):
    """Show group custom_check."""
    group = data.client.show("custom_check", "config", id_or_name)
    if not group:
        return

    enabledDsiplay = "enabled"
    if not group["enabled"]:
        enabledDsiplay = "disabled"
    click.echo("custom check is {}".format(enabledDsiplay))
    click.echo("")
    
    if not group["writable"]:
        click.echo("creating/editing custom check scripts is not allowed")
        click.echo("")

    if not group["scripts"]:
        return

    columns = ("name", "script")
    output.list(columns, group["scripts"])


def _add_criterion(key, value):
    k = key
    v = value
    op = CriteriaOpEqual

    if key == "label":
        try:
            k, v = value.split("!=")
            op = CriteriaOpNotEqual
        except ValueError:
            try:
                k, v = value.split("=")
                op = CriteriaOpEqual
            except ValueError:
                try:
                    k, v = value.split("@")
                    op = CriteriaOpContains
                except ValueError:
                    try:
                        k, v = value.split("^")
                        op = CriteriaOpPrefix
                    except ValueError:
                        try:
                            k, v = value.split("!~")
                            op = CriteriaOpNotRegex
                        except ValueError:
                            try:
                                k, v = value.split("~")
                                op = CriteriaOpRegex
                            except ValueError:
                                return None
    else:
        # Empty value is allowed.
        if len(v) > 0:
            if v[0] == '=':
                v = v[1:]
            elif len(v) > 1 and v[0] == '!' and v[1] == '=':
                op = CriteriaOpNotEqual
                v = v[2:]
            elif v[0] == '@':
                op = CriteriaOpContains
                v = v[1:]
            elif v[0] == '^':
                op = CriteriaOpPrefix
                v = v[1:]
            elif v[0] == '~':
                op = CriteriaOpRegex
                v = v[1:]
            elif len(v) > 1 and v[0] == '!' and v[1] == '~':
                op = CriteriaOpNotRegex
                v = v[2:]

    return {"key": k, "value": v, "op": op}


def _add_criteria(ct, key, values):
    for v in values:
        e = _add_criterion(key, v)
        if not e:
            click.echo("Error: Invalid input of --%s %s" % (key, v))
            return False
        ct.append(e)
    return True


@create.command("group")
@click.argument('name')
@click.option('--scope', default="local", type=click.Choice(['fed', 'local']), show_default=True,
              help="It's a local or federal group")
@click.option('--image', multiple=True, help="container image name.")
@click.option('--node', multiple=True, help="node name.")
@click.option('--domain', multiple=True, help="container domain.")
@click.option('--container', multiple=True, help="container workload name.")
@click.option('--service', multiple=True, help="container service name.")
@click.option('--label', multiple=True, help="container label.")
@click.option('--address', multiple=True, help="IP address range.")
@click.option("--monitor_metric", type=click.Choice(['enable', 'disable']), default=None, help="monitor metric status")
@click.option("--cur_sess", default=0, type=int, help="group current active session number threshold")
@click.option("--sess_rate", default=0, type=int, help="group session rate threshold in cps")
@click.option("--bandwidth", default=0, type=int, help="group throughput threshold in mbps")
@click.pass_obj
def create_group(data, name, scope, image, node, domain, container, service, label, address, monitor_metric, cur_sess, sess_rate, bandwidth):
    """Create group with criteria.

    If the option value starts with @, the criterion matches string with substring 'value';
    if the option value starts with ^, the criterion matches string with prefix 'value'.
    For --label, use: key=value, key^value or key@value.
    For --address, use: --address=1.2.3.4, --address=1.2.3.0/24, --address 1.2.3.1-1.2.3.31
    To input an empty string, use: --service =
    """
    ct = []
    if not _add_criteria(ct, "image", image):
        return
    if not _add_criteria(ct, "node", node):
        return
    if not _add_criteria(ct, "domain", domain):
        return
    if not _add_criteria(ct, "container", container):
        return
    if not _add_criteria(ct, "service", service):
        return
    if not _add_criteria(ct, "label", label):
        return
    if not _add_criteria(ct, "address", address):
        return

    if len(ct) == 0:
        click.echo("Error: Must create group with criteria.")
        return

    cfg_type = client.UserCreatedCfg
    if scope == "fed":
        cfg_type = client.FederalCfg
    if monitor_metric == "enable":
        monmet = True
    else:
        monmet = False
    data.client.create("group", {"config": {"name": name, "criteria": ct, "cfg_type": cfg_type, "monitor_metric":monmet, "group_sess_cur":cur_sess, "group_sess_rate":sess_rate, "group_band_width":bandwidth}})


@set.group("group")
@click.argument("name")
@click.pass_obj
@click.pass_context
def set_group(ctx, data, name):
    """Set group configuration."""
    data.id_or_name = name


@set_group.command("setting")
@click.option('--image', multiple=True, help="container image name.")
@click.option('--node', multiple=True, help="node name.")
@click.option('--domain', multiple=True, help="domain name.")
@click.option('--container', multiple=True, help="container workload name.")
@click.option('--service', multiple=True, help="container service name.")
@click.option('--label', multiple=True, help="container label.")
@click.option('--address', multiple=True, help="ip address range list.")
@click.option("--monitor_metric", type=click.Choice(['enable', 'disable']), default=None, help="monitor metric status")
@click.option("--cur_sess", type=int, default=None, help="group current active session number threshold")
@click.option("--sess_rate", type=int, default=None, help="group session rate threshold in cps")
@click.option("--bandwidth", type=int, default=None, help="group throughput threshold in mbps")
@click.pass_obj
# def set_group_setting(data, image, node, domain, container, service, label, address, dlp):
def set_group_setting(data, image, node, domain, container, service, label, address, monitor_metric, cur_sess, sess_rate, bandwidth):
    """Set group configuration.

    For partial match, add @ in front of the value streig, for example --image @nginx.
    if the option value starts with ^, the criterion matches strign with prefix 'value'.
    For --label, use: key=value, key^value or key@value.
    For --address, use: --address=1.2.3.4, --address=1.2.3.0/24, --address 1.2.3.1-1.2.3.31
    To input an empty string, use: --service =
    """
    ct = []
    if not _add_criteria(ct, "image", image):
        return
    if not _add_criteria(ct, "node", node):
        return
    if not _add_criteria(ct, "domain", domain):
        return
    if not _add_criteria(ct, "container", container):
        return
    if not _add_criteria(ct, "service", service):
        return
    if not _add_criteria(ct, "label", label):
        return
    if not _add_criteria(ct, "address", address):
        return

    group = {"name": data.id_or_name}
    if len(ct) > 0:
        group["criteria"] = ct
    if monitor_metric != None:
        group["monitor_metric"] = monitor_metric == "enable"
    if cur_sess != None:
        group["group_sess_cur"] = cur_sess
    if sess_rate != None:
        group["group_sess_rate"] = sess_rate
    if bandwidth != None:
        group["group_band_width"] = bandwidth

    data.client.config("group", data.id_or_name, {"config": group})


@set_group.command("dlp")
@click.argument("status", type=click.Choice(['enable', 'disable']))
@click.argument("sensor")
@click.argument("action", type=click.Choice(['allow', 'deny']))
@click.pass_obj
def set_group_dlp(data, status, sensor, action):
    """Set group dlp sensor."""
    cfg = []
    cfg.append({"name": sensor, "action": action})
    group = {"name": data.id_or_name, "status": status == 'enable', "sensors": cfg}
    data.client.config("dlp/group", data.id_or_name, {"config": group})


@set_group.command("waf")
@click.argument("status", type=click.Choice(['enable', 'disable']))
@click.argument("sensor")
@click.argument("action", type=click.Choice(['allow', 'deny']))
@click.pass_obj
def set_group_waf(data, status, sensor, action):
    """Set group waf sensor."""
    cfg = []
    cfg.append({"name": sensor, "action": action})
    group = {"name": data.id_or_name, "status": status == 'enable', "sensors": cfg}
    data.client.config("waf/group", data.id_or_name, {"config": group})


# -- unset
@unset.group("group")
@click.argument("name")
@click.pass_obj
@click.pass_context
def unset_group(ctx, data, name):
    """Unset group configuration."""
    data.id_or_name = name


@unset_group.command("dlp")
@click.argument("status", type=click.Choice(['enable', 'disable']))
@click.argument("sensor")
@click.pass_obj
def unset_group_dlp(data, status, sensor):
    """Unset group dlp sensor."""
    cfg = []
    cfg.append(sensor)
    group = {"name": data.id_or_name, "status": status == 'enable', "delete": cfg}
    data.client.config("dlp/group", data.id_or_name, {"config": group})


@unset_group.command("waf")
@click.argument("status", type=click.Choice(['enable', 'disable']))
@click.argument("sensor")
@click.pass_obj
def unset_group_waf(data, status, sensor):
    """Unset group waf sensor."""
    cfg = []
    cfg.append(sensor)
    group = {"name": data.id_or_name, "status": status == 'enable', "delete": cfg}
    data.client.config("waf/group", data.id_or_name, {"config": group})


@set.command("custom_check")
@click.argument('name')
@click.option('--title', help="script title.")
@click.option('--script', help="test script.")
@click.pass_obj
def set_custom_check(data, name, title, script):
    """Set custom_check configuration."""

    group = {"add": {"scripts": [{"name": title, "script": script}]}}
    data.client.config("custom_check", name, {"config": group})


# -- delete
@delete.command("group")
@click.argument('name')
@click.pass_obj
def delete_group(data, name):
    """Delete group."""
    data.client.delete("group", name)


# service -----

def _list_service_display_format(service):
    f = "members"
    if f in service:
        fo = output.key_output(f)
        service[fo] = len(service[f])

    f = "policy_rules"
    if f in service:
        fo = output.key_output(f)
        service[fo] = len(service[f])


def _show_service_display_format(service):
    for wl in service["members"]:
        f = "id"
        if wl.get(f):
            fo = output.key_output(f)
            wl[fo] = wl[f][:output.SHORT_ID_LENGTH]

    for pol in service["policy_rules"]:
        list_policy_display_format(pol)


@show.group("service", invoke_without_command=True)
@click.option('--cap', is_flag=True, default=False, help="with cap")
@click.option("--page", default=40, type=click.IntRange(1), help="list page size, default=40")
@click.option('--sort', default=None, help="sort field.")
@click.option('--sort_dir', type=click.Choice(['asc', 'desc']), default='asc',
              help="sort direction.")
@click.pass_obj
@click.pass_context
def show_service(ctx, data, cap, page, sort, sort_dir):
    """Show service"""
    if ctx.invoked_subcommand is not None:
        return

    args = {'sort': sort, 'sort_dir': sort_dir, 'with_cap': cap}
    args["start"] = 0
    args["limit"] = page

    while True:
        services = data.client.list("service", "service", **args)
        if services == None:
            break

        for service in services:
            _list_service_display_format(service)

        columns = (
                "name", "policy_mode", "profile_mode", "members", "policy_rules", "platform_role",
                "ingress_exposure", "egress_exposure", "baseline_profile")
        output.list(columns, services)

        if args["limit"] > 0 and len(services) < args["limit"]:
            break

        click.echo("Press <esc> to exit, press other key to continue ...")
        c = utils.keypress()
        if ord(c) == 27:
            break

        args["start"] += page


@show_service.command()
@click.argument("id_or_name")
@click.option('--cap', is_flag=True, default=False, help="with cap")
@click.pass_obj
def detail(data, id_or_name, cap):
    """Show service detail."""
    args = {'with_cap': cap}
    service = data.client.show("service", "service", id_or_name, **args)
    if not service:
        return

    _show_service_display_format(service)

    click.echo("Policy mode: %s" % service["policy_mode"])
    click.echo("Profile mode: %s" % service["profile_mode"])
    click.echo("Total members: %d" % len(service["members"]))
    columns = ("id", "name", "state")
    output.list(columns, service["members"])
    click.echo("Total policies: %s" % len(service["policy_rules"]))
    columns = ("id", "from", "to", "applications", "ports", "action", "learned", "status", "platform_role")
    output.list(columns, service["policy_rules"])


@create.command("service")
@click.argument('name')
@click.argument('domain')
@click.option("-m", "--policy_mode", type=click.Choice(['discover', 'monitor', 'protect']))
@click.option("-n", "--profile_mode", type=click.Choice(['discover', 'monitor', 'protect']))
@click.option("-b", "--baseline", type=click.Choice(['basic', 'zero-drift']))
@click.pass_obj
def create_service(data, name, domain, policy_mode, profile_mode, baseline):
    """Set service configuration."""
    if policy_mode != None and profile_mode != None:
        data.client.create("service", {"config": {"name": name, "domain": domain, "policy_mode": policy_mode.title(), "profile_mode": profile_mode.title(), "baseline_profile": baseline}})
    elif policy_mode != None:
        data.client.create("service", {"config": {"name": name, "domain": domain, "policy_mode": policy_mode.title(), "baseline_profile": baseline}})
    elif profile_mode != None:
        data.client.create("service", {"config": {"name": name, "domain": domain, "profile_mode": profile_mode.title(), "baseline_profile": baseline}})
    else:
        data.client.create("service", {"config": {"name": name, "domain": domain}})


@set.group("service")
@click.argument('name')
@click.pass_obj
def set_service(data, name):
    """Set service configuration."""
    data.id_or_name = name


@set_service.command()
@click.argument("policy_mode", type=click.Choice(['discover', 'monitor', 'protect']))
@click.option("-n", "--profile_mode", type=click.Choice(['discover', 'monitor', 'protect']))
@click.option("-b", "--baseline", type=click.Choice(['basic', 'zero-drift']))
@click.pass_obj
def policy_mode(data, policy_mode, profile_mode, baseline):
    """Set service policy mode and baseline profile."""
    config = {}
    if profile_mode != None:
        config = {"services": data.id_or_name.split(","), "policy_mode": policy_mode.title(), "profile_mode": profile_mode.title(), "baseline_profile": baseline}
    else:
        config = {"services": data.id_or_name.split(","), "policy_mode": policy_mode.title(), "baseline_profile": baseline}
    data.client.config("service", "config", {"config": config})


@set_service.command("network")
@click.argument("policy_mode", type=click.Choice(['discover', 'monitor', 'protect']))
@click.pass_obj
def net_policy_mode(data, policy_mode):
    """Set service network policy mode."""
    config = {"services": data.id_or_name.split(","), "policy_mode": policy_mode.title()}
    data.client.config("service", "config/network", {"config": config})


@set_service.command("profile")
@click.argument("profile_mode", type=click.Choice(['discover', 'monitor', 'protect']))
@click.option("-b", "baseline", type=click.Choice(['basic', 'zero-drift']))
@click.pass_obj
def profile_mode(data, profile_mode, baseline):
    """Set service profile mode and baseline profile"""
    config = {"services": data.id_or_name.split(","), "profile_mode": profile_mode.title(), "baseline_profile": baseline}
    data.client.config("service", "config/profile", {"config": config})
