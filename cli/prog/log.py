import base64
import click

from prog.cli import show
from prog import client
from prog import output
from prog import utils


@show.group()
@click.pass_obj
def log(data):
    """Show logs."""


@log.command()
@click.option("--page", default=20, type=click.IntRange(1), help="list page size, default=20")
@click.pass_obj
def activity(data, page):
    """List activities."""
    filter = {"start": 0, "limit": page}

    while True:
        logs = data.client.list("log/activity", "event", **filter)
        if logs == None:
            break

        columns = ("reported_at", "name", "level", "category", "host_name", "workload_name", "user")
        output.list(columns, logs)

        if filter["limit"] > 0 and len(logs) < filter["limit"]:
            break

        click.echo("Press <esc> to exit, press other key to continue ...")
        c = utils.keypress()
        if ord(c) == 27:
            break

        filter["start"] += page


@log.command()
@click.option("--page", default=20, type=click.IntRange(1), help="list page size, default=20")
@click.pass_obj
def event(data, page):
    """List events."""
    filter = {"start": 0, "limit": page}

    while True:
        logs = data.client.list("log/event", "event", **filter)
        if logs == None:
            break

        columns = ("reported_at", "name", "level", "category", "host_name", "workload_name", "user")
        output.list(columns, logs)

        if filter["limit"] > 0 and len(logs) < filter["limit"]:
            break

        click.echo("Press <esc> to exit, press other key to continue ...")
        c = utils.keypress()
        if ord(c) == 27:
            break

        filter["start"] += page


def _list_audit_display_format(audit):
    f = "items"
    fo = output.key_output(f)
    if f in audit:
        s = ""
        for item in audit[f]:
            s += "%s\n" % item
        audit[fo] = s.rstrip("\n")
    else:
        audit[fo] = ""


@log.command()
@click.option("--page", default=20, type=click.IntRange(1), help="list page size, default=20")
@click.pass_obj
def audit(data, page):
    """List audit logs."""
    filter = {"start": 0, "limit": page}

    while True:
        logs = data.client.list("log/audit", "audit", **filter)
        if logs is None:
            break

        for log in logs:
            _list_audit_display_format(log)

        columns = ("reported_at", "name", "level", "workload_name", "high_vul_cnt", "medium_vul_cnt", "items")
        output.list(columns, logs)

        if filter["limit"] > 0 and len(logs) < filter["limit"]:
            break

        click.echo("Press <esc> to exit, press other key to continue ...")
        c = utils.keypress()
        if ord(c) == 27:
            break

        filter["start"] += page


@log.group('threat', invoke_without_command=True)
@click.option("--page", default=20, type=click.IntRange(1), help="list page size, default=20")
@click.pass_obj
@click.pass_context
def threat(ctx, data, page):
    """List threats."""
    if ctx.invoked_subcommand is not None:
        return

    filter = {"start": 0, "limit": page}

    while True:
        logs = data.client.list("log/threat", "threat", **filter)
        if logs == None:
            break

        for log in logs:
            f = "id"
            if log.get(f):
                fo = output.key_output(f)
                log[fo] = log[f][:output.SHORT_ID_LENGTH]
            log["connection"] = "%s:%d -> %s:%d" % (log["client_workload_name"], log["client_port"],
                                                    log["server_workload_name"], log["server_port"])

        column_map = (("id", "id"),
                      ("reported_at", "reported_at"),
                      ("name", "name"),
                      ("severity", "severity"),
                      ("action", "action"),
                      ("connection", "connection"),
                      ("target", "target"),
                      ("count", "count"),
                      ("message", "message"))
        output.list_with_map(column_map, logs)

        if filter["limit"] > 0 and len(logs) < filter["limit"]:
            break

        click.echo("Press <esc> to exit, press other key to continue ...")
        c = utils.keypress()
        if ord(c) == 27:
            break

        filter["start"] += page


@threat.command("detail")
@click.argument("id")
@click.pass_obj
def threat_detail(data, id):
    """Show threat detail."""
    log = utils.get_managed_object(data.client, "log/threat", "threat", id)
    if not log:
        return

    column_map = (("id", "id"),
                  ("reported_at", "reported_at"),
                  ("name", "name"),
                  ("severity", "severity"),
                  ("action", "action"),
                  ("client_workload_name", "client"),
                  ("server_workload_name", "server"),
                  ("ip_proto", "ip protocol"),
                  ("client_ip", "client_ip"),
                  ("server_ip", "server_ip"),
                  ("client_port", "client_port"),
                  ("server_port", "server_port"),
                  ("target", "target"),
                  ("count", "count"),
                  ("message", "message"))

    output.show_with_map(column_map, log)

    if log.get("packet"):
        try:
            pkt = base64.b64decode(log["packet"])
            click.echo("\nPacket Dump:")
            output.hexdump(pkt)
        except TypeError:
            pass


