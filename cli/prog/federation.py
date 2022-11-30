import click

from prog.cli import request
from prog.cli import set
from prog.cli import show
from prog.cli import unset
import base64
from prog import client
from prog import output
import json

clusterRoleNone = ""
clusterRoleMaster = "master"
clusterRoleJoint = "joint"

deployResultDisplay = {
    0: "successful",
    1: "unknown command",
    2: "notified",
    3: "failed",
    101: "failed because primary cluster version is too old",
    102: "failed because managed cluster version is too old",
    103: "failed because cluster upgrade is ongoing",
    200: "connected",
    201: "joined",
    202: "out of sync",
    203: "synced",
    204: "disconnected",
    205: "kicked",
    206: "left",
    207: "license_disallow"
}


# multi-clusters -----
@request.group("federation")
@click.pass_obj
def request_federation(data):
    """Request multi-clusters operation."""


@request_federation.command("promote")
@click.option("--name", help="The name to use for this cluster")
@click.option("--server", help="Exposed rest ip/fqdn of this primary cluster")
@click.option("--port", help="Exposed rest port of this primary cluster")
@click.option("--use_proxy", default="", type=click.Choice(["https", ""]),
              help="Use configured system https proxy or not when connecting to managed cluster")
@click.pass_obj
def request_federation_promote(data, name, server, port, use_proxy):
    """Promote a cluster to primary cluster in the federation."""
    master_rest_info = {"server": "", "port": 0}
    resp = data.client.show("fed/member", None, None)
    if server is None or port is None:
        master_rest_info = resp["local_rest_info"]
    if server is not None:
        master_rest_info["server"] = server
    if port is not None:
        master_rest_info["port"] = int(port)

    req = {"master_rest_info": master_rest_info}
    if name != None and name != "":
        req["name"] = name

    if "use_proxy" in resp:
        req["use_proxy"] = resp["use_proxy"]
    if use_proxy != "":
        req["use_proxy"] = use_proxy

    resp = data.client.request("fed", "promote", None, req)
    # click.echo("Federation promotion response object: {}".format(json.dumps(resp)))
    click.echo("")
    # click.echo("new_token: {}".format(new_token))
    # data.client.reset_token(resp["new_token"])
    data.client.logout()
    data.username = None
    click.echo("This cluster has been promoted as the primary cluster. Other clusters can join this cluster now.")
    click.echo("")
    click.echo("Please login again.")
    click.echo("")


@request_federation.command("demote")
@click.pass_obj
def request_federation_deomote(data):
    """Deomote a cluster from primary cluster in the federation."""
    resp = data.client.request("fed", "demote", None, {})
    # click.echo("Federation demotion response object: {}".format(json.dumps(resp)))
    click.echo("")
    client.RemoteCluster["id"] = ""
    # click.echo("new_token: {}".format(new_token))
    # data.client.reset_token(resp["new_token"])
    data.client.logout()
    data.username = None
    click.echo(
        "This cluster has been demoted from the primary cluster. It cannot connect to other clusters and other clusters cannot join this cluster anymore.")
    click.echo("")
    click.echo("Please login again.")
    click.echo("")


@request_federation.command("join_token")
@click.option("--duration", default="1", help="The duration(in hour) that the join_token is valid")
@click.pass_obj
def request_federation_join_token(data, duration):
    """Get a join-token from primary cluster in the federation."""
    args = {}
    df = float(duration)
    if df <= 0:
        df = 1
    df = df * 60
    dn = int(df)
    args["token_duration"] = dn
    resp = data.client.show("fed/join_token", "join_token", None, **args)
    # click.echo("Federation join_token response object: {}".format(json.dumps(resp)))
    click.echo("")
    click.echo("join_token: {}".format(resp))
    click.echo("")


@request_federation.command("join")
@click.option("--name", help="The name to use for this cluster")
@click.option("--server", help="Exposed rest ip/fqdn of the primary cluster")
@click.option("--port", help="Exposed rest port of the primary cluster")
@click.option("--local_server", help="Exposed rest ip/fqdn of this cluster")
@click.option("--local_port", help="Exposed rest port of this cluster")
@click.option("--token", required=True, help="join-token issed by primary cluster")
@click.option("--use_proxy", default="", type=click.Choice(["https", ""]),
              help="Use proxy when connecting to primary cluster")
