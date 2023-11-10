import click

from io import StringIO
from prog.cli import create
from prog.cli import delete
from prog.cli import show
from prog.cli import set
from prog.cli import request
from prog import client
from prog import output
from prog import utils
import time


def _list_display_format(dev):
    f = "id"
    if f in dev:
        fo = output.key_output(f)
        dev[fo] = dev[f][:output.SHORT_ID_LENGTH]


def _scanner_list_display_format(scanner):
    f = "joined_timestamp"
    if f in scanner:
        scanner[f] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(scanner[f]))


def _vuln_list_display_format(report, vuln):
    f = "scores"
    fo = output.key_output(f)
    vuln[fo] = "%s/%s" % (vuln["score"], vuln["score_v3"])
    vuln["counts"] = "%d:%d:%d:%d" % (
    len(vuln["platforms"]), len(vuln["workloads"]), len(vuln["nodes"]), len(vuln["images"]))

    vuln["protected"] = True
    for i in vuln["platforms"]:
        if i in report["platforms"]:
            for e in report["platforms"][i]:
                if e["policy_mode"] == "Discover":
                    vuln["protected"] = False
                    return
    for i in vuln["workloads"]:
        if i in report["workloads"]:
            for e in report["workloads"][i]:
                if e["policy_mode"] == "Discover":
                    vuln["protected"] = False
                    return
    for i in vuln["nodes"]:
        if i in report["nodes"]:
            for e in report["nodes"][i]:
                if e["policy_mode"] == "Discover":
                    vuln["protected"] = False
                    return
    for i in vuln["images"]:
        if i in report["images"]:
            for e in report["images"][i]:
                if e["policy_mode"] == "Discover":
                    vuln["protected"] = False
                    return


def _vuln_profile_list_display_format(e):
    f = "domains"
    if e.get(f):
        e[output.key_output(f)] = ",".join(e[f])
    else:
        e[output.key_output(f)] = ""
    f = "images"
    if e.get(f):
        e[output.key_output(f)] = ",".join(e[f])
    else:
        e[output.key_output(f)] = ""


@show.group('scan')
@click.pass_obj
def show_scan(data):
    """Show scan information."""


@show_scan.command()
@click.pass_obj
def config(data):
    """Show scan config"""
    cfg = data.client.show("scan", "config", "config")
    column_map = (("auto_scan", "auto"),)
    if cfg["auto_scan"] == True:
        cfg["auto_scan"] = "enable"
    else:
        cfg["auto_scan"] = "disable"
    output.show_with_map(column_map, cfg)


@show_scan.command()
@click.pass_obj
def scanner(data):
    """Show scanners"""
    scanners = data.client.list("scan/scanner", "scanner")
    for s in scanners:
        _scanner_list_display_format(s)

    columns = (("id", "id"),
               ("cvedb_version", "cvedb_version"),
               ("server", "server"),
               ("port", "port"),
               ("joined_timestamp", "joined_timestamp"),
               ("scanned_containers", "containers"),
               ("scanned_hosts", "nodes"),
               ("scanned_images", "images"),
               ("scanned_serverless", "serverless"))
    output.list_with_map(columns, scanners)


@show_scan.command()
@click.pass_obj
def status(data):
    """Show scan status"""
    status = data.client.show("scan", "status", "status")
    """columns = ("Scanned", "Scanning", "Scheduled")"""
    """output.list(columns, status)"""
    column_map = (("scanned", "Scanned"),
                  ("scanning", "Scanning"),
                  ("scheduled", "Scheduled"),
                  ("cvedb_version", "CVE-DB version"),
                  ("cvedb_create_time", "CVE-DB created at"))
    output.show_with_map(column_map, status)


@show_scan.group()
@click.pass_obj
def summary(data):
    """Show scan summary"""


@summary.command()
@click.option("--page", default=40, type=click.IntRange(1), help="list page size, default=40")
@click.option('--sort', default=None, help="sort field.")
@click.option('--sort_dir', type=click.Choice(['asc', 'desc']), default='asc',
              help="sort direction.")
@click.pass_obj
def image(data, page, sort, sort_dir):
    """Show scan image summary"""
    args = {"start": 0, "limit": page}

    while True:
        images = data.client.list("scan/image", "image", **args)
        if images == None:
            break

        for img in images:
            _list_display_format(img)

        columns = ("image", "status", "result", "high", "medium", "base_os")
        output.list(columns, images)

        if args["limit"] > 0 and len(images) < args["limit"]:
            break

        click.echo("Press <esc> to exit, press other key to continue ...")
        c = utils.keypress()
        if ord(c) == 27:
            break

        args["start"] += page


@summary.command()
@click.pass_obj
def platform(data):
    """Show scan platform summary"""
    platforms = data.client.list("scan/platform", "platform", None)
    if platforms == None:
        return

    for n in platforms:
        _list_display_format(n)

    columns = ("id", "status", "result", "scanned_at", "high", "medium")
    output.list(columns, platforms)


@show_scan.group()
@click.pass_obj
def report(data):
    """Show scan report"""


@report.command()
@click.argument("id_or_name")
@click.pass_obj
def container(data, id_or_name):
    """Show scan container detail report"""

    obj = utils.get_managed_object(data.client, "workload", "workload", id_or_name)
    if obj == None:
        return

    report = data.client.show("scan/workload", "report", obj["id"])
    if report != None:
        if report["vulnerabilities"] != None:
            columns = ("name", "severity", "package_name", "package_version", "fixed_version")
            output.list(columns, report["vulnerabilities"])


