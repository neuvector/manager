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

_reg_types = {
    "amazon": "Amazon ECR Registry",
    "azure": "Azure Container Registry",
    "docker": "Docker Registry",
    "jfrog": "JFrog Artifactory",
    "redhat": "Red Hat Public Registry",
    "openshift": "OpenShift Registry",
    "nexus": "Sonatype Nexus",
    "gcr": "Google Container Registry",
    "gitlab": "Gitlab",
    "ibmcloud": "IBM Cloud Container Registry",
}


def _list_image_display_format(img):
    if "repository" in img and "tag" in img:
        img["image"] = "%s:%s" % (img["repository"], img["tag"])
    f = "image_id"
    if f in img:
        fo = output.key_output(f)
        if img[f].startswith("sha256:"):
            img[fo] = img[f][7:][:output.SHORT_ID_LENGTH]
        else:
            img[fo] = img[f][:output.SHORT_ID_LENGTH]


def _list_registry_display_format(config):
    f = "filters"
    if f in config:
        fo = output.key_output(f)
        config[fo] = "\n".join(config[f])
    if "cfg_type" in config:
        config["cfg_type"] = client.CfgTypeDisplay[config["cfg_type"]]

def _show_registry_report_vulns_display_format(vul):
    f = "tags"
    if f in vul:
        fo = output.key_output(f)
        vul[fo] = ",".join(vul[f])
    else:
        fo = output.key_output(f)
        vul[fo] = ""


@show.group("registry", invoke_without_command=True)
@click.option("--scope", default="all", type=click.Choice(['fed', 'local', 'all']),
              help="Show federal, local or all registries")
@click.pass_obj
@click.pass_context
def show_registry(ctx, data, scope):
    """Show registry."""
    if ctx.invoked_subcommand is not None:
        return

    args = {}
    if scope == 'fed' or scope == 'local':
        args["scope"] = scope

    #summarys = data.client.list("scan/registry", "summary")
    summarys = data.client.show("scan/registry", "summarys", None, **args)  # show(self, path, obj, obj_id, **kwargs)
    if summarys == None:
        return

    for s in summarys:
        output.lift_fields(s, "schedule", ("schedule",))
        _list_registry_display_format(s)

    columns = ("name", "registry", "username", "filters", "status", "rescan_after_db_update", "schedule", "scan_layers", "cfg_type")
    output.list(columns, summarys)


@show_registry.command()
@click.argument("name")
@click.pass_obj
def detail(data, name):
    """Show registry detail."""
    summary = data.client.show("scan/registry", "summary", name)
    if not summary:
        return

    output.lift_fields(summary, "schedule", ("schedule",))
    _list_registry_display_format(summary)
    columns = (
    "name", "registry_type", "registry", "username", "filters", "rescan_after_db_update", "schedule", "status",
    "error_message",
    "scanned", "scheduled", "scanning", "failed", "cfg_type", "ignore_proxy")
    output.show(columns, summary)


@show_registry.command()
@click.argument("name")
@click.option('--filter_domain', default=None, help="filter by image domain.")
@click.option('--filter_repo', default=None, help="filter by image repository.")
@click.option("--page", default=40, type=click.IntRange(1), help="list page size, default=40")
@click.pass_obj
def images(data, name, filter_domain, filter_repo, page):
    """Show registry images summary."""
    args = {}
    if filter_domain:
        args['domain'] = utils.filter_value_include(filter_domain)
    if filter_repo:
        args['repository'] = utils.filter_value_include(filter_repo)
    args["start"] = 0
    args["limit"] = page

    while True:
        images = data.client.list("scan/registry/%s/images" % name, "image")
        if images == None:
            break

        for img in images:
            _list_image_display_format(img)

        # columns = ("image", "image_id", "status", "result", "signed", "high", "medium", "base_os", "created_at") # comment out until we can accurately tell it
        columns = ("image", "image_id", "status", "result", "high", "medium", "base_os", "created_at")
        output.list(columns, images)

        if args["limit"] > 0 and len(images) < args["limit"]:
            break

        click.echo("Press <esc> to exit, press other key to continue ...")
        c = utils.keypress()
        if ord(c) == 27:
            break

        args["start"] += page


