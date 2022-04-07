import click
import io

from prog.cli import show
from prog.cli import request
from prog.cli import set
from prog import client
from prog import multipart
from prog import output
from prog import utils

WidthApplication = 25


def _show_display_format(wl):
    f = "finished_at"
    if wl.get("running"):
        fo = output.key_output(f)
        wl[fo] = ""
    f = "interfaces"
    if wl.get(f):
        fo = output.key_output(f)
        s = ""
        for iface in wl[f]:
            for addr in wl[f][iface]:
                s += "%s:%s/%s\n" % (iface, addr["ip"], addr["ip_prefix"])
        wl[fo] = s.rstrip()
    f = "applications"
    if wl.get(f):
        fo = output.key_output(f)
        s = ""
        for a in wl[f]:
            s += a + ","
            if len(s) >= WidthApplication:
                s = s[:-1] + "\n"
        wl[fo] = s[:-1]
    f = "labels"
    if wl.get(f):
        fo = output.key_output(f)
        kv = ""
        keys = sorted(wl[f].keys())
        for key in keys:
            kv += "%s=%s\n" % (key, wl[f][key])
        wl[fo] = kv.rstrip("\n")
    f = "ports"
    if wl.get(f):
        fo = output.key_output(f)
        s = ""
        for p in wl[f]:
            if p["ip_proto"] == 6:
                ipproto = "tcp"
            elif p["ip_proto"] == 17:
                ipproto = "udp"
            else:
                ipproto = "ip%d" % p["ip_proto"]
            s += "%s/%s => %s:%s\n" % (ipproto, p["port"], p["host_ip"], p["host_port"])
        wl[fo] = s.rstrip("\n")


def _list_display_format(wl):
    f = "id"
    if wl.get(f):
        fo = output.key_output(f)
        wl[fo] = wl[f][:output.SHORT_ID_LENGTH]

    _show_display_format(wl)


@show.group('container', invoke_without_command=True)
@click.option('-b', '--brief', is_flag=True, default=False, help="brief output")
@click.option('-v', '--view', type=click.Choice(['', 'pod']), default='', help="specify view")
@click.option('-c', '--filter_container', default=None, help="filter by container name.")
@click.option('-i', '--filter_image', default=None, help="filter by image.")
@click.option('-n', '--filter_node', default=None, help="filter by node.")
@click.option('-d', '--filter_domain', default=None, help="filter by domain.")
@click.option("--page", default=40, type=click.IntRange(1), help="list page size, default=40")
@click.option('--sort', default=None, help="sort field.")
@click.option('--sort_dir', type=click.Choice(['asc', 'desc']), default='asc',
              help="sort direction.")
@click.pass_obj
@click.pass_context
def show_workload(ctx, data, brief, view, filter_container, filter_image, filter_node, filter_domain, page, sort,
                  sort_dir):
    """Show container."""
    if ctx.invoked_subcommand is not None:
        return

    args = {'sort': sort, 'sort_dir': sort_dir, 'brief': brief}
    if view:
        args['view'] = view
    if filter_container:
        args['name'] = utils.filter_value_include(filter_container)
    if filter_image:
        args['image'] = utils.filter_value_include(filter_image)
    if filter_node:
        args['host_name'] = utils.filter_value_include(filter_node)
    if filter_domain:
        args['domain'] = utils.filter_value_include(filter_domain)
    args["start"] = 0
    args["limit"] = page

    while True:
        wls = data.client.list("workload", "workload", **args)
        if wls == None:
            break

        for wl in wls:
            _list_display_format(wl)

        if brief:
            columns = ["id", "name", "service", "state"]
            output.list(columns, wls)
        else:
            columns = ["id", "name", "host_name", "image", "state", "platform_role", "applications", "started_at",
                       "interfaces"]
            output.list(columns, wls)

        if args["limit"] > 0 and len(wls) < args["limit"]:
            break

        click.echo("Press <esc> to exit, press other key to continue ...")
        c = utils.keypress()
        if ord(c) == 27:
            break

        args["start"] += page


