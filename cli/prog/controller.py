import click

from prog.cli import set as cli_set
from prog.cli import show
from prog.cli import request
from prog import client
from prog import output
from prog import utils


def _ctrl_list_display_format(dev, id):
    f = id
    if f in dev:
        fo = output.key_output(f)
        dev[fo] = dev[f][:output.SHORT_ID_LENGTH]


@show.group(invoke_without_command=True)
@click.option('--sort', default=None, help="sort field.")
@click.option('--sort_dir', type=click.Choice(['asc', 'desc']), default='asc',
              help="sort direction.")
@click.pass_obj
@click.pass_context
def controller(ctx, data, sort, sort_dir):
    """Show controller."""
    if ctx.invoked_subcommand is not None:
        return

    ctrls = data.client.list("controller", "controller", sort=sort, sort_dir=sort_dir)
    for ctrl in ctrls:
        _ctrl_list_display_format(ctrl, "id")

    click.echo("Total controllers: %s" % len(ctrls))
    columns = (
    "id", "name", "host_name", "version", "joined_at", "cluster_ip", "leader", "connection_state", "disconnected_at")
    output.list(columns, ctrls)


@controller.command()
@click.argument("id_or_name")
@click.pass_obj
def detail(data, id_or_name):
    """Show controller detail."""
    ctrl = utils.get_managed_object(data.client, "controller", "controller", id_or_name)
    if not ctrl:
        return

    columns = ("id", "name", "display_name", "host_name", "version",
               "created_at", "started_at", "joined_at", "memory_limit", "cluster_ip", "leader")
    output.show(columns, ctrl)


@controller.command()
@click.argument("id_or_name")
@click.pass_obj
def setting(data, id_or_name):
    """show controller configurations."""
    ctrler = utils.get_managed_object(data.client, "controller", "controller", id_or_name)
    if not ctrler:
        return

    try:
        conf = data.client.show("controller", "config", "%s/config" % ctrler["id"])
    except client.ObjectNotFound:
        return

    f = "debug"
    fo = output.key_output(f)
    if f in conf and conf[f]:
        conf[fo] = ", ".join(conf[f])
    else:
        conf[fo] = ""

    columns = ("debug",)
    output.show(columns, conf)


@controller.command()
@click.argument("id_or_name")
@click.pass_obj
def counter(data, id_or_name):
    """Show controller counters."""
    ctrler = utils.get_managed_object(data.client, "controller", "controller", id_or_name)
    if not ctrler:
        return

    try:
        counter = data.client.show("controller", "counter", "%s/counter" % ctrler["id"])
    except client.ObjectNotFound:
        return

    column_map = (("graph_nodes", "Number of graph nodes"),
                  ("goroutines", "Number of goroutines"))
    output.show_with_map(column_map, counter)


@controller.command()
@click.pass_obj
def sync(data):
    """Show controller sync information"""
    info = data.client.show("debug/controller", "sync", "sync")
    columns = ["cluster_ip", "leader", "learned_rule_max", "graph_node_count", "graph_modify_idx", "sync_error_found"]
    output.list(columns, info)


# -- Set

@cli_set.group("controller")
@click.argument("id_or_name")
@click.pass_obj
def set_controller(data, id_or_name):
    """Set controller configuration."""
    data.id_or_name = id_or_name


@set_controller.command()
@click.option('--category', '-c', multiple=True,
              type=click.Choice(['all', 'cpath', 'conn', 'mutex', 'scan', 'cluster'])
              )
@click.pass_obj
def debug(data, category):
    """Configure controller debug."""
    ctrler = utils.get_managed_object(data.client, "controller", "controller", data.id_or_name)
    if not ctrler:
        return

    conf = {}

    s = set()
    for c in category:
        if c == 'all':
            s |= set(['cpath', 'conn', 'mutex', 'scan', 'cluster'])
        else:
            s.add(c)
    # Can't use list(s) because we overwrite list with our own function
    l = []
    for c in s:
        l.append(c)
    conf["debug"] = l

    data.client.config("controller", ctrler["id"], {"config": conf})


# -- Request

@request.group('controller')
@click.argument("id_or_name")
@click.pass_obj
def request_controller(data, id_or_name):
    """Request controller """
    data.id_or_name = id_or_name


@request_controller.command("profile")
@click.option('--category', '-c', multiple=True, type=click.Choice(['all', 'cpu', 'memory']))
@click.option("--duration", '-d', default=10, type=click.IntRange(1, 60, clamp=True), help="profiling duration")
@click.pass_obj
def request_controller_profile(data, category, duration):
    """Profiling controller performance."""
    controller = utils.get_managed_object(data.client, "controller", "controller", data.id_or_name)
    if not controller:
        return

    prof = {"duration": duration}

    s = set()
    for c in category:
        if c == 'all':
            s |= set(['cpu', 'memory'])
        else:
            s.add(c)
    # Can't use list(s) because we overwrite list with our own function
    l = []
    for c in s:
        l.append(c)
    prof["methods"] = l

    data.client.request("controller", "%s/profiling" % controller["id"], None, {"profiling": prof})


@request_controller.command()
@click.pass_obj
def sync(data):
    """Request controller sync """
    ctrl = utils.get_managed_object(data.client, "controller", "controller", data.id_or_name)
    if not ctrl:
        return

    data.client.request("debug/controller", "sync", ctrl["id"], None)


@request_controller.command('logs')
@click.option('--filename', '-f', type=click.Path(dir_okay=False, writable=True, resolve_path=True))
@click.option("--dir", default='end', type=click.Choice(['start', 'end']))
@click.option("--size", '-s', default=20, type=click.IntRange(0), help="size (in MB) of the logs, default=20MB")
@click.pass_obj
def request_controller_logs(data, filename, dir, size):
    """Request controller logs"""
    filter = {}

    ctrl = utils.get_managed_object(data.client, "controller", "controller", data.id_or_name)
    if ctrl:
        path = "controller/%s/logs" % ctrl["id"]
        device_id = ctrl["id"]
    else:
        return

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
        filepath = device_id + ".log"

    with click.open_file(filepath, 'w') as wfp:
        click.echo("Save logs to: %s" % filepath)
        wfp.write(body.content)


@controller.command()
@click.argument("id_or_name")
@click.pass_obj
def stats(data, id_or_name):
    """Show controller statistics."""
    controller = utils.get_managed_object(
        data.client, "controller", "controller", id_or_name)
    if not controller:
        return

    try:
        stats = data.client.show(
            "controller", "stats", "%s/stats" % controller["id"])
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
                  ("memory", "Memory (MB)"))
    output.list_with_map(column_map, display)