@show_registry.command()
@click.argument("name")
@click.argument("image")
@click.option('--show_accepted', type=bool, is_flag=True, help="show accepted vulnerability.")
@click.pass_obj
def report(data, name, image, show_accepted):
    """Show registry image scan report."""
    args = {}
    if show_accepted:
        args['show'] = "accepted"

    report = None
    try:
        report = data.client.show("scan/registry/%s/image" % name, "report", image, **args)
    except client.ObjectNotFound:
        images = data.client.list("scan/registry/%s/images" % name, "image", image_id="in,%s" % image)
        # More than one image can have same image ID. Show the first one here.
        if len(images) >= 1:
            report = data.client.show("scan/registry/%s/image" % name, "report", images[0]["image_id"], **args)
        else:
            raise client.ObjectNotFound()

    if not report:
        return

    if report["vulnerabilities"] != None:
        if len(report["vulnerabilities"]) > 0:
            click.echo("Vulnerability Report")
            for vul in report["vulnerabilities"]:
                _show_registry_report_vulns_display_format(vul)
            columns = ("name", "severity", "package_name", "package_version", "fixed_version", "tags")
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
            click.echo("")

    signedByVerifiers = 0
    if "signature_data" in report and report["signature_data"] != None:
        signature_data = report["signature_data"]
        if "verifiers" in signature_data and signature_data["verifiers"] != None:
            if len(signature_data["verifiers"]) > 0:
                click.echo("Sigstore Verifiers:")
                verifiers = []
                for v in signature_data["verifiers"]:
                    rv = v.split("/", -1)
                    if len(rv) == 2:
                        obj = {"root_of_trust": rv[0], "verifier": rv[1]}
                        verifiers.append(obj)
                        signedByVerifiers += 1
                columns = ("root_of_trust", "verifier")
                output.list(columns, verifiers)
    if signedByVerifiers == 0:
        click.echo("The image is not signed by any configured verifier")
        click.echo("")

@show_registry.command()
@click.argument("name")
@click.argument("image")
@click.pass_obj
def layers(data, name, image):
    """Show registry image scan layers report."""
    report = None
    try:
        report = data.client.show("scan/registry/%s/layers" % name, "report", image)
    except client.ObjectNotFound:
        images = data.client.list("scan/registry/%s/images" % name, "image", image_id="in,%s" % image)
        # More than one image can have same image ID. Show the first one here.
        if len(images) >= 1:
            report = data.client.show("scan/registry/%s/layers" % name, "report", images[0]["image_id"])
        else:
            raise client.ObjectNotFound()

    if not report:
        return

    if len(report["layers"]) > 0:
        result = []
        layers = report["layers"]
        columns = ("digest", "vulnerabilities")
        secrets = False
        if layers[0]["secrets"] != None:
            for l in layers:
                result.append({"digest": l["digest"], "vulnerabilities": len(l["vulnerabilities"])})
        else:
            columns = ("digest", "vulnerabilities")
            for l in layers:
                result.append({"digest": l["digest"], "vulnerabilities": len(l["vulnerabilities"])})

        output.list(columns, result)
    else:
        click.echo("No Layers Report")


@show_registry.command()
@click.argument("source", type=click.Choice(['openshift']))
@click.option('--filter_domain', default=None, help="filter by image domain.")
@click.option('--filter_repo', default=None, help="filter by image repository.")
@click.option("--page", default=20, type=click.IntRange(1), help="list page size, default=20")
@click.pass_obj
def source(data, source, filter_domain, filter_repo, page):
    """Show image list by source."""
    args = {}
    if filter_domain:
        args['domain'] = utils.filter_value_include(filter_domain)
    if filter_repo:
        args['repository'] = utils.filter_value_include(filter_repo)
    args["start"] = 0
    args["limit"] = page

    while True:
        images = data.client.list("debug/registry/image/%s" % source, "image", **args)
        if images == None:
            break

        out = []
        for img in images:
            for i, tag in enumerate(img["tags"]):
                e = {}
                if i == 0:
                    e["domain"] = img["domain"]
                    e["repository"] = img["repository"]
                else:
                    e["domain"] = ""
                    e["repository"] = ""

                e["tag"] = tag["tag"]
                if tag["serial"].startswith("sha256:"):
                    e["serial"] = tag["serial"][7:][:output.SHORT_ID_LENGTH]
                else:
                    e["serial"] = tag["serial"][:output.SHORT_ID_LENGTH]

                out.append(e)

        columns = ("domain", "repository", "tag", "serial")
        output.list(columns, out)

        if args["limit"] > 0 and len(images) < args["limit"]:
            break

        click.echo("Press <esc> to exit, press other key to continue ...")
        c = utils.keypress()
        if ord(c) == 27:
            break

        args["start"] += page


# config

@create.command("registry")
@click.argument("registry_type", type=click.Choice(
    ['amazon', 'azure', 'docker', 'jfrog', 'openshift', 'redhat', 'nexus', 'gcr', 'gitlab', 'ibmcloud']))