@show_workload.command()
@click.argument("id_or_name")
@click.pass_obj
def detail(data, id_or_name):
    """Show container detail."""
    wl = utils.get_managed_object(data.client, "workload", "workload", id_or_name)
    if not wl:
        return

    _show_display_format(wl)
    columns = ("id", "name", "display_name", "domain", "host_name", "host_id", "enforcer_id", "image", "state",
               "applications", "created_at", "started_at", "finished_at", "running", "exit_code",
               "platform_role", "network_mode", "interfaces", "ports", "labels",
               "memory_limit", "cpus")
    output.show(columns, wl)


@show_workload.command()
@click.argument("id_or_name")
@click.pass_obj
def process(data, id_or_name):
    """Show container processes."""
    wl = utils.get_managed_object(data.client, "workload", "workload", id_or_name)
    if not wl:
        return

    try:
        procs = data.client.show("workload", "processes", "%s/process" % wl["id"])
    except client.ObjectNotFound:
        return

    columns = ("name", "pid", "parent", "group", "session", "cmdline", "root", "action")
    output.list(columns, procs)


@show_workload.command()
@click.argument("id_or_name")
@click.pass_obj
def process_history(data, id_or_name):
    """Show container process history."""
    wl = utils.get_managed_object(data.client, "workload", "workload", id_or_name)
    if not wl:
        return

    try:
        procs = data.client.show("workload", "processes", "%s/process_history" % wl["id"])
    except client.ObjectNotFound:
        return

    columns = ("name", "pid", "parent", "cmdline", "status", "root", "action")
    output.list(columns, procs)


@show_workload.command()
@click.argument("id_or_name")
@click.pass_obj
def profile_process(data, id_or_name):
    """Show container derived process profile."""
    wl = utils.get_managed_object(data.client, "workload", "workload", id_or_name)
    if not wl:
        return

    try:
        profile = data.client.show("workload", "process_list", "%s/process_profile" % wl["id"])
    except client.ObjectNotFound:
        return

    for p in profile:
        p["type"] = client.CfgTypeDisplay[p["cfg_type"]]

    columns = ("name", "path", "action", "type", "group")
    output.list(columns, profile)


@show_workload.command()
@click.argument("id_or_name")
@click.pass_obj
def profile_file(data, id_or_name):
    """Show container derived file profile."""
    wl = utils.get_managed_object(data.client, "workload", "workload", id_or_name)
    if not wl:
        return

    try:
        profile = data.client.show("workload", "filters", "%s/file_profile" % wl["id"])
    except client.ObjectNotFound:
        return

    for p in profile:
        v = []
        apps = p["applications"]
        if apps != None:
            for a in apps:
                v.append(a)
        p["applications"] = "{}".format(", ".join(v))
        p["type"] = client.CfgTypeDisplay[p["cfg_type"]]

    columns = ("filter", "recursive", "behavior", "applications", "type", "group")
    output.list(columns, profile)


@show_workload.command()
@click.argument("id_or_name")
@click.pass_obj
def stats(data, id_or_name):
    """Show container statistics."""
    wl = utils.get_managed_object(data.client, "workload", "workload", id_or_name)
    if not wl:
        return

    try:
        stats = data.client.show("workload", "stats", "%s/stats" % wl["id"])
    except client.ObjectNotFound:
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


@show_workload.command()
@click.argument("id_or_name")
@click.pass_obj
def setting(data, id_or_name):
    """Show container configurations."""
    wl = utils.get_managed_object(data.client, "workload", "workload", id_or_name)
    if not wl:
        return

    try:
        conf = data.client.show("workload", "config", "%s/config" % wl["id"])
    except client.ObjectNotFound:
        return

    columns = ("wire", "quarantine", "quarantine_reason")
    output.show(columns, conf)


