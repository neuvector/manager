import click

from prog.cli import set as cli_set
from prog.cli import show
from prog.cli import request
from prog import client
from prog import output
from prog import utils


def _list_display_format(dev, id):
    f = id
    if f in dev:
        fo = output.key_output(f)
        dev[fo] = dev[f][:output.SHORT_ID_LENGTH]

    f = "nv_protect"
    if f not in dev:
        dev[f] = True


@show.group(invoke_without_command=True)
@click.option('--sort', default=None, help="sort field.")
@click.option('--sort_dir', type=click.Choice(['asc', 'desc']), default='asc',
              help="sort direction.")
@click.pass_obj
@click.pass_context
def enforcer(ctx, data, sort, sort_dir):
    """Show enforcer."""
    if ctx.invoked_subcommand is not None:
        return

    enforcers = data.client.list("enforcer", "enforcer", sort=sort, sort_dir=sort_dir)
    for enforcer in enforcers:
        _list_display_format(enforcer, "id")

    click.echo("Total enforcers: %s" % len(enforcers))
    columns = ("id", "name", "host_name", "version", "joined_at", "cluster_ip", "connection_state", "disconnected_at")
    output.list(columns, enforcers)


@enforcer.command()
@click.argument("id_or_name")
@click.pass_obj
def detail(data, id_or_name):
    """Show enforcer detail."""
    enforcer = utils.get_managed_object(data.client, "enforcer", "enforcer", id_or_name)
    if not enforcer:
        return

    f = "nv_protect"
    if f not in enforcer:
        enforcer[f] = True

    columns = ("id", "name", "display_name", "host_name", "version",
               "created_at", "started_at", "joined_at", "memory_limit", "cluster_ip", "nv_protect")
    output.show(columns, enforcer)


@enforcer.command()
@click.argument("id_or_name")
@click.pass_obj
def stats(data, id_or_name):
    """Show enforcer statistics."""
    enforcer = utils.get_managed_object(data.client, "enforcer", "enforcer", id_or_name)
    if not enforcer:
        return

    try:
        stats = data.client.show("enforcer", "stats", "%s/stats" % enforcer["id"])
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


@enforcer.command()
@click.argument("id_or_name")
@click.pass_obj
def counter(data, id_or_name):
    """Show enforcer counters."""
    enforcer = utils.get_managed_object(data.client, "enforcer", "enforcer", id_or_name)
    if not enforcer:
        return

    try:
        counter = data.client.show("enforcer", "counter", "%s/counter" % enforcer["id"])
    except client.ObjectNotFound:
        return

    display = []

    column_map = (("rx_packets", "Packet RX"),
                  ("rx_drop_packets", "Packet RX drop"),
                  ("tx_packets", "Packet TX"),
                  ("tx_drop_packets", "Packet TX drop"),
                  ("error_packets", "Packet errors"),
                  ("no_workload_packets", "Packet with no workload"),
                  ("ipv4_packets", "Packet IPv4"),
                  ("ipv6_packets", "Packet IPv6"),
                  ("tcp_packets", "Packet TCP"),
                  ("tcp_no_session_packets", "Packet TCP without session"),
                  ("udp_packets", "Packet UDP"),
                  ("icmp_packets", "Packet ICMP"),
                  ("other_packets", "Packet other"),
                  ("total_assemblys", "TCP ASM"),
                  ("freed_assemblys", "TCP ASM freed"),
                  ("total_fragments", "IP fragment"),
                  ("freed_fragments", "IP fragment freed"),
                  ("timeout_fragments", "IP fragment timeout"),
                  ("tcp_sessions", "Session TCP"),
                  ("udp_sessions", "Session UDP"),
                  ("icmp_sessions", "Session ICMP"),
                  ("ip_sessions", "Session IP"),
                  ("drop_meters", "Packet dropped by DDoS meter"),
                  ("proxy_meters", "Session TCP proxy"),
                  ("cur_meters", "Current DDoS meters"),
                  ("cur_log_caches", "Current log caches"),
                  ("policy_type1_rules", "Policy type1 rules"),
                  ("policy_type2_rules", "Policy type2 rules"),
                  ("policy_domains", "Policy domains"),
                  ("policy_domain_ips", "Policy domain IPs"),
                  ("goroutines", "Number of goroutines"))
    output.show_with_map(column_map, counter)

    ps = counter.get('parser_sessions')
    pp = counter.get('parser_packets')
    if ps and pp:
        names = ["http", "ssl", "ssh", "dns", "dhcp", "ntp", "tftp", "echo", "mysql", "redis",
                 "zookeeper", "cassandra", "mongodb", "postgresql", "kafka", "couchbase", "spark"]
        parsers = [None] * len(names)
        for i, n in enumerate(names):
            parsers[i] = {"parser": n}
            if i < len(ps):
                parsers[i]["sessions"] = ps[i]
            if i < len(pp):
                parsers[i]["packets"] = pp[i]

        output.list(("parser", "sessions", "packets"), parsers)


