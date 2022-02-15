import click
import io

from prog.cli import delete
from prog.cli import show
from prog.cli import request
from prog import client
from prog import multipart
from prog import output
from prog import utils

MAX_PAGE_SIZE = 256


# --- sessions

def _output_one_session(s):
    click.echo("ID=%d ether=0x%04x protocol=%d age=%d idle=%d life=%d container=%s %s %s %s" %
               (s["id"], s["ether_type"], s["ip_proto"], s["age"], s["idle"], s["life"],
                s["workload_id"][:output.SHORT_ID_LENGTH],
                "ingress" if s.get("ingress") else "egress",
                "tap" if s.get("tap") else "",
                "mid-stream" if s.get("mid_stream") else ""))
    click.echo("  eth: %s -> %s" % (s["client_mac"], s["server_mac"]))
    if s["ip_proto"] == 1 or s["ip_proto"] == 58:  # ICMP or ICMPv6
        click.echo("  addr: %s -> %s type=%d code=%d" %
                   (s["client_ip"], s["server_ip"], s["icmp_type"], s["icmp_code"]))
    else:
        click.echo("  addr: %s:%d -> %s:%d" %
                   (s["client_ip"], s["client_port"], s["server_ip"], s["server_port"]))
    if s["ip_proto"] == 6:  # TCP
        click.echo("  len: %d:%d (%s) -> %d:%d (%s) application=%s" %
                   (s["client_pkts"], s["client_bytes"], s["client_state"],
                    s["server_pkts"], s["server_bytes"], s["server_state"], s["application"]))
        click.echo("  asm: %d:%d -> %d:%d" %
                   (s["client_asm_pkts"], s["client_asm_bytes"],
                    s["server_asm_pkts"], s["server_asm_bytes"]))
    else:
        click.echo("  len:  %d:%d -> %d:%d application=%s" %
                   (s["client_pkts"], s["client_bytes"], s["server_pkts"], s["server_bytes"],
                    s["application"]))
    click.echo("  policy: ID=%d action=%s" %
               (s["policy_id"], s["policy_action"]))
    click.echo("  xff ip: %s port: %d application: %s" %
               (s["xff_ip"], s["xff_port"], s["xff_app"]))


@show.group()
@click.pass_obj
def session(data):
    """Show sessions."""


@session.command()
@click.option("-e", "--enforcer", default=None, help="filter sessions by enforcer")
@click.option("-c", "--container", default=None, help="filter sessions by container")
@click.option("--id", default=None, help="filter sessions by session id")
@click.option("--page", default=20, type=click.IntRange(1, MAX_PAGE_SIZE, clamp=True),
              help="list page size [1, %s], default=20" % MAX_PAGE_SIZE)
@click.pass_obj
def list(data, enforcer, container, id, page):
    """list session."""
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
        if id:
            filter["id"] = id
            page = 0

        filter["start"] = 0
        filter["limit"] = page
        while True:
            sessions = data.client.list("session", "session", **filter)
            # Specifically check 'None', instead of 'not sessions'
            if sessions == None:
                break

            for s in sessions:
                _output_one_session(s)

            if filter["limit"] > 0 and len(sessions) < filter["limit"]:
                break
            if id:
                break

            click.echo("Press <esc> to exit, press other key to continue ...")
            c = utils.keypress()
            if ord(c) == 27:
                break

            filter["start"] += page

    except client.NotEnoughFilter:
        click.echo("Error: 'enforcer' or 'container' filter must be specified.")