@click.argument("name")
@click.option("-r", "--registry", help="Registry URL")
@click.option("-u", "--username", help="Registry Username")
@click.option("-p", "--password", is_flag=True, help="Registry Password")
@click.option("--token", help="Registry Token")
@click.option("--auth_with_token", is_flag=True, help="Registry authenticated with token")
@click.option("-f", "--filter", multiple=True,
              help="Registry image filters, as organization/repository_regex:tag_regex")
@click.option('--rescan', default="enable", help="Rescan scanned images after database update",
              type=click.Choice(['enable', 'disable']))
@click.option('--scan_layers', default="enable", help="Scan image layers", type=click.Choice(['enable', 'disable']))
@click.option("--schedule", default="manual", help="Registry scan schedule",
              type=click.Choice(['manual', 'auto', 'periodical']))
@click.option("--schedule_interval", default=300, type=int, help="Polling interval in seconds")
@click.option("--repolimit", type=int, help="Repository number limit")
@click.option("--taglimit", type=int, help="Tag number limit")
@click.option('--jfrog_mode', default="Repository Path", help="jfrog mode")
@click.option('--gitlab_api_url', help="Gitlab external url")
@click.option('--gitlab_private_token', help="Gitlab private token")
@click.option('--ibmcloud_account', help="ibm cloud account")
@click.option('--ibmcloud_token_url', help="ibm cloud iam oauth-tokens url")
@click.option("--ignore_proxy", is_flag=True, help="Set flag for this registry to ignore configured proxy during scans")
@click.pass_obj
def registry_create(data, registry_type, name, registry, username, password, token, auth_with_token,
                    filter, rescan, scan_layers, schedule, repolimit, taglimit,
                    jfrog_mode, schedule_interval, gitlab_api_url, gitlab_private_token,
                    ibmcloud_account, ibmcloud_token_url, ignore_proxy):
    """Create registry."""

    info = {"registry_type": _reg_types[registry_type], "name": name}

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
    if token:
        info["auth_token"] = token
    if auth_with_token:
        info["auth_with_token"] = auth_with_token

    if registry_type == "amazon":
        awsid = click.prompt("Account ID")
        region = click.prompt("Region")
        key = click.prompt("Access Key ID", default="")
        secret = click.prompt("Access secret", default="")
        info["aws_key"] = {
            "id": awsid,
            "region": region,
            "access_key_id": key,
            "secret_access_key": secret,
        }

    if registry_type == "gcr":
        json_key = click.prompt("Json Key")
        info["gcr_key"] = {
            "json_key": json_key,
        }

    if filter:
        l = []
        for s in filter:
            l.append(s)
        info["filters"] = l
    if rescan == 'enable':
        info["rescan_after_db_update"] = True
    else:
        info["rescan_after_db_update"] = False

    if scan_layers == 'enable':
        info["scan_layers"] = True
    else:
        info["scan_layers"] = False

    info["schedule"] = {"schedule": schedule, "interval": schedule_interval}

    if repolimit:
        info["repo_limit"] = repolimit
    if taglimit:
        info["tag_limit"] = taglimit

    if jfrog_mode:
        info["jfrog_mode"] = jfrog_mode

    if gitlab_api_url:
        info["gitlab_external_url"] = gitlab_api_url
    if gitlab_private_token:
        info["gitlab_private_token"] = gitlab_private_token

    if ibmcloud_account:
        info["ibm_cloud_account"] = ibmcloud_account
    if ibmcloud_token_url:
        info["ibm_cloud_token_url"] = ibmcloud_token_url
        
    if name.startswith('fed.'):
        info["cfg_type"] = client.FederalCfg
    else:
        info["cfg_type"] = client.UserCreatedCfg

    info["ignore_proxy"] = ignore_proxy

    data.client.create("scan/registry", {"config": info})


@set.command("registry")
@click.argument("name")
@click.option("-r", "--registry", help="Registry URL")
@click.option("-u", "--username", help="Registry Username")
@click.option("-p", "--password", is_flag=True, help="Registry Password")
@click.option("--token", help="Registry Token")
@click.option("--auth_with_token", default=None, help="Registry authenticated with token",
              type=click.Choice(['enable', 'disable']))
@click.option("-a", "--aws", is_flag=True, help="AWS ECR key")
@click.option("-f", "--filter", multiple=True,
              help="Registry image filters, as organization/repository_regex:tag_regex")
@click.option('--rescan', default=None, help="Rescan scanned images after database update",
              type=click.Choice(['enable', 'disable']))