@enforcer.command()
@click.argument("id_or_name")
@click.pass_obj
def setting(data, id_or_name):
    """show enforcer configurations."""
    enforcer = utils.get_managed_object(data.client, "enforcer", "enforcer", id_or_name)
    if not enforcer:
        return

    try:
        conf = data.client.show("enforcer", "config", "%s/config" % enforcer["id"])
    except client.ObjectNotFound:
        return

    f = "debug"
    if f in conf:
        fo = output.key_output(f)
        conf[fo] = ", ".join(conf[f])

    columns = ("debug",)
    output.show(columns, conf)


@enforcer.command()
@click.argument("id_or_name")
@click.pass_obj
def probe_summary(data, id_or_name):
    """Show enforcer probe summary information."""
    enforcer = utils.get_managed_object(data.client, "enforcer", "enforcer", id_or_name)
    if not enforcer:
        return

    try:
        info = data.client.show("enforcer", "summary", "%s/probe_summary" % enforcer["id"])
    except client.ObjectNotFound:
        return

    columns = ["containers", "pid_containers", "pid_procs", "new_procs", "new_suspicious_procs",
               "stopped_container", "removed_containers", "pids", "host_sessions"]
    output.show(columns, info)


@enforcer.command()
@click.argument("id_or_name")
@click.pass_obj
def probe_process(data, id_or_name):
    """Show enforcer probe processes information."""
    enforcer = utils.get_managed_object(data.client, "enforcer", "enforcer", id_or_name)
    if not enforcer:
        return

    try:
        procs = data.client.show("enforcer", "processes", "%s/probe_processes" % enforcer["id"])
    except client.ObjectNotFound:
        return

    for proc in procs:
        _list_display_format(proc, "container")

    columns = ["pid", "ppid", "name", "euid", "container"]
    output.list(columns, procs)


@enforcer.command()
@click.argument("id_or_name")
@click.pass_obj
def probe_container(data, id_or_name):
    """Show enforcer probe containers information."""
    enforcer = utils.get_managed_object(data.client, "enforcer", "enforcer", id_or_name)
    if not enforcer:
        return

    try:
        containers = data.client.show("enforcer", "containers", "%s/probe_containers" % enforcer["id"])
    except client.ObjectNotFound:
        return

    columns = ["id", "pid", "children", "port_map"]
    cons = []
    for con in containers:
        # Too many host's processes, ignore them
        if con["id"] != "":
            _list_display_format(con, "id")
            cons.append(con)

    output.list(columns, cons)


# -- Set

@cli_set.group("enforcer")
@click.argument("id_or_name")
@click.pass_obj
def set_enforcer(data, id_or_name):
    """Set enforcer configuration."""
    data.id_or_name = id_or_name