@session.command()
@click.option("-e", "--enforcer", default=None, help="filter sessions by enforcer")
@click.pass_obj
def summary(data, enforcer):
    """show session summary."""
    try:
        filter = {}
        if enforcer:
            obj = utils.get_managed_object(data.client, "enforcer", "enforcer", enforcer)
            if obj:
                filter["enforcer"] = obj["id"]

        summary = data.client.show("session", "summary", "summary", **filter)

        column_map = (("cur_sessions", "Sessions"),
                      ("cur_tcp_sessions", "TCP Sessions"),
                      ("cur_udp_sessions", "UDP Sessions"),
                      ("cur_icmp_sessions", "ICMP Sessions"),
                      ("cur_ip_sessions", "IP Sessions"))
        output.show_with_map(column_map, summary)
    except client.NotEnoughFilter:
        click.echo("Error: 'enforcer' filter must be specified.")


@delete.command("session")
@click.option("-e", "--enforcer", default=None, help="filter sessions by enforcer")
@click.option("--id", default=None, help="filter sessions by session id")
@click.pass_obj
def delete_session(data, enforcer, id):
    """clear session."""
    try:
        filter = {}
        if enforcer:
            obj = utils.get_managed_object(data.client, "enforcer", "enforcer", enforcer)
            if obj:
                filter["enforcer"] = obj["id"]
        if id:
            filter["id"] = id

        data.client.delete("session", None, **filter)

    except client.NotEnoughFilter:
        click.echo("Error: 'enforcer' filter must be specified.")


# --- meters

def _output_one_meter(s):
    if s["span"] == 1:
        click.echo("type=%s container=%s peer=%s count=%d pps=%d idle=%d %s" %
                   (s["type"], s["workload_id"][:output.SHORT_ID_LENGTH],
                    s["peer_ip"], s["cur_count"], s["span_count"], s["idle"],
                    "tap" if s["tap"] else ""))
    else:
        click.echo("type=%s container=%s peer=%s count=%d rate=%d/%ds idle=%d %s" %
                   (s["type"], s["workload_id"][:output.SHORT_ID_LENGTH],
                    s["peer_ip"], s["cur_count"], s["span_count"], s["span"], s["idle"],
                    "tap" if s["tap"] else ""))


@show.group(invoke_without_command=True)
@click.option("-e", "--enforcer", default=None, help="filter meters by enforcer")
@click.option("-c", "--container", default=None, help="filter meters by container")
@click.option("--page", default=20, type=click.IntRange(1, MAX_PAGE_SIZE, clamp=True),
              help="list page size [1, %s], default=20" % MAX_PAGE_SIZE)
@click.pass_obj
@click.pass_context
def meter(ctx, data, enforcer, container, page):
    """Show meter."""
    if ctx.invoked_subcommand is not None:
        return

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

        filter["start"] = 0
        filter["limit"] = page
        while True:
            meters = data.client.list("meter", "meter", **filter)
            # Specifically check 'None', instead of 'not meters'
            if meters == None:
                break

            for m in meters:
                _output_one_meter(m)

            if filter["limit"] > 0 and len(meters) < filter["limit"]:
                break
            if id:
                break

            click.echo("Press <esc> to exit, press other key to continue ...")
            c = utils.keypress()
            if ord(c) == 27:
                break

            filter["start"] += page

    except client.NotEnoughFilter:
        click.echo("Error: 'enforcer' or 'container' filter must be specified.")


# --- sniffers

def _list_sniffer_format(wl):
    f = "enforcer_id"
    if wl.get(f):
        wl[f] = wl[f][:output.SHORT_ID_LENGTH]
    f = "container_id"
    if wl.get(f):
        wl[f] = wl[f][:output.SHORT_ID_LENGTH]


@request.group('sniffer')
@click.pass_obj
def request_sniffer(data):
    """Sniffer"""


@request_sniffer.command("start")
@click.argument("id_or_name")
@click.option("-f", "--file_count", type=int, default=0, help="Maximum number of rotation files")
@click.option("-d", "--duration", type=int, default=0, help="Packet capture duration")
@click.option("-o", "--options", default=None, help="Packet capture filter")
@click.pass_obj
def start_sniffer(data, id_or_name, file_count, duration, options):
    """Start sniffer."""
    filter = {}
    info = {}
    obj = utils.get_managed_object(data.client, "workload", "workload", id_or_name)
    if obj:
        filter["workload"] = obj["id"]
    else:
        return

    if file_count:
        info["file_number"] = file_count
    if duration:
        info["duration"] = duration
    if options:
        info["filter"] = options

    data.client.create("sniffer", {"sniffer": info}, **filter)