@show_workload.command()
@click.argument("id_or_name")
@click.pass_obj
def intercept(data, id_or_name):
    """Debug container intercept rules."""
    wl = utils.get_managed_object(data.client, "workload", "workload", id_or_name)
    if not wl:
        return

    try:
        filter = {"workload": wl["id"]}
        resp = data.client.show("debug/workload/intercept", "intercept", None, **filter)
    except client.ObjectNotFound:
        return

    column_map = (
        ("port", "Port"),
        ("peer", "Peer"),
        ("mac", "MAC"),
        ("uc_mac", "Unicast"),
        ("bc_mac", "Multicast"),
        ("in_port", "Int-Port"),
        ("ex_port", "Ext-Port"),
        ("in_rules", "Int-Rule"),
        ("ex_rules", "Ext-Rule"),
        ("enforcer_rules", "Enforcer-Rule"))

    for p in resp["ports"]:
        output.show_with_map(column_map, p)


@set.group('container')
@click.argument("id_or_name")
@click.pass_obj
def set_workload(data, id_or_name):
    """Set container configuration."""
    data.id_or_name = id_or_name


@set_workload.command()
@click.argument("mode", type=click.Choice(['default', 'inline']))
@click.pass_obj
def wire(data, mode):
    """Set container wire mode. default: Follow policy mode configuration."""
    wl = utils.get_managed_object(data.client, "workload", "workload", data.id_or_name)
    if not wl:
        return

    data.client.config("workload", wl["id"], {"config": {"wire": mode}})


@set_workload.command()
@click.argument('status', type=click.Choice(['enable', 'disable']))
@click.pass_obj
def quarantine(data, status):
    """Set container quarantine status."""
    wl = utils.get_managed_object(data.client, "workload", "workload", data.id_or_name)
    if not wl:
        return

    if status == 'enable':
        data.client.config("workload", wl["id"], {"config": {"quarantine": True}})
    else:
        data.client.config("workload", wl["id"], {"config": {"quarantine": False}})


# -- Request

@request.group('container')
@click.argument("id_or_name")
@click.pass_obj
def request_workload(data, id_or_name):
    """Container"""
    data.id_or_name = id_or_name


@request_workload.command('stop')
@click.pass_obj
def request_workload_stop(data):
    """Request to stop a container"""
    wl = utils.get_managed_object(data.client, "workload", "workload", data.id_or_name)
    if not wl:
        return

    try:
        data.client.request("workload", "request", wl["id"], {"request": {"command": "stop"}})
    except client.ObjectNotFound:
        click.echo("Error: cannot find the container")
        return


@request_workload.command('start')
@click.pass_obj
def request_workload_start(data):
    """Request to restart a container"""
    wl = utils.get_managed_object(data.client, "workload", "workload", data.id_or_name)
    if not wl:
        return

    try:
        data.client.request("workload", "request", wl["id"], {"request": {"command": "start"}})
    except client.ObjectNotFound:
        click.echo("Error: cannot find the container")
        return


@request_workload.command('logs')
@click.option('--filename', '-f', type=click.Path(dir_okay=False, writable=True, resolve_path=True))
@click.option("--dir", default='end', type=click.Choice(['start', 'end']))
@click.option("--size", '-s', default=20, type=click.IntRange(0), help="size (in MB) of the logs, default=20MB")
@click.pass_obj
def request_workload_logs(data, filename, dir, size):
    """Request container logs"""
    filter = {}

    wl = utils.get_managed_object(data.client, "workload", "workload", data.id_or_name)
    if not wl:
        return
    path = "workload/%s/logs" % wl["id"]
    container_id = wl["id"]

    if dir == 'start':
        filter["start"] = 0
    else:
        filter["start"] = -1
    if size:
        filter["limit"] = size * 1024 * 1024

    headers, body = data.client.download(path, **filter)

    if filename:
        filepath = filename
    else:
        filepath = container_id + ".log"

    with click.open_file(filepath, 'w') as wfp:
        click.echo("Save logs to: %s" % filepath)
        wfp.write(body.content)
