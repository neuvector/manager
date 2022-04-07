import click

from prog.cli import create
from prog.cli import delete
from prog.cli import request
from prog.cli import set
from prog.cli import show
from prog.cli import unset
from prog import client
from prog import output
from prog import utils


@request.command("repository")
@click.option("-r", "--registry", default=None, help="Registry URL")
@click.option("-u", "--username", default=None, help="Registry Username")
@click.option("-p", "--password", is_flag=True, help="Registry Password")
@click.option("-n", "--repository", default=None, help="Repository name")
@click.option("-t", "--tag", default="latest", help="Tag")
@click.option('--scan_layers', default="enable", help="Scan image layers", type=click.Choice(['enable', 'disable']))
@click.pass_obj
def repository(data, registry, username, password, repository, tag, scan_layers):
    """Request to scan one repository"""

    info = {}
    if registry:
        info["registry"] = registry
    if username:
        info["username"] = username
    if password:
        pass1 = click.prompt("Password", hide_input=True)
        pass2 = click.prompt("Confirm Password", hide_input=True)
        if pass1 != pass2:
            click.echo("Passwords do not match")
            return
        info["password"] = pass1
    if repository:
        info["repository"] = repository
    if tag:
        info["tag"] = tag
    if scan_layers:
        if scan_layers == 'enable':
            info["scan_layers"] = True
        else:
            info["scan_layers"] = False
    while True:
        data = data.client.request("scan", "repository", None, {"request": info})
        if data != None:
            report = data["report"]
            if report["vulnerabilities"] != None:
                if len(report["vulnerabilities"]) > 0:
                    click.echo("Vulnerability Report")
                    columns = ("name", "severity", "package_name", "package_version", "fixed_version")
                    output.list(columns, report["vulnerabilities"])
                else:
                    click.echo("No Vulnerability Report")

            if report["secrets"] != None:
                if len(report["secrets"]) > 0:
                    click.echo("Secrets Report")
                    columns = ("type", "evidence", "path")
                    output.list(columns, report["secrets"])
                else:
                    click.echo("No Secrets Report")

            if report["setid_perms"] != None:
                if len(report["setid_perms"]) > 0:
                    click.echo("SetUid/SetGid Report")
                    columns = ("type", "path", "evidence")
                    output.list(columns, report["setid_perms"])
                else:
                    click.echo("No SetUid/SetGid Report")

            if report["layers"] != None:
                result = []
                for l in report["layers"]:
                    result.append({"digest": l["digest"], "vulnerabilities": len(l["vulnerabilities"])})

                columns = ("digest", "vulnerabilities")
                output.list(columns, result)
            break
