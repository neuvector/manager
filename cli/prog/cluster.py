import click

from prog.cli import cli
from prog.cli import create
from prog.cli import delete
from prog.cli import request
from prog.cli import set
from prog.cli import unset
from prog.cli import show
from prog import client
from prog import output
from prog import utils


@show.group("cluster", invoke_without_command=True)
@click.pass_obj
@click.pass_context
def show_cluster(ctx, data):
    """Show clusters."""
    if ctx.invoked_subcommand is not None:
        return

    clusters = data.client.list("experimental/cluster", "cluster")
    if clusters is None:
        return

    columns = ("name", "api_server", "api_port", "username")
    output.list(columns, clusters)


@show_cluster.command()
@click.argument("id_or_name")
@click.pass_obj
def detail(data, id_or_name):
    """Show cluster detail."""
    cluster = data.client.show("experimental/cluster", "cluster", id_or_name)
    if not cluster:
        return

    columns = ("name", "api_server", "api_port", "username")
    output.show(columns, cluster)


@create.command("cluster")
@click.argument('name')
@click.argument('server')
@click.argument('port', type=int)
@click.argument('username')
@click.pass_obj
def create_cluster(data, name, server, port, username):
    """Create cluster."""
    pass1 = click.prompt("User Password", hide_input=True)
    pass2 = click.prompt("Confirm User Password", hide_input=True)
    if pass1 != pass2:
        click.echo("Passwords do not match")
        return

    cfg = {"name": name, "api_server": server, "api_port": port,
           "username": username, "password": pass1}

    data.client.create("experimental/cluster", {"config": cfg})


@set.command("cluster")
@click.argument('name')
@click.option('--server', help="Set API server.")
@click.option('--port', type=int, help="Set API server port.")
@click.option('-u', '--username', help="Set username.")
@click.option("-p", "--password", is_flag=True, help="Set password.")
@click.pass_obj
def set_cluster(data, name, server, port, username, password):
    """Set cluster configuration."""
    cfg = {"name": name}
    doit = False
    if server is not None:
        doit = True
        cfg["api_server"] = server
    if port is not None:
        doit = True
        cfg["api_port"] = port
    if username is not None:
        doit = True
        cfg["username"] = username
    if password:
        pass1 = click.prompt("Password", hide_input=True)
        pass2 = click.prompt("Confirm Password", hide_input=True)
        if pass1 != pass2:
            click.echo("Passwords do not match")
            return
        cfg["password"] = pass1
        doit = True

    if doit:
        data.client.config("experimental/cluster", name, {"config": cfg})
    else:
        click.echo("Please specify configurations to be set.")


@delete.command("cluster")
@click.argument('name')
@click.pass_obj
def delete_cluster(data, name):
    """Delete cluster."""
    data.client.delete("experimental/cluster", name)


@request.group('cluster')
@click.pass_obj
def request_cluster(data):
    """Request cluster"""


@request_cluster.command("test")
@click.argument('name')
@click.argument('server')
@click.argument('port', type=int)
@click.argument('username')
@click.pass_obj
def test_cluster(data, name, server, port, username):
    """test cluster."""
    pass1 = click.prompt("User Password", hide_input=True)

    cfg = {"name": name, "api_server": server, "api_port": port,
           "username": username, "password": pass1}

    data.client.request("experimental/debug", "cluster", "test", {"test": cfg})