@set_enforcer.command()
@click.option('--category', '-c', multiple=True,
              type=click.Choice(
                  ['all', 'cpath', 'conn', 'error', 'ctrl', 'packet', 'session', 'timer', 'tcp', 'parser', 'log',
                   'ddos', 'cluster', 'policy', 'dlp', 'monitor'])
              )
@click.pass_obj
def debug(data, category):
    """Configure enforcer debug."""
    enforcer = utils.get_managed_object(data.client, "enforcer", "enforcer", data.id_or_name)
    if not enforcer:
        return

    conf = {}

    s = set()
    for c in category:
        if c == 'all':
            s |= set(['error', 'cpath', 'conn', 'packet', 'ctrl', 'session', 'timer', 'tcp', 'parser', 'log', 'ddos',
                      'cluster', 'policy', 'dlp', 'monitor'])
        else:
            s.add(c)
    # Can't use list(s) because we overwrite list with our own function
    l = []
    for c in s:
        l.append(c)
    conf["debug"] = l

    data.client.config("enforcer", enforcer["id"], {"config": conf})


@set_enforcer.command("protect")
@click.option("--disable", default='false', type=click.Choice(['true', 'false']), help="set protect mode")
@click.pass_obj
def set_enforcer_protect(data, disable):
    """Set enforcer protect option."""
    enforcer = utils.get_managed_object(data.client, "enforcer", "enforcer", data.id_or_name)
    if not enforcer:
        return

    conf = {}
    conf["disable_nvprotect"] = False
    state = "enabled"
    if disable == 'true':
        conf["disable_nvprotect"] = True
        state = "disabled"

    click.echo("Set [%s] Protect mode .... : %s" % (enforcer["id"], state))
    data.client.config("enforcer", enforcer["id"], {"config": conf})


@set_enforcer.command("kvcctl")
@click.option("--disable", default='false', type=click.Choice(['true', 'false']), help="disable kv congestion control")
@click.pass_obj
def set_enforcer_kvcctl(data, disable):
    """Disable enforcer kv congestion control option."""
    enforcer = utils.get_managed_object(data.client, "enforcer", "enforcer", data.id_or_name)
    if not enforcer:
        return

    conf = {}
    conf["disable_kvcctl"] = False
    state = "enabled"
    if disable == 'true':
        conf["disable_kvcctl"] = True
        state = "disabled"

    click.echo("Set [%s] kv congestion control .... : %s" % (enforcer["id"], state))
    data.client.config("enforcer", enforcer["id"], {"config": conf})


# -- Request

@request.group('enforcer')
@click.argument("id_or_name")
@click.pass_obj
def request_enforcer(data, id_or_name):
    """Request enforcer """
    data.id_or_name = id_or_name


@request_enforcer.command("profile")
@click.option('--category', '-c', multiple=True, type=click.Choice(['all', 'cpu', 'memory']))
@click.option("--duration", '-d', default=10, type=click.IntRange(1, 60, clamp=True), help="profiling duration")
@click.pass_obj
def request_enforcer_profile(data, category, duration):
    """Profiling enforcer performance."""
    enforcer = utils.get_managed_object(data.client, "enforcer", "enforcer", data.id_or_name)
    if not enforcer:
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

    data.client.request("enforcer", "%s/profiling" % enforcer["id"], None, {"profiling": prof})


@request_enforcer.command('logs')
@click.option('--filename', '-f', type=click.Path(dir_okay=False, writable=True, resolve_path=True))
@click.option("--dir", default='end', type=click.Choice(['start', 'end']))
@click.option("--size", '-s', default=20, type=click.IntRange(0), help="size (in MB) of the logs, default=20MB")
@click.pass_obj
def request_enforcer_logs(data, filename, dir, size):
    """Request enforcer logs"""
    filter = {}

    enf = utils.get_managed_object(data.client, "enforcer", "enforcer", data.id_or_name)
    if enf:
        path = "enforcer/%s/logs" % enf["id"]
        device_id = enf["id"]
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
