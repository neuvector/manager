import click

from cli import set as cli_set
from cli import unset
from cli import show
from cli import delete
import client
import output
import utils

def _show_display_format(conver):
    f = "bytes"
    if f in conver:
        fo = output.key_output(f)
        conver[fo] = utils.convert_byte(conver[f], 0)

def _list_display_format(conver, src, dst, id_only):
    if src["kind"] == client.EndpointKindContainer:
        if id_only:
            conver["client"] = "%s" % src["id"][:output.SHORT_ID_LENGTH]
        else:
            conver["client"] = "%s - %s" % (src["id"][:output.SHORT_ID_LENGTH], src["display_name"])
    else:
        conver["client"] = src["id"]

    if dst["kind"] == client.EndpointKindContainer:
        if id_only:
            conver["server"] = "%s" % dst["id"][:output.SHORT_ID_LENGTH]
        else:
            conver["server"] = "%s - %s" % (dst["id"][:output.SHORT_ID_LENGTH], dst["display_name"])
    else:
        conver["server"] = dst["id"]

    f = "applications"
    if f in conver:
        conver[output.key_output(f)] = ",".join(conver[f])
    else:
        conver[output.key_output(f)] = ""
    f = "ports"
    if f in conver:
        conver[output.key_output(f)] = ",".join(conver[f])
    else:
        conver[output.key_output(f)] = ""

    _show_display_format(conver)

@show.group("conversation", invoke_without_command=True)
@click.option("-g", "--group", default=None, help="filter conversations by group")
@click.option("-d", "--domain", default=None, help="filter conversations by domain")
@click.option('-v', '--verbose', is_flag=True, default=False, help="verbose output")
@click.option('--id_only', is_flag=True, default=False, help="only display workload id")
@click.option("--page", default=40, type=click.IntRange(1), help="list page size, default=40")
@click.pass_obj
@click.pass_context
def show_conver(ctx, data, group, domain, verbose, id_only, page):
    """Show conversations."""
    if ctx.invoked_subcommand is not None:
        return

    args = {"verbose": verbose}
    if group:
        args["group"] = group
    if domain:
        args["domain"] = domain


    data = data.client.show("conversation", "", None, **args)
    if data == None:
        return

    eps = {}
    if "endpoints" in data:
        for ep in data["endpoints"]:
            eps[ep["id"]] = ep

    convers = data["conversations"]
    fromid = ""
    toid = ""
    for c in convers:
        if verbose:
            fromid = c["from"]["id"]
            toid = c["to"]["id"]
        else:
            fromid = c["from"] 
            toid = c["to"]

        if fromid in eps and toid in eps:
            _list_display_format(c, eps[fromid], eps[toid], id_only)
        elif fromid not in eps and eps[toid]["service_mesh"] == True:
            cep =   {
                    "kind": client.EndpointKindContainer,
                    "id": fromid,
                    "display_name": "sidecar-proxy",
                    }
            _list_display_format(c, cep, eps[toid], id_only)
        elif toid not in eps and eps[fromid]["service_mesh"] == True:
            sep =   {
                    "kind": client.EndpointKindContainer,
                    "id": toid,
                    "display_name": "sidecar-proxy",
                    }
            _list_display_format(c, eps[fromid], sep, id_only)
        else:
            _list_display_format(c, eps[fromid], eps[toid], id_only)

    start = 0
    size = len(convers)
    while True:
        if start + page > size: 
            end = size
        else:
            end = start + page

        columns = ("client", "server", "policy_action", "severity", "bytes", "sessions", "applications", "ports", "xff_entry")
        output.list(columns, convers[start:end])

        start = end 
        if start >= size:
            break

        click.echo("Press <esc> to exit, press other key to continue ...")
        c = utils.keypress()
        if ord(c) == 27:
            break

@show_conver.command()
@click.argument("client")
@click.argument("server")
@click.pass_obj
def pair(data, client, server):
    """Show conversation detail between a pair of containers."""
    c = utils.get_managed_object_id(data.client, "workload", "workload", client)
    if not c:
        c = client
    s = utils.get_managed_object_id(data.client, "workload", "workload", server)
    if not s:
        s = server
    conver = data.client.show("conversation/%s" % c, "conversation", s)

    for e in conver["entries"]:
        _show_display_format(e)

    columns = ("port", "mapped_port", "application", "policy_action", "policy_id", "severity",
               "bytes", "sessions", "last_seen_at", "client_ip", "server_ip", "xff", "to_sidecar")
    output.list(columns, conver["entries"])

@show_conver.command()
@click.option('-v', '--view', type=click.Choice(['', 'pod']), default='', help="specify view")
@click.option("-g", "--group", default=None, help="filter endpoints by group")
@click.option("--page", default=40, type=click.IntRange(1), help="list page size, default=40")
@click.pass_obj
def endpoint(data, view, group, page):
    """Show conversation endpoints."""
    args = {"start": 0, "limit": page}
    if view:
        args['view'] = view
    if group:
        args["service_group"] = group

    while True:
        eps = data.client.list("conversation_endpoint", "endpoint", **args)
        if eps == None:
            break

        columns = ["id", "display_name", "kind", "state"]
        output.list(columns, eps)

        if args["limit"] > 0 and len(eps) < args["limit"]:
            break

        click.echo("Press <esc> to exit, press other key to continue ...")
        c = utils.keypress()
        if ord(c) == 27:
            break

        args["start"] += page

@delete.group("conversation", invoke_without_command=True)
@click.pass_obj
@click.pass_context
def delete_conver(ctx, data):
    """Delete all conversations."""
    if ctx.invoked_subcommand is not None:
        return

    data.client.delete("conversation", None)

@delete_conver.command()
@click.argument("client")
@click.argument("server")
@click.pass_obj
def pair(data, client, server):
    """Delete conversations between a pair of containers."""
    c = utils.get_managed_object_id(data.client, "workload", "workload", client)
    if not c:
        c = client
    s = utils.get_managed_object_id(data.client, "workload", "workload", server)
    if not s:
        s = server
    conver = data.client.delete("conversation/%s/%s" % (c, s), None)

@delete_conver.command()
@click.argument("endpoint")
@click.pass_obj
@click.pass_context
def endpoint(ctx, data, endpoint):
    """Delete an endpoint."""
    data.client.delete("conversation_endpoint", endpoint)

@cli_set.group("conversation")
@click.pass_obj
def set_conver(data):
    """Set conversation configuration."""

@set_conver.command("endpoint")
@click.argument("endpoint")
@click.option('--alias', help="Set endpoint alias.")
@click.pass_obj
def set_endpoint(data, endpoint, alias):
    """Set an endpoint configuration."""
    ep = {"id": endpoint}
    if alias != None:
        ep["display_name"] = alias

    data.client.config("conversation_endpoint", endpoint, {"config": ep})

@unset.group("conversation")
@click.pass_obj
def unset_conver(data):
    """Unset conversation configuration."""

@unset_conver.command("endpoint")
@click.argument("endpoint")
@click.option('--alias', is_flag=True, help="Unset endpoint alias.")
@click.pass_obj
def unset_endpoint(data, endpoint, alias):
    """Unset an endpoint configuration."""
    ep = {"id": endpoint}
    if alias:
        ep["display_name"] = ""

    data.client.config("conversation_endpoint", endpoint, {"config": ep})
