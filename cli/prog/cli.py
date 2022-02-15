import os

import click

from prog import client

ENV_CTRL_SERVER_IP = "CTRL_SERVER_IP"
ENV_CTRL_SERVER_PORT = "CTRL_SERVER_PORT"


class CtxData(object):
    def __init__(self, debug, server, port):
        self.client = None
        self.username = None
        self.domain = None
        self.id_or_name = None

        if server:
            self.server_ip = server
        elif ENV_CTRL_SERVER_IP in os.environ:
            self.server_ip = os.environ.get(ENV_CTRL_SERVER_IP)
        else:
            self.server_ip = "127.0.0.1"

        if port:
            self.port = port
        elif ENV_CTRL_SERVER_PORT in os.environ:
            self.port = os.environ.get(ENV_CTRL_SERVER_PORT)
        else:
            self.port = 10443

        url = "https://%s:%s" % (self.server_ip, self.port)
        self.client = client.RestClient(url, debug)


def init_context_data(debug, server, port):
    global ctx_data

    ctx_data = CtxData(debug, server, port)
    if not ctx_data.client:
        return None
    else:
        return ctx_data


CONTEXT_SETTINGS = dict(help_option_names=['-h', '--help'])


@click.group(context_settings=CONTEXT_SETTINGS)
@click.pass_context
def cli(ctx):
    """CLI entry"""
    global ctx_data

    ctx.obj = ctx_data


@cli.group()
@click.pass_obj
def show(data):
    """Show operations"""


# @cli.group()
# @click.pass_obj
# def diag(data):
#    """Diagnose operations"""

@cli.group()
@click.pass_obj
def set(data):
    """Set operations"""


@cli.group()
@click.pass_obj
def unset(data):
    """Unset operations"""


@cli.group()
@click.pass_obj
def create(data):
    """Create operations"""


@cli.group()
@click.pass_obj
def delete(data):
    """Delete operations"""


@cli.group()
@click.pass_obj
def request(data):
    """Request operations"""
