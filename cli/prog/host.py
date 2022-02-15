import click

from prog.cli import request
from prog.cli import show
from prog import client
from prog import output
from prog import utils


def _list_display_format(host):
    f = "id"
    if f in host:
        fo = output.key_output(f)
        host[fo] = host[f][:output.SHORT_ID_LENGTH]
    f = "interfaces"
    if host.get(f):
        fo = output.key_output(f)
        s = ""
        for iface in host[f]:
            for addr in host[f][iface]:
                s += "%s:%s/%s\n" % (iface, addr["ip"], addr["ip_prefix"])
        host[fo] = s.rstrip()


@show.group("node", invoke_without_command=True)
@click.option('--sort', default=None, help="sort field.")
@click.option('--sort_dir', type=click.Choice(['asc', 'desc']), default='asc',
              help="sort direction.")
@click.option('--cluster', help="Cluster name.")
@click.pass_obj
@click.pass_context
def show_host(ctx, data, sort, sort_dir, cluster):
    """Show node."""
    if ctx.invoked_subcommand is not None:
        return

    if cluster is None:
        hosts = data.client.list("host", "host", sort=sort, sort_dir=sort_dir)
    else:
        hosts = data.client.list("experimental/cluster/%s/v1/host" % cluster, "host", sort=sort, sort_dir=sort_dir)
    for host in hosts:
        _list_display_format(host)

    click.echo("Total hosts: %s" % len(hosts))
    columns = ("id", "name", "runtime", "cpus", "memory", "containers", "interfaces")
    output.list(columns, hosts)


@show_host.command()
@click.argument("id_or_name")
@click.pass_obj
def detail(data, id_or_name):
    """Show node detail."""
    host = utils.get_managed_object(data.client, "host", "host", id_or_name)
    if not host:
        return

    columns = ("id", "name", "runtime", "runtime_version",
               "os", "kernel", "cpus", "memory", "containers")
    output.show(columns, host)


@show_host.command()
@click.argument("id_or_name")
@click.pass_obj
def ip_2_container(data, id_or_name):
    """Show node ip-continer map."""
    host = utils.get_managed_object(data.client, "host", "host", id_or_name)
    if not host:
        return

    filter = {"node": host["id"]}
    wls = data.client.list("debug/ip2workload", "ip_2_workload", **filter)

    for wl in wls:
        utils.list_format_ip2workload(wl)
    columns = ["ip", "id", "name"]
    output.list(columns, wls)


@show_host.command()
@click.argument("id_or_name")
@click.pass_obj
def profile_process(data, id_or_name):
    """Show nodes derived process profile."""
    host = utils.get_managed_object(data.client, "host", "host", id_or_name)
    if not host:
        return

    try:
        profile = data.client.show("host", "process_list", "%s/process_profile" % host["id"])
    except client.ObjectNotFound:
        return

    for p in profile:
        p["type"] = client.CfgTypeDisplay[p["cfg_type"]]

    columns = ("name", "path", "action", "type", "group")
    output.list(columns, profile)