@request_sniffer.command("stop")
@click.argument("id")
@click.pass_obj
def stop_sniffer(data, id):
    """Stop sniffer."""
    filter = {}
    data.client.config("sniffer/stop", id, None, **filter)


@request_sniffer.command("remove")
@click.argument("id")
@click.pass_obj
def remove_sniffer(data, id):
    """Remove sniffer."""
    filter = {}
    data.client.delete("sniffer", id, **filter)


def _write_part(part, filename):
    if filename and len(filename) > 0:
        try:
            with click.open_file(filename, 'w') as wfp:
                wfp.write(part.raw)
            click.echo("Wrote %s to %s" % (part.name, click.format_filename(filename)))
        except IOError:
            click.echo("Error: Failed to write %s to %s" % (part.name, click.format_filename(filename)))
    else:
        try:
            with click.open_file(part.filename, 'w') as wfp:
                wfp.write(part.raw)
            click.echo("Wrote to %s" % part.filename)
        except IOError:
            click.echo("Error: Failed to get file from part")


@request_sniffer.command("pcap")
@click.option('--filename', '-f', type=click.Path(dir_okay=False, writable=True, resolve_path=True))
@click.option("--limit", '-l', default=100, type=click.IntRange(1), help="limit the pcap size, default=20MB")
@click.argument("id")
@click.pass_obj
def pcap(data, filename, limit, id):
    """Download sniffer."""
    path = "sniffer/%s/pcap" % id
    if limit:
        path += "?limit=%d" % (limit * 1024 * 1024)
    headers, body = data.client.download(path)

    click.echo("read end")
    kwargs = {'strict': True}
    clen = int(headers.get('Content-Length', '-1'))
    ctype, options = multipart.parse_options_header(headers.get("Content-Type"))
    boundary = options.get('boundary', '')
    if ctype != 'multipart/form-data' or not boundary:
        click.echo("Unsupported content type.")
        return

    try:
        for part in multipart.MultipartParser(io.BytesIO(body.content), boundary, clen):
            if part.name == "pcap" and part.content_type == "application/cap":
                click.echo("write %d" % len(part.raw))
                _write_part(part, filename)
                return

        click.echo("Unable to export configurations.")
    except Exception as e:
        click.echo(e)


@show.group('sniffer', invoke_without_command=True)
@click.option("-e", "--enforcer", default=None, help="Show sniffers by enforcer")
@click.option("-c", "--container", default=None, help="Show sniffers by container")
@click.pass_obj
@click.pass_context
def show_sniffer(ctx, data, enforcer, container):
    """Show sniffer."""
    if ctx.invoked_subcommand is not None:
        return

    filter = {}
    if enforcer:
        obj = utils.get_managed_object(data.client, "enforcer", "enforcer", enforcer)
        if obj:
            filter["enforcer"] = obj["id"]

    if container:
        obj = utils.get_managed_object(data.client, "workload", "workload", container)
        if obj:
            filter["workload"] = obj["id"]

    sniffers = data.client.list("sniffer", "sniffer", **filter)
    for s in sniffers:
        _list_sniffer_format(s)

    click.echo("Total sniffers: %s" % len(sniffers))
    column = ("id", "status", "enforcer_id", "container_id", "size", "file_number")
    output.list(column, sniffers)


@show_sniffer.command()
@click.argument("id_or_name")
@click.pass_obj
def detail(data, id_or_name):
    """Show sniffer detail."""
    sniffer = data.client.show("sniffer", "sniffer", id_or_name)

    column = ("id", "enforcer_id", "container_id", "size", "file_number", "status", "args")
    output.show(column, sniffer)