@click.pass_obj
def request_federation_join(data, name, server, port, local_server, local_port, token, use_proxy):
    """Join a cluster to primary cluster in the federation."""
    joinTokenStr = base64.b64decode(token)
    joinToken = json.loads(joinTokenStr)

    resp = data.client.show("fed/member", None, None)
    joint_rest_info = resp["local_rest_info"]
    if local_server != None and local_server != "":
        joint_rest_info["server"] = local_server
    if local_port != None and int(local_port) != 0:
        joint_rest_info["port"] = int(local_port)

    if joint_rest_info is None or joint_rest_info["server"] == "" or int(joint_rest_info["port"]) == 0:
        click.echo("Failed because local cluster info is not configured yet.")
        return
    req = {"join_token": token, "joint_rest_info": joint_rest_info, "use_proxy": use_proxy}

    prompt = False
    if server == None or server == "":
        req["server"] = joinToken["s"]
        prompt = True
    if port == None or port == 0:
        req["port"] = int(joinToken["p"])
        prompt = True
    if prompt:
        click.echo("")
        click.echo("It will join the federation with primary cluster {}:{}".format(req["server"], req["port"]))
    if name != None and name != "":
        req["name"] = name
    # click.echo("Joining federation request object: {}".format(json.dumps(req)))
    resp = data.client.request("fed", "join", None, req)
    # click.echo("Joining federation response object: {}".format(json.dumps(resp)))
    click.echo("")
    click.echo("This cluster has joined the primary cluster successfully")
    click.echo("")


@request_federation.command("leave")
@click.option("--force", default="true", type=click.Choice(["true", "false"]), show_default=True,
              help="Force leaving the federation no matter primary cluster returns success or not")
@click.pass_obj
def request_federation_leave(data, force):
    """Leave the federation."""
    if force == "true":
        forceLeave = True
    else:
        forceLeave = False
    req = {"force": forceLeave}
    data.client.request("fed", "leave", None, req)
    click.echo("")
    click.echo("This cluster has left the federation successfully")
    click.echo("")


@request_federation.command("remove")
@click.option("--id", required=True, help="ID of the managed cluster to remove out of the federation")
@click.pass_obj
def request_federation_remove(data, id):
    """Remove a managed cluster out of the federation."""
    data.client.delete("fed/cluster", id)
    click.echo("")
    click.echo("The managed cluster {} has been removed out of the federation successfully".format(id))
    click.echo("")


@request_federation.command("deploy")
@click.option("--id", required=False, multiple=True, help="ID of the managed clusters to deploy federation settings")
@click.option("--force", is_flag=True, help="Foce deploy full federal rules to specified managed clusters")
@click.pass_obj
def request_federation_deploy(data, id, force):
    """Deploy federal settings to managed cluster(s) in the federation."""
    req = {"force": False}
    if force:
        req["force"] = True
    if len(id) > 0:
        req["ids"] = id
    resp = data.client.request("fed", "deploy", None, req)
    click.echo("")
    results = resp["results"]
    click.echo("Result of notifying managed clusters:")
    click.echo("---------------------------------------------------------------------------------------")
    click.echo("          managed cluster id       |  result                                           ")
    click.echo("---------------------------------------------------------------------------------------")
    for id in results:
        click.echo(" {}     {}".format(id, deployResultDisplay[int(results[id])]))
    click.echo("")


#####
@show.group("federation")
@click.pass_obj
def show_federation(data):
    """Show multi-clusters configuration."""


@show_federation.command("member")
@click.pass_obj
def show_federation_member(data):
    """Show multi-clusters members this cluster knows."""
    resp = data.client.show("fed/member", None, None)
    # click.echo("Federation organization object: {}".format(json.dumps(resp)))
    click.echo("")
    if resp is None or (resp["fed_role"] == clusterRoleNone):
        useProxy = False
        if "use_proxy" in resp:
            useProxy = resp["use_proxy"]
        click.echo("Not in federation")
        click.echo("--------------------------------------------")
        click.echo("Local cluster rest info:")
        click.echo("  REST server/port:        {}:{}".format(resp["local_rest_info"]["server"],
                                                             resp["local_rest_info"]["port"]))
        click.echo("")
        click.echo("Use proxy for inter-cluster communications: {}".format(useProxy))
        click.echo("")
    else:
        click.echo("Role of this cluster in the federation: {}".format(resp["fed_role"]))
        click.echo("")
        clusters = []
        proxyRequiredTitle = "proxy required for connection"
        columns = ("role", "id", "name", "rest server/port", "status", "use proxy", "proxy required for connection")
        master = {}
        master["role"] = "primary"
        master["id"] = resp["master_cluster"]["id"]
        master["name"] = resp["master_cluster"]["name"]
        master["rest server/port"] = "{}:{}".format(resp["master_cluster"]["rest_info"]["server"],
                                                    resp["master_cluster"]["rest_info"]["port"])
        if resp["fed_role"] == clusterRoleMaster:
            master["status"] = "self"
            master["use proxy"] = False
            master[proxyRequiredTitle] = ""
            if "use_proxy" in resp:
                master["use proxy"] = resp["use_proxy"]
            clusters.append(master)
            if "joint_clusters" in resp:
                joint_clusters = resp["joint_clusters"]
                for cluster in joint_clusters:
                    cluster["role"] = "managed"
                    cluster["rest server/port"] = "{}:{}".format(cluster["rest_info"]["server"],
                                                                 cluster["rest_info"]["port"])
                    cluster["use proxy"] = ""
                    cluster[proxyRequiredTitle] = ""
                    if "proxy_required" in cluster:
                        cluster[proxyRequiredTitle] = cluster["proxy_required"]
                    clusters.append(cluster)
        elif resp["fed_role"] == clusterRoleJoint:
            master["status"] = resp["master_cluster"]["status"]
            master["use proxy"] = ""
            master[proxyRequiredTitle] = ""
            clusters.append(master)
            if len(resp["joint_clusters"]) > 0:
                joint_cluster = resp["joint_clusters"][0]
                joint = {}
                joint["role"] = "managed"
                joint["id"] = joint_cluster["id"]
                joint["name"] = joint_cluster["name"]
                joint["rest server/port"] = "{}:{}".format(joint_cluster["rest_info"]["server"],
                                                           joint_cluster["rest_info"]["port"])
                joint["status"] = joint_cluster["status"]
                joint[proxyRequiredTitle] = ""
                joint["use proxy"] = False
                if "use_proxy" in resp:
                    joint["use proxy"] = resp["use_proxy"]
                clusters.append(joint)
        output.list(columns, clusters)
    # click.echo("")