def _list_display_format(log):
    f = "client_name"
    if f in log:
        log["client"] = log[f]

    f = "server_name"
    if f in log:
        log["server"] = log[f]

    f = "server_port"
    if f in log and "ip_proto" in log:
        fo = output.key_output(f)
        if log["ip_proto"] == 6:
            log[fo] = "tcp/%d" % log[f]
        elif log["ip_proto"] == 17:
            log[fo] = "udp/%d" % log[f]
        else:
            ipproto = "ip%d" % log["ip_proto"]

    f = "applications"
    if f in log:
        fo = output.key_output(f)
        log[fo] = ",".join(log[f])

    f = "bytes"
    if f in log:
        fo = output.key_output(f)
        log[fo] = utils.convert_byte(log[f], 0)

    f = "id"
    if f not in log:
        log[f] = ""


@log.group(invoke_without_command=True)
@click.option("--page", default=20, type=click.IntRange(1), help="list page size, default=20")
@click.option("-c", "--client", default=None, help="filter violation by client container")
@click.option("-s", "--server", default=None, help="filter violation by server container")
@click.pass_obj
@click.pass_context
def violation(ctx, data, client, server, page):
    """List policy violations."""

    if ctx.invoked_subcommand is not None:
        return
    filter = {"start": 0, "limit": page}
    if client:
        obj = utils.get_managed_object(data.client, "workload", "workload", client)
        if obj:
            filter["client_id"] = obj["id"]
        else:
            filter["client_id"] = client
    if server:
        obj = utils.get_managed_object(data.client, "workload", "workload", server)
        if obj:
            filter["server_id"] = obj["id"]
        else:
            filter["server_id"] = server

    while True:
        logs = data.client.list("log/violation", "violation", **filter)
        if logs == None:
            break

        for log in logs:
            _list_display_format(log)

        columns = (
        "reported_at", "id", "client", "server", "server_port", "applications", "policy_action", "bytes", "client_ip",
        "server_ip", "sessions", "xff")
        output.list(columns, logs)

        if filter["limit"] > 0 and len(logs) < filter["limit"]:
            break

        click.echo("Press <esc> to exit, press other key to continue ...")
        c = utils.keypress()
        if ord(c) == 27:
            break

        filter["start"] += page


def _list_violation_wl_display_format(violate):
    wl = violate["workload"]
    violate["name"] = wl["name"]


@violation.command()
@click.option('--sort', type=click.Choice(['client', 'server']), default='client', help="sort field, default is client")
@click.option('--sort_dir', type=click.Choice(['asc', 'desc']), default='desc')
@click.option("--first", default=0, help="list the first n clients, default is list all")
@click.pass_obj
def workload(data, sort, sort_dir, first):
    """List policy violation statistics by client."""

    filter = {"start": 0, "limit": first}
    status = data.client.list("log/violation/workload", "violation_workload", sort, sort_dir, **filter)
    if not status:
        return

    for v in status:
        _list_violation_wl_display_format(v)
    column_map = (("name", "Name"),
                  ("count", "Violation Count"))
    output.list_with_map(column_map, status)


@log.command()
@click.option("--page", default=20, type=click.IntRange(1), help="list page size, default=20")
@click.pass_obj
def incident(data, page):
    """List incidents."""
    filter = {"start": 0, "limit": page}

    while True:
        logs = data.client.list("log/incident", "incident", **filter)
        if logs == None:
            break

        local = "workload_name";
        remote = "remote_workload_name";
        ingress = "conn_ingress"
        for log in logs:
            if log.get(local) and log.get(remote) and log[local] and log[remote]:
                if log.get(ingress):
                    log["connection"] = "%s:%d -> %s:%d" % (log[remote], log["client_port"],
                                                            log[local], log["server_port"])
                else:
                    log["connection"] = "%s:%d -> %s:%d" % (log[local], log["client_port"],
                                                            log[remote], log["server_port"])
            else:
                log["connection"] = ""

            f = "rule_id"
            if f not in log:
                log[f] = ""

            f = "id"
            if f not in log:
                log[f] = ""

        column_map = (("reported_at", "time"),
                      ("id", "id"),
                      ("name", "name"),
                      ("level", "level"),
                      ("host_name", "host"),
                      ("workload_name", "container"),
                      ("proc_name", "proc"),
                      ("proc_path", "path"),
                      ("file_path", "file"),
                      ("proc_effective_user", "user"),
                      ("proc_real_uid", "uid"),
                      ("connection", "connection"),
                      ("rule_id", "ruleId"),
                      ("message", "message"))
        output.list_with_map(column_map, logs)

        if filter["limit"] > 0 and len(logs) < filter["limit"]:
            break

        click.echo("Press <esc> to exit, press other key to continue ...")
        c = utils.keypress()
        if ord(c) == 27:
            break

        filter["start"] += page