@report.command()
@click.argument("name")
@click.pass_obj
def image(data, name):
    """Show scan image detail report"""

    report = data.client.show("scan/image", "report", name)
    if report != None:
        if report["vulnerabilities"] != None:
            columns = ("name", "severity", "package_name", "package_version", "fixed_version")
            output.list(columns, report["vulnerabilities"])


@report.command()
@click.argument("id_or_name")
@click.pass_obj
def node(data, id_or_name):
    """Show scan node detail report"""

    obj = utils.get_managed_object(data.client, "host", "host", id_or_name)
    if obj == None:
        return

    report = data.client.show("scan/host", "report", obj["id"])
    if report != None:
        if report["vulnerabilities"] != None:
            columns = ("name", "severity", "package_name", "package_version", "fixed_version")
            output.list(columns, report["vulnerabilities"])


@report.command()
@click.pass_obj
def platform(data):
    """Show scan platform detail report"""

    report = data.client.show("scan/platform", "report", "platform")
    if report != None:
        if report["vulnerabilities"] != None:
            columns = ("name", "severity", "package_name", "package_version", "fixed_version")
            output.list(columns, report["vulnerabilities"])


@report.command()
@click.pass_obj
def all(data):
    """Show vulnerability report of all assets"""

    report = data.client.show("scan/asset", None, None)
    if "vulnerabilities" in report:
        for v in report["vulnerabilities"]:
            _vuln_list_display_format(report, v)

        columns = ("name", "severity", "scores", "counts", "protected")
        output.list(columns, report["vulnerabilities"])


@show_scan.command("profile")
@click.argument("name")
@click.pass_obj
def show_scan_profile(data, name):
    """Show vulnerability profile."""
    profile = data.client.show("vulnerability/profile", "profile", name)
    if not profile:
        return

    if "cfg_type" in profile and profile["cfg_type"] == "ground":
        click.echo("This profile is controlled by CRD rule")

    entries = profile["entries"]
    for e in entries:
        _vuln_profile_list_display_format(e)

    columns = ("id", "name", "domains", "images", "days")
    output.list(columns, profile["entries"])


# --

@set.group('scan')
@click.pass_obj
def set_scan(data):
    """Set scan configuration."""


@set_scan.command()
@click.argument('status', type=click.Choice(['enable', 'disable']))
@click.pass_obj
def auto(data, status):
    """Set scanner auto-scan status."""
    if status == 'enable':
        data.client.config("scan", "config", {"config": {"auto_scan": True}})
    else:
        data.client.config("scan", "config", {"config": {"auto_scan": False}})


@set_scan.group("profile")
@click.pass_obj
def set_scan_profile(data):
    """Set vulnerability profile."""


@set_scan_profile.command("entry")
@click.argument("id", type=int)
@click.argument("name")
@click.option("--comment")
@click.option("--days", type=int, help="number of days for the recent vulnerabilities")
@click.option('--images', multiple=True, help="image filters.")
@click.option('--domains', multiple=True, help="domain filters.")
@click.pass_obj
def set_scan_profile_entry(data, id, name, comment, days, images, domains):
    """Set vulnerability profile entry."""
    p = {"id": id, "name": name}
    if comment:
        p["comment"] = comment
    if days:
        p["days"] = days
    if images:
        p["images"] = images
    if domains:
        p["domains"] = domains
    data.client.config("vulnerability/profile/default/entry", id, {"config": p})

# --

@create.group('scan')
@click.pass_obj
def create_scan(data):
    """create scan configuration."""


@create_scan.group("profile")
@click.pass_obj
def create_scan_profile(data):
    """Create vulnerability profile."""


@create_scan_profile.command("entry")
@click.argument("name")
@click.option("--comment")
@click.option("--days", type=int, help="number of days for the recent vulnerabilities")
@click.option('--images', multiple=True, help="image filters.")
@click.option('--domains', multiple=True, help="domain filters.")
@click.pass_obj
def set_scan_profile_entry(data, name, comment, days, images, domains):
    """Create vulnerability profile entry."""
    p = {"name": name}
    if comment:
        p["comment"] = comment
    if days:
        p["days"] = days
    if images:
        p["images"] = images
    if domains:
        p["domains"] = domains
    data.client.create("vulnerability/profile/default/entry", {"config": p})


# --

@delete.group('scan')
@click.pass_obj
def delete_scan(data):
    """Delete scan."""


@delete_scan.group("profile")
@click.pass_obj
def delete_scan_profile(data):
    """Delete vulnerability profile."""


@delete_scan_profile.command("entry")
@click.argument("id")
@click.pass_obj
def delete_scan_profile_entry(data, id):
    """Delete vulnerability profile entry."""
    data.client.delete("vulnerability/profile/default/entry", id)


# --

@request.group('scan')
@click.pass_obj
def request_scan(data):
    """Request scan."""


@request_scan.command()
@click.argument("id_or_name")
@click.pass_obj
def container(data, id_or_name):
    """Request to scan one container"""
    obj = utils.get_managed_object(data.client, "workload", "workload", id_or_name)
    if obj == None:
        return

    data.client.request("scan", "workload", obj["id"], None)


@request_scan.command()
@click.argument("id_or_name")
@click.pass_obj
def node(data, id_or_name):
    """Request to scan one node"""
    obj = utils.get_managed_object(data.client, "host", "host", id_or_name)
    if obj == None:
        return

    data.client.request("scan", "host", obj["id"], None)


@request_scan.command()
@click.pass_obj
def platform(data):
    """Request to scan platform"""
    data.client.request("scan", "platform", "platform", None)