@show_federation.command("config")
@click.pass_obj
def show_federation_config(data):
    """Show fed configurations on the master cluster."""
    resp = data.client.show("fed/member", None, None)
    # click.echo("Federation organization object: {}".format(json.dumps(resp)))
    click.echo("")
    if resp is None or (resp["fed_role"] != clusterRoleMaster):
        click.echo("")
    else:
        click.echo("Role of this cluster in the federation: {}".format(resp["fed_role"]))
        click.echo("")
        clusters = []
        cfg = {}
        deploy_repo_scan_data_title = "deploy repository scan data"
        cfg["use proxy"] = False
        if "use_proxy" in resp:
            cfg["use proxy"] = resp["use_proxy"]
        cfg[deploy_repo_scan_data_title] = False
        if "deploy_repo_scan_data" in resp:
            cfg[deploy_repo_scan_data_title] = resp["deploy_repo_scan_data"]

        columns = ("use proxy", deploy_repo_scan_data_title)
        output.show(columns, cfg)
    # click.echo("")

@show_federation.command("remote")
@click.pass_obj
def show_federation_remote(data):
    if client.RemoteCluster["id"] == "":
        click.echo("Working on local cluster")
    else:
        click.echo("Working on remote cluster - id: {})".format(client.RemoteCluster["id"]))


#####
@set.group("federation")
@click.pass_obj
def set_federation(data):
    """Set federation configuration."""


@set_federation.command("config")
@click.option("--name", help="The name to use for this cluster")
@click.option("--server", help="Exposed rest ip/fqdn of this cluster")
@click.option("--port", help="Exposed rest port of this cluster")
@click.option("--use_proxy", default="", type=click.Choice(["https", ""]),
              help="Use proxy when connecting to primary cluster")
@click.option("--deploy_repo_scan_data", default="", type=click.Choice(["enable", "disable", ""]),
              help="Deploy repository scan data on primary cluster to managed clusters")
@click.pass_obj
def set_federation_config(data, name, server, port, use_proxy, deploy_repo_scan_data):
    """Configure the exposed rest info of this cluster."""
    rest_info = {"server": "", "port": 0}
    resp = data.client.show("fed/member", None, None)
    if server is None or port is None:
        rest_info = resp["local_rest_info"]
    if server is not None:
        rest_info["server"] = server
    if port is not None:
        rest_info["port"] = int(port)
    body = {"rest_info": rest_info}
    body["use_proxy"] = use_proxy
    if name != None and name != "":
        body["name"] = name
    if deploy_repo_scan_data == "enable":
        body["deploy_repo_scan_data"] = True
    elif deploy_repo_scan_data == "disable":
        body["deploy_repo_scan_data"] = False
    ret = data.client.config("fed", "config", body)


@set_federation.command("remote")
@click.option("--id", required=True, help="ID of the cluster to work on")
@click.pass_obj
def set_federation_remote(data, id):
    """Set joined cluster to work on."""
    resp = data.client.show("fed/member", None, None)
    # click.echo("Tokens data object: {}".format(json.dumps(resp)))
    if resp is None or (resp["fed_role"] != clusterRoleMaster):
        click.echo("This operation is only allowed on primary cluster in fedaration")
        return
    elif resp["master_cluster"]["id"] == id:
        client.RemoteCluster["id"] = ""
        return
    else:
        if "joint_clusters" in resp:
            joint_clusters = resp["joint_clusters"]
            for cluster in joint_clusters:
                # click.echo("cluster: {}".format(json.dumps(cluster))) ######
                if cluster["id"] == id:
                    client.RemoteCluster["id"] = cluster["id"]
                    click.echo("Done.")
                    return
        else:
            click.echo("No managed cluster in this federation yet.")
    click.echo("Error: Invalid cluster id!")
    return


#####
@unset.group("federation")
@click.pass_obj
def unset_federation(data):
    """Unset federation configuration."""


@unset_federation.command("remote")
@click.pass_obj
def unset_federation_remote(data):
    """Switch back to primary cluster."""
    if client.RemoteCluster["id"] != "":
        client.RemoteCluster["id"] = ""
        click.echo("Done.")
        return