@click.option('--scan_layers', default=None, help="Scan image layers", type=click.Choice(['enable', 'disable']))
@click.option("--schedule", default=None, help="Registry scan schedule",
              type=click.Choice(['manual', 'auto', 'periodical']))
@click.option("--schedule_interval", type=int, help="Polling interval in seconds")
@click.option("--repolimit", type=int, help="Repository number limit")
@click.option("--taglimit", type=int, help="Tag number limit")
@click.option("-g", "--gcr", is_flag=True, help="GCR Json Key")
@click.option('--gitlab_api_url', help="Gitlab external url")
@click.option('--gitlab_private_token', help="Gitlab private token")
@click.option('--ibmcloud_account', help="ibm cloud account")
@click.option('--ibmcloud_token_url', help="ibm cloud iam oauth-tokens url")
@click.option("--ignore_proxy", is_flag=True, help="Set flag for this registry to ignore configured proxy during scans")
@click.pass_obj
def set_registry(data, name, registry, username, password, token, auth_with_token,
                 aws, filter, rescan, scan_layers, schedule, schedule_interval, repolimit, taglimit,
                 gcr, gitlab_api_url, gitlab_private_token,
                 ibmcloud_account, ibmcloud_token_url, ignore_proxy):
    """Configure registry."""

    info = {"name": name}
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
    if token:
        info["auth_token"] = token
    if auth_with_token != None:
        if auth_with_token == 'enable':
            info["auth_with_token"] = True
        else:
            info["auth_with_token"] = False

    if aws:
        awsid = click.prompt("Account ID")
        region = click.prompt("Region")
        key = click.prompt("Access Key ID", default="")
        secret = click.prompt("Access secret", default="")
        info["aws_key"] = {
            "id": awsid,
            "region": region,
            "access_key_id": key,
            "secret_access_key": secret,
        }

    if gcr:
        json_key = click.prompt("Json Key")
        info["gcr_key"] = {
            "json_key": json_key,
        }

    if filter:
        l = []
        for s in filter:
            l.append(s)
        info["filters"] = l
    if rescan != None:
        if rescan == 'enable':
            info["rescan_after_db_update"] = True
        else:
            info["rescan_after_db_update"] = False

    if scan_layers != None:
        if scan_layers == 'enable':
            info["scan_layers"] = True
        else:
            info["scan_layers"] = False

    schd = {}
    if schedule != None:
        schd = {"schedule": schedule}
    if schedule_interval != None:
        if schedule != None and schedule != 'periodical':
            click.echo("schedule must be periodical when set schedule interval")
            return
        schd = {"schedule": 'periodical', "interval": schedule_interval}
    if schedule != None:
        info["schedule"] = schd
    if repolimit:
        info["repo_limit"] = repolimit
    if taglimit:
        info["tag_limit"] = taglimit

    if gitlab_api_url:
        info["gitlab_external_url"] = gitlab_api_url
    if gitlab_private_token:
        info["gitlab_private_token"] = gitlab_private_token

    if ibmcloud_account:
        info["ibm_cloud_account"] = ibmcloud_account
    if ibmcloud_token_url:
        info["ibm_cloud_token_url"] = ibmcloud_token_url
    
    info["ignore_proxy"] = ignore_proxy

    data.client.config("scan/registry", name, {"config": info})


@unset.command("registry")
@click.argument('name')
@click.option("-u", "--username", is_flag=True, help="Registry Username")
@click.option("-p", "--password", is_flag=True, help="Registry Password")
@click.option("-f", "--filter", is_flag=True, help="Unset filters")
@click.pass_obj
def unset_registry(data, name, username, password, filter):
    """Unset registry configuration."""

    info = {"name": name}
    unset = False
    if username:
        unset = True
        info["username"] = ""
    if password:
        unset = True
        info["password"] = ""
    if filter:
        unset = True
        info["filters"] = []

    if unset:
        data.client.config("scan/registry", name, {"config": info})
    else:
        click.echo("Please specify configurations to be unset.")


@delete.command('registry')
@click.argument("name")
@click.pass_obj
def registry_delete(data, name):
    """Delete registry."""

    data.client.delete("scan/registry", name)


# request

@request.group('registry')
@click.argument("name")
@click.pass_obj
def request_registry(data, name):
    """Request registry."""
    data.id_or_name = name


@request_registry.command("start")
@click.pass_obj
def registry_start(data):
    """Request to start scanning registry."""

    data.client.request("scan/registry", data.id_or_name, "scan", None)


@request_registry.command("stop")
@click.pass_obj
def registry_stop(data):
    """Request to stop scanning registry."""

    url = "scan/registry/%s" % data.id_or_name
    data.client.delete(url, "scan")
