import click
import io
import requests
import time
import zlib

from prog.cli import request
from prog.cli import create
from prog.cli import delete
from prog.cli import show
from prog.cli import set as cli_set
from prog.cli import unset
from prog import client
from prog import multipart
from prog import output
from prog import utils


@show.group('system')
@click.pass_obj
def show_system(data):
    """Show system information."""


@show_system.command()
@click.pass_obj
def usage(data):
    """Show system usage."""
    usage = data.client.show("system", "usage", "usage")

    columns = ["reported_at", "platform", "hosts", "cores", "cvedb_version", "domains", "running_pods"]
    output.list(columns, usage)


@show_system.command()
@click.pass_obj
def summary(data):
    """Show system summary."""
    summary = data.client.show("system", "summary", "summary")

    column_map = (("domains", "Domains"),
                  ("hosts", "Hosts"),
                  ("controllers", "Controllers"),
                  ("enforcers", "Enforcers"),
                  ("disconnected_enforcers", "Disconnected Enforcers"),
                  ("workloads", "Workloads"),
                  ("running_workloads", "Running workloads"),
                  ("running_pods", "Running pods"),
                  ("services", "Services"),
                  ("policy_rules", "Policy rules"),
                  ("platform", "Platform"),
                  ("cvedb_version", "CVE-DB version"),
                  ("cvedb_create_time", "CVE-DB created at"))
    output.show_with_map(column_map, summary)


@show_system.command()
@click.pass_obj
def stats(data):
    """Show system stats."""
    stats = data.client.show("debug/system", "stats", "stats")

    column_map = (("expired_tokens", "Expired tokens"),
                  ("scan_state_keys", "Scan state keys"),
                  ("scan_data_keys", "Scan data keys"),)
    output.show_with_map(column_map, stats)


def _show_system_setting_display_format(s):
    f = "syslog_categories"
    if s.get(f):
        s[output.key_output(f)] = ",".join(s[f])
    f = "auth_order"
    if s.get(f):
        s[output.key_output(f)] = ",".join(s[f])
    f = "configured_internal_subnets"
    if s.get(f):
        s[output.key_output(f)] = ",".join(s[f])
    f = "controller_debug"
    if f in s:
        s[output.key_output(f)] = ", ".join(s[f])
    f = "registry_http_proxy"
    if s.get(f):
        if s[f].get("username"):
            s[output.key_output(f)] = s[f]["url"].replace("//", "//%s:%s@" % (s[f]["username"], s[f]["username"]))
        else:
            s[output.key_output(f)] = s[f]["url"]
    f = "registry_https_proxy"
    if s.get(f):
        if s[f].get("username"):
            s[output.key_output(f)] = s[f]["url"].replace("//", "//%s:%s@" % (s[f]["username"], s[f]["username"]))
        else:
            s[output.key_output(f)] = s[f]["url"]


@show_system.command()
@click.option("--scope", default="all", type=click.Choice(['fed', 'local', 'all']), show_default=True,
              help="Show federal, local or all system configuration")
@click.pass_obj
def setting(data, scope):
    """Show system configuration."""
    if scope == "fed":
        showFedSystemConfig(data, scope)
    else:
        showLocalSystemConfig(data, scope)


def showFedSystemConfig(data, scope):
    args = {}
    if scope == 'fed':
        args["scope"] = scope
    conf = data.client.show("system", "fed_config", "config", **args)

    column_map = ()
    _show_system_setting_display_format(conf)
    output.show_with_map(column_map, conf)

    if "webhooks" in conf:
        for wh in conf["webhooks"]:
            wh["scope"] = client.CfgTypeDisplay[wh["cfg_type"]]
    columns = ("name", "url", "type", "enable", "scope")
    output.list(columns, conf["webhooks"])


def showLocalSystemConfig(data, scope):
    args = {}
    if scope == 'local':
        args["scope"] = scope
    conf = data.client.show("system", "config", "config", **args)

    column_map = ()
    if "policy_mode" in conf:
        column_map += (("policy_mode", "Policy Mode"),)
    if "new_service_policy_mode" in conf:
        column_map += (("new_service_policy_mode", "New Service Policy Mode"),)
    if "new_service_profile_baseline" in conf:
        column_map += (("new_service_profile_baseline", "New Service Profile Baseline"),)
    if "unused_group_aging" in conf:
        column_map += (("unused_group_aging", "Unused group aging time (hour)"),)
    if conf["syslog_ip"]:
        conf["syslog_addr"] = "%s:%d" % (conf["syslog_ip"], conf["syslog_port"])
    else:
        conf["syslog_addr"] = ""
    if conf["syslog_ip_proto"] == 6:
        conf["syslog_protocol"] = "TCP"
    else:
        conf["syslog_protocol"] = "UDP"

    conf["ibmsa_ep"] = ""
    if conf["ibmsa_ep_start"] == 1:
        conf["ibmsa_ep_start"] = True
    else:
        conf["ibmsa_ep_start"] = False
    column_map += (("ibmsa_ep", "Integrate with IBM Security Advisor"),
                   ("ibmsa_ep_enabled", "       Enabled"),
                   ("ibmsa_ep_start", "       Setup done"),
                   ("ibmsa_ep_dashboard_url", "       NeuVector Dashboard URL"),
                   ("ibmsa_ep_connected_at", "       Connection creation time"),)

    column_map += (("syslog_addr", "Syslog Address"),
                   ("syslog_protocol", "       Protocol"),
                   ("syslog_level", "       Level"),
                   ("syslog_in_json", "       In-JSON"),
                   ("syslog_status", "       Status"),
                   ("syslog_categories", "       categories"),)
    if "single_cve_per_syslog" in conf:
        column_map += (("single_cve_per_syslog", "Single CVE per syslog"),)
    if "auth_order" in conf:
        column_map += (("auth_order", "Authentication order"),)
    if "auth_by_platform" in conf:
        column_map += (("auth_by_platform", "Authentication by platform(Rancher or OpenShift)"),)
    if "rancher_ep" in conf:
        column_map += (("rancher_ep", "Rancher endpoint url"),)
    if "configured_internal_subnets" in conf:
        column_map += (("configured_internal_subnets", "Configured internal subnets"),)
    if "cluster_name" in conf:
        column_map += (("cluster_name", "Cluster Name"),)
    if "controller_debug" in conf:
        column_map += (("controller_debug", "Controller Debug"),)
    if "monitor_service_mesh" in conf:
        column_map += (("monitor_service_mesh", "Monitor Service Mesh Status"),)
    if "registry_http_proxy_status" in conf:
        column_map += (("registry_http_proxy_status", "HTTP Proxy status"),)
    if "registry_https_proxy_status" in conf:
        column_map += (("registry_https_proxy_status", "HTTPS Proxy status"),)
    if "registry_http_proxy" in conf:
        column_map += (("registry_http_proxy", "HTTP Proxy"),)
    if "registry_https_proxy" in conf:
        column_map += (("registry_https_proxy", "HTTPS Proxy"),)
    if "xff_enabled" in conf:
        column_map += (("xff_enabled", "Enable xff based policy match"),)
    if "net_service_status" in conf:
        column_map += (("net_service_status", "Enable Network Service Policy Mode"),)
    if "net_service_policy_mode" in conf:
        column_map += (("net_service_policy_mode", "Network Service Policy Mode"),)
    if "mode_auto_d2m" in conf:
        column_map += (("mode_auto_d2m", "Auto Mode Upgrader: Discover -> Monitor"),
                   ("mode_auto_d2m_duration", "       Duration"),)
    if "mode_auto_m2p" in conf:
        column_map += (("mode_auto_m2p", "Auto Mode Upgrader: Monitor -> Protect"),
                   ("mode_auto_m2p_duration", "       Duration"),)

    _show_system_setting_display_format(conf)
    output.show_with_map(column_map, conf)

    if "webhooks" in conf:
        for wh in conf["webhooks"]:
            wh["scope"] = client.CfgTypeDisplay[wh["cfg_type"]]
    click.echo("")
    click.echo("Webhooks:")
    columns = ("name", "url", "type", "enable", "scope")
    output.list(columns, conf["webhooks"])


@show_system.group("partner")
@click.pass_obj
def show_partner(data):
    """Show partner data."""


@show_partner.group("ibmsa")
@click.pass_obj
def show_ibmsa(data):
    """Show IBM Security Advisor setup data."""


@show_ibmsa.command("config")
@click.pass_obj
def show_ibmsa_config(data):
    """Show IBM Security Advisor setup configuration."""
    conf = data.client.show("partner/ibm_sa_config", None, None)

    column_map = ()
    if "account_id" in conf:
        column_map += (("account_id", "IBM Account ID"),)
    if "apikey" in conf:
        column_map += (("apikey", "API Key(masked)"),)
    if "findings_url" in conf:
        column_map += (("findings_url", "findings URL"),)
    if "provider_id" in conf:
        column_map += (("provider_id", "Provider/Service ID"),)
    if "token_url" in conf:
        column_map += (("token_url", "Token URL"),)

    output.show_with_map(column_map, conf)


@show_ibmsa.command("setup_uri")
@click.pass_obj
def get_ibmsa_setup_url(data):
    """Get IBM Security Advisor setup URI."""
    conf = data.client.show("partner/ibm_sa_ep", None, None)
    if "url" in conf:
        click.echo("")
        click.echo("URI: {}".format(conf["url"]))
    click.echo("")


def _show_system_internal_subnets_display_format(s):
    f = "configured_internal_subnets"
    if s.get(f):
        s[output.key_output(f)] = ",".join(s[f])

    f = "learned_internal_subnets"
    if s.get(f):
        s[output.key_output(f)] = ",".join(s[f])

    f = "effective_internal_subnets"
    if s.get(f):
        s[output.key_output(f)] = ",".join(s[f])


@show_system.command()
@click.pass_obj
def internal_subnets(data):
    """Show internal subnets."""
    subnets = data.client.show("debug", "internal_subnets", "internal_subnets")
    column_map = (("configured_internal_subnets", "Configured"),
                  ("learned_internal_subnets", "Learned"),
                  ("effective_internal_subnets", "Effective"),)
    _show_system_internal_subnets_display_format(subnets)
    output.show_with_map(column_map, subnets)


@show_system.command()
@click.option("--page", default=20, type=click.IntRange(1), help="list page size, default=20")
@click.pass_obj
def ip_2_container(data, page):
    """Show ip-continer map."""
    filter = {"start": 0, "limit": page}
    while True:
        wls = data.client.list("debug/ip2workload", "ip_2_workload", **filter)

        for wl in wls:
            utils.list_format_ip2workload(wl)
        columns = ["ip", "id", "name"]
        output.list(columns, wls)

        if filter["limit"] > 0 and len(wls) < filter["limit"]:
            break

        click.echo("Press <esc> to exit, press other key to continue ...")
        c = utils.keypress()
        if ord(c) == 27:
            break

        filter["start"] += page


def _display_license(lic):
    column_map = (("name", "Name"),
                  ("email", "Email"),
                  ("phone", "Phone"),
                  # ("id", "ID"),
                  # ("id_type", "ID type"),
                  ("expire", "Expire"),
                  ("node_limit", "Supported Number of Enforcers"),
                  ("cpu_limit", "Supported Number of CPUs"),
                  ("multi_cluster_limit", "Supported Number of Manageable non-Primary Clusters"),
                  ("scan", "Allow Container Scan"),
                  ("enforce", "Allow Enforce Mode"),
                  ("serverless", "Allow Serverless scan"))

    if lic["serverless"] == True:
        lic["serverless"] = "Y"
    else:
        lic["serverless"] = "N"

    if lic["scan"] == True:
        lic["scan"] = "Y"
    else:
        lic["scan"] = "N"

    if lic["enforce"] == True:
        lic["enforce"] = "Y"
    else:
        lic["enforce"] = "N"
    output.show_with_map(column_map, lic)


@show_system.command()
@click.pass_obj
def license(data):
    """Show system license."""
    lic = data.client.show("system", "license", "license")
    if lic != None:
        _display_license(lic["info"])


# request
@request.group('system')
@click.pass_obj
def request_system(data):
    """System"""


@request_system.command('policy_mode')
@click.argument('mode', type=click.Choice(['discover', 'monitor', 'protect']))
@click.pass_obj
def request_system_policy_mode(data, mode):
    """Set policy mode for all existing services"""
    data.client.request("system", "request", None, {"request": {"policy_mode": mode.title()}})


@request_system.command('unquarantine')
@click.option('--group', '-g')
@click.option('--rule', '-r', type=int)
@click.pass_obj
def request_system_unquarantine(data, group, rule):
    """Unquarantine containers"""
    if group == None and rule == None:
        click.echo("Error: must have at least one param")
        return

    unquar = {}
    if group != None and group != "all":
        unquar["group"] = group
    if rule != None:
        unquar["response_rule"] = rule

    data.client.request("system", "request", None, {"request": {"unquarantine": unquar}})


# create
@create.group('system')
@click.pass_obj
def create_system(data):
    """Create system configuration."""


@create_system.command("webhook")
@click.argument('name')
@click.argument('url')
@click.option("--type", default="", help="webhook type", type=click.Choice(['Slack', 'JSON']))
@click.option("--scope", default="local", type=click.Choice(['fed', 'local']), show_default=True,
              help="It's for local or federal response rule")
@click.option("--enable/--disable", default=True, is_flag=True, help="Enable/Disable the webhook")
@click.pass_obj
def create_system_webhook_url(data, name, url, type, scope, enable):
    """Create webhook settings"""
    if type == "slack":
        type = "Slack"
    else:
        type = ""
    body = {"name": name, "url": url, "enable": enable, "type": type}
    if scope == "fed":
        body["cfg_type"] = "federal"
    else:
        body["cfg_type"] = "user_created"
    data.client.create("system/config/webhook", {"config": body})


# delete
@delete.group('system')
@click.pass_obj
def delete_system(data):
    """Delete system configuration."""


@delete_system.command("webhook")
@click.argument('name')
@click.option("--scope", default="local", type=click.Choice(['fed', 'local']), show_default=True,
              help="It's for local or federal response rule")
@click.pass_obj
def delete_system_webhook_url(data, name, scope):
    """Delete webhook settings"""
    args = {}
    args["scope"] = scope
    data.client.delete("system/config/webhook", name, **args)


# set
@cli_set.group('system')
@click.pass_obj
def set_system(data):
    """Set system configuration."""


@set_system.group('new_service')
@click.pass_obj
def set_system_new_service(data):
    """Set system new service configruation"""


@set_system_new_service.command("policy_mode")
@click.argument('mode', type=click.Choice(['discover', 'monitor', 'protect']))
@click.pass_obj
def set_system_new_service_policy_mode(data, mode):
    """Set system new service policy mode."""
    data.client.config_system(new_service_policy_mode=mode.title())


@set_system_new_service.command("profile_baseline")
@click.argument('baseline', type=click.Choice(['basic', 'zero-drift']))
@click.pass_obj
def set_system_new_service_profile_baseline(data, baseline):
    """Set system new service profile baseline."""
    data.client.config_system(new_service_profile_baseline=baseline.title())


@set_system.group('unused_group')
@click.pass_obj
def set_system_unused_group(data):
    """Set system unused group configruation"""


@set_system_unused_group.command("aging")
@click.option("--time", default=24, type=click.IntRange(0, 168),
              help="unused group aging, default=24hr, 0 means no aging")
@click.pass_obj
def set_system_unused_group_aging(data, time):
    """Set system unused group aging time."""
    data.client.config_system(unused_group_aging=time)


@set_system.group("partner")
@click.pass_obj
def set_system_partner(data):
    """Set partner integration settings"""


@set_system_partner.group("ibmsa", invoke_without_command=True)
@click.option("--disable/--enable", default=None, required=False,
              help="Enable/disable IBM Security Advisor integration")
@click.option("--dashboard", default=None, required=False, help="NeuVector dashboard URL")
@click.pass_obj
def set_system_ibmsa(data, disable, dashboard):
    """Set IBM Security Advisor integration settings"""
    enable = None
    if disable is True:
        enable = False
    elif disable is False:
        enable = True

    if enable is not None:
        if enable:
            if dashboard is None:
                data.client.config_system(ibmsa_ep_enabled=True)
            else:
                data.client.config_system(ibmsa_ep_enabled=True, ibmsa_ep_dashboard_url=dashboard)
        else:
            if dashboard is None:
                data.client.config_system(ibmsa_ep_enabled=False)
            else:
                data.client.config_system(ibmsa_ep_enabled=False, ibmsa_ep_dashboard_url=dashboard)
    elif dashboard is not None and dashboard != "":
        data.client.config_system(ibmsa_ep_dashboard_url=dashboard)


@set_system.group("syslog")
@click.pass_obj
def set_system_syslog(data):
    """Set syslog settings"""


@set_system_syslog.command("status")
@click.argument('status', type=click.Choice(['enable', 'disable']))
@click.pass_obj
def set_system_syslog_status(data, status):
    """Enable/disable syslog"""
    if status == 'enable':
        data.client.config_system(syslog_status=True)
    else:
        data.client.config_system(syslog_status=False)


@set_system_syslog.command("in-json")
@click.argument('in_json', type=click.Choice(['enable', 'disable']))
@click.pass_obj
def set_system_syslog_in_json(data, in_json):
    """Enable/disable syslog in JSON format"""
    if in_json == 'enable':
        data.client.config_system(syslog_in_json=True)
    else:
        data.client.config_system(syslog_in_json=False)


@set_system_syslog.command("category")
@click.option('--category', '-c', multiple=True,
              type=click.Choice(['all', 'event', 'security-event', 'audit'])
              )
@click.pass_obj
def set_system_syslog_categories(data, category):
    """Set syslog categories"""
    s = set()
    l = []
    for c in category:
        if c == 'all':
            s |= set(['event', 'security-event', 'audit'])
        else:
            s.add(c)
    for c in s:
        l.append(c)
    data.client.config_system(syslog_categories=l)


@set_system_syslog.command("server")
@click.argument('address')
@click.pass_obj
def set_system_syslog_server(data, address):
    """Set syslog server address and port (1.2.3.4:514)"""
    tokens = address.split(":")
    if len(tokens) == 1:
        data.client.config_system(syslog_ip=address, syslog_port=0)
    elif len(tokens) == 2:
        data.client.config_system(syslog_ip=tokens[0], syslog_port=int(tokens[1]))
    else:
        click.echo("Error: Invalid address format")


@set_system_syslog.command("protocol")
@click.argument('protocol', type=click.Choice(['UDP', 'TCP']))
@click.pass_obj
def set_system_syslog_protocol(data, protocol):
    """Set syslog level"""
    if protocol == 'TCP':
        data.client.config_system(syslog_ip_proto=6)
    else:
        data.client.config_system(syslog_ip_proto=17)


@set_system_syslog.command("level")
@click.argument('level', type=click.Choice(['Critical', 'Error', 'Warning', 'Notice', 'Info']))
@click.pass_obj
def set_system_syslog_level(data, level):
    """Set syslog level"""
    data.client.config_system(syslog_level=level)


@set_system.command("single_cve_per_syslog")
@click.argument('status', type=click.Choice(['enable', 'disable']))
@click.pass_obj
def set_system_single_cve_per_syslog(data, status):
    """Enable/disable single CVE per syslog"""
    if status == 'enable':
        data.client.config_system(single_cve_per_syslog=True)
    else:
        data.client.config_system(single_cve_per_syslog=False)


@set_system.command("controller_debug")
@click.option('--category', '-c', multiple=True,
              type=click.Choice(['all', 'cpath', 'conn', 'mutex', 'scan', 'cluster'])
              )
@click.pass_obj
def set_system_controller_debug(data, category):
    """Set controller debug"""
    s = set()
    for c in category:
        if c == 'all':
            s |= set(['cpath', 'conn', 'mutex', 'scan', 'cluster'])
        else:
            s.add(c)
    # Can't use list(s) because we overwrite list with our own function
    l = []
    for c in s:
        l.append(c)
    data.client.config_system(controller_debug=l)


@set_system.command("auth_order")
@click.argument('order')
@click.pass_obj
def set_system_auth_order(data, order):
    """Set authentication order in comma-seperated server names"""
    servers = order.split(",")
    data.client.config_system(auth_order=servers)


@set_system.command("auth_openshift")
@click.argument('status', type=click.Choice(['enable', 'disable']))
@click.pass_obj
def set_system_auth_openshift(data, status):
    """Enable/disable authentication by OpenShift"""
    if status == 'enable':
        data.client.config_system(auth_by_platform=True)
    else:
        data.client.config_system(auth_by_platform=False)

@set_system.command("auth_platform")
@click.argument('status', type=click.Choice(['enable', 'disable']))
@click.pass_obj
def set_system_auth_platform(data, status):
    """Enable/disable authentication by platform(Rancher or OpenShift)"""
    if status == 'enable':
        data.client.config_system(auth_by_platform=True)
    else:
        data.client.config_system(auth_by_platform=False)

@set_system.command("rancher_ep")
@click.argument('url')
@click.pass_obj
def set_system_rancher_ep(data, url):
    """Rancher endpoint url"""
    data.client.config_system(rancher_ep=url)

@set_system.command("cluster_name")
@click.argument('name')
@click.pass_obj
def set_system_cluster_name(data, name):
    """Set cluster name"""
    data.client.config_system(cluster_name=name)


@set_system.command("webhook")
@click.argument('name')
@click.argument('url')
@click.option("--type", default="", help="webhook type", type=click.Choice(['Slack', 'JSON']))
@click.option("--scope", default="local", type=click.Choice(['fed', 'local']), show_default=True,
              help="It's for local or federal response rule")
@click.option("--enable/--disable", default=True, is_flag=True, help="Enable/Disable the webhook")
@click.pass_obj
def set_system_webhook_url(data, name, url, type, scope, enable):
    """Set webhook settings"""
    if type == "slack":
        type = "Slack"
    body = {"name": name, "url": url, "enable": enable, "type": type}
    args = {}
    args["scope"] = scope
    data.client.config("system/config/webhook", name, {"config": body}, **args)


@set_system.group("monitor_service_mesh")
@click.pass_obj
def set_system_monitor_service_mesh(data):
    """Set monitor service mesh settings"""


@set_system_monitor_service_mesh.command("status")
@click.argument('status', type=click.Choice(['enable', 'disable']))
@click.pass_obj
def set_system_monitor_service_mesh_status(data, status):
    """Enable/disable monitor_service_mesh"""
    if status == 'enable':
        data.client.config_system(monitor_service_mesh=True)
    else:
        data.client.config_system(monitor_service_mesh=False)


@set_system.group("xff_enabled")
@click.pass_obj
def set_system_xff_enabled(data):
    """Set xff based policy matching"""


@set_system_xff_enabled.command("status")
@click.argument('status', type=click.Choice(['enable', 'disable']))
@click.pass_obj
def set_system_xff_enabled_status(data, status):
    """Enable/disable xff based policy matching"""
    if status == 'enable':
        data.client.config_system(xff_enabled=True)
    else:
        data.client.config_system(xff_enabled=False)

@set_system.group('net_service')
@click.pass_obj
def set_system_net_service(data):
    """Set global network service configuration"""

@set_system_net_service.command("status")
@click.argument('status', type=click.Choice(['enable', 'disable']))
@click.pass_obj
def set_system_net_service_status(data, status):
    """Enable/disable global network service"""
    if status == 'enable':
        data.client.config_system_net(net_service_status=True)
    else:
        data.client.config_system_net(net_service_status=False)

@set_system_net_service.command("policy_mode")
@click.argument('mode', type=click.Choice(['discover', 'monitor', 'protect']))
@click.pass_obj
def set_system_net_service_policy_mode(data, mode):
    """Set system global network service policy mode."""
    data.client.config_system_net(net_service_policy_mode=mode.title())

@set_system.group("registry")
@click.pass_obj
def set_system_registry(data):
    """Set registry settings"""


@set_system_registry.command("http_proxy_status")
@click.argument('status', type=click.Choice(['enable', 'disable']))
@click.pass_obj
def set_system_registry_proxy_http_status(data, status):
    """Enable/disable registry HTTP proxy"""
    if status == 'enable':
        data.client.config_system(registry_http_proxy_status=True)
    else:
        data.client.config_system(registry_http_proxy_status=False)


@set_system_registry.command("https_proxy_status")
@click.argument('status', type=click.Choice(['enable', 'disable']))
@click.pass_obj
def set_system_registry_proxy_https_status(data, status):
    """Enable/disable registry HTTPS proxy"""
    if status == 'enable':
        data.client.config_system(registry_https_proxy_status=True)
    else:
        data.client.config_system(registry_https_proxy_status=False)


@set_system_registry.command("http_proxy")
@click.argument('url')
@click.option('--username', help="http proxy username")
@click.option('--password', help="http proxy password")
@click.pass_obj
def set_system_registry_http_proxy(data, url, username, password):
    """Set registry HTTP proxy"""
    proxy = {"url": url, "username": username, "password": password}
    data.client.config_system(registry_http_proxy=proxy)


@set_system_registry.command("https_proxy")
@click.argument('url')
@click.option('--username', help="https proxy username")
@click.option('--password', help="https proxy password")
@click.pass_obj
def set_system_registry_https_proxy(data, url, username, password):
    """Set registry HTTPS proxy"""
    proxy = {"url": url, "username": username, "password": password}
    data.client.config_system(registry_https_proxy=proxy)


# unset

@unset.group('system')
@click.pass_obj
def unset_system(data):
    """Unset system configuration."""


@unset_system.group("syslog")
@click.pass_obj
def unset_system_syslog(data):
    """Set syslog settings"""


@unset_system.group("registry")
@click.pass_obj
def unset_system_registry(data):
    """Unset registry settings"""


@unset_system_syslog.command("server")
@click.pass_obj
def unset_system_syslog_server(data):
    """Unset syslog server address."""
    data.client.config_system(syslog_ip="", syslog_port=0)


@unset_system_syslog.command("protocol")
@click.pass_obj
def unset_system_syslog_protocol(data):
    """Unset syslog protocol."""
    data.client.config_system(syslog_ip_proto=0)


@unset_system_syslog.command("level")
@click.pass_obj
def unset_system_syslog_level(data):
    """Unset syslog level."""
    data.client.config_system(syslog_level="")


@unset_system_syslog.command("category")
@click.pass_obj
def unset_system_syslog_category(data):
    """Unset categories to default."""
    data.client.config_system(syslog_categories=['event', 'security-event', 'audit'])


@unset_system.command("single_cve_per_syslog")
@click.pass_obj
def unset_system_single_cve_per_syslog(data):
    """Unset single CVE per syslog."""
    data.client.config_system(single_cve_per_syslog=False)


@unset_system.command("new_service")
@click.pass_obj
def unset_system_new_service(data):
    """Unset system new service"""
    data.client.config_system(new_service_policy_mode="")
    data.client.config_system(new_service_profile_setting="")


@unset_system.command("unused_group")
@click.pass_obj
def unset_system_unused_group(data):
    """Unset system unused group aging"""
    data.client.config_system(unused_group_aging=0)


@unset_system.command("auth_order")
@click.pass_obj
def unset_system_auth_order(data):
    """Unset system authentication order"""
    data.client.config_system(auth_order=[])


@unset_system.command("cluster_name")
@click.pass_obj
def unset_system_auth_order(data):
    """Unset system cluster name"""
    data.client.config_system(cluster_name="")


@unset_system_registry.command("http_proxy")
@click.pass_obj
def unset_system_registry_http_proxy(data):
    """Unset registry http proxy."""
    data.client.config_system(registry_http_proxy={"url": "", "username": "", "password": ""})


@unset_system_registry.command("https_proxy")
@click.pass_obj
def unset_system_registry_https_proxy(data):
    """Unset registry https proxy."""
    data.client.config_system(registry_https_proxy={"url": "", "username": "", "password": ""})


# export

def _write_part(part, filename):
    if filename and len(filename) > 0:
        try:
            with click.open_file(filename, 'w') as wfp:
                wfp.write(part.raw)
            click.echo("Wrote %s to %s" % (part.name, click.format_filename(filename)))
        except IOError:
            click.echo("Error: Failed to write %s to %s" % (part.name, click.format_filename(filename)))
    else:
        # gzip
        cfg = zlib.decompress(part.raw, 16 + zlib.MAX_WBITS)
        click.echo(cfg)


@request.group('export')
@click.pass_obj
def request_export(data):
    """Export"""


@request_export.command("config")
@click.option('--section', '-s', multiple=True, type=click.Choice(['user', 'policy']))
@click.option('--raw', default=False, is_flag=True, help='Export in raw format')
@click.option('--filename', '-f', type=click.Path(dir_okay=False, writable=True, resolve_path=True))
@click.pass_obj
def export_config(data, section, raw, filename):
    """Export system configurations."""

    # TODO: file is read into memory completely first, not ideal.
    if len(section) > 0:
        secs = ','.join(section)
        url = "file/config?section=" + secs
        if raw:
            url = url + "&raw=true"
        headers, body = data.client.download(url, None)
    else:
        url = "file/config"
        if raw:
            url = url + "?raw=true"
        headers, body = data.client.download(url, None)

    if raw:
        if filename and len(filename) > 0:
            try:
                with click.open_file(filename, 'w') as wfp:
                    wfp.write(body.content)
                click.echo("Wrote to %s" % click.format_filename(filename))
            except IOError:
                click.echo("Error: Failed to write to %s" % click.format_filename(filename))
        else:
            click.echo(body.content)
        return

    kwargs = {'strict': True}
    clen = int(headers.get('Content-Length', '-1'))
    ctype, options = multipart.parse_options_header(headers.get("Content-Type"))
    boundary = options.get('boundary', '')
    if ctype != 'multipart/form-data' or not boundary:
        click.echo("Unsupported content type.")
        return

    try:
        for part in multipart.MultipartParser(io.BytesIO(body.content), boundary, clen):
            if part.name == "configuration" and part.content_type == "application/x-gzip":
                _write_part(part, filename)
                return

        click.echo("Unable to export configurations.")
    except Exception as e:
        click.echo(e)


@request_export.command('group')
@click.option("--name", multiple=True, help="Name of group to export")
@click.option("--filename", "-f", type=click.Path(dir_okay=False, writable=True, resolve_path=True))
@click.pass_obj
def request_export_group(data, name, filename):
    """Export group policies."""

    groups = []
    for n in name:
        groups.append(n)

    respData = data.client.requestDownload("file", "group", None, {"groups": groups})
    if filename and len(filename) > 0:
        try:
            with click.open_file(filename, 'w') as wfp:
                wfp.write(respData)
            click.echo("Wrote to %s" % click.format_filename(filename))
        except IOError:
            click.echo("Error: Failed to write to %s" % click.format_filename(filename))
    else:
        click.echo(respData)
    return


@request_export.command('admission')
@click.option("--config", "-c", default=False, is_flag=True, help="Export admission control configuration")
@click.option("--id", multiple=True, help="ID of admission control rule to export")
@click.option("--filename", "-f", type=click.Path(dir_okay=False, writable=True, resolve_path=True))
@click.pass_obj
def request_export_admission(data, config, id, filename):
    """Export admission control configuration/rules."""

    ids = []
    for n in id:
        ids.append(int(n))

    respData = data.client.requestDownload("file", "admission", None, {"export_config": config, "ids": ids})
    if filename and len(filename) > 0:
        try:
            with click.open_file(filename, 'w') as wfp:
                wfp.write(respData)
            click.echo("Wrote to %s" % click.format_filename(filename))
        except IOError:
            click.echo("Error: Failed to write to %s" % click.format_filename(filename))
    else:
        click.echo(respData)
    return

@request_export.command('dlp')
@click.option("--name",  multiple=True, help="Name of DLP sensor to export")
@click.option("--filename", "-f", type=click.Path(dir_okay=False, writable=True, resolve_path=True))
@click.pass_obj
def request_export_dlp(data, name, filename):
    """Export DLP sensors/rules."""

    names = []
    for n in name:
        names.append(n)

    respData = data.client.requestDownload("file", "dlp", None, {"names": names})
    if filename and len(filename) > 0:
        try:
            with click.open_file(filename, 'w') as wfp:
                wfp.write(respData)
            click.echo("Wrote to %s" % click.format_filename(filename))
        except IOError:
            click.echo("Error: Failed to write to %s" % click.format_filename(filename))
    else:
        click.echo(respData)
    return

@request_export.command('waf')
@click.option("--name", multiple=True, help="Name of WAF sensor to export")
@click.option("--filename", "-f", type=click.Path(dir_okay=False, writable=True, resolve_path=True))
@click.pass_obj
def request_export_waf(data, name, filename):
    """Export WAF sensors/rules."""

    names = []
    for n in name:
        names.append(n)

    respData = data.client.requestDownload("file", "waf", None, {"names": names})
    if filename and len(filename) > 0:
        try:
            with click.open_file(filename, 'w') as wfp:
                wfp.write(respData)
            click.echo("Wrote to %s" % click.format_filename(filename))
        except IOError:
            click.echo("Error: Failed to write to %s" % click.format_filename(filename))
    else:
        click.echo(respData)
    return


@request.group('import')
@click.pass_obj
def request_import(data):
    """Import"""


@request_import.command("config")
@click.argument('filename', type=click.Path(dir_okay=False, exists=True, resolve_path=True))
@click.option("--raw", default=False, is_flag=True, help="Upload in raw format")
@click.option("--standalone", "ignoreFed", flag_value="true",
              help="Force to import from a federal-managed cluster to standalone cluster(no federal information is reserved)")
@click.pass_obj
def import_config(data, filename, raw, ignoreFed):
    """Import system configurations."""
    try:
        tid = ""
        tempToken = ""
        resp = data.client.importConfig("file/config", filename, raw, ignoreFed, tid, 0, "")
        if tid == "":
            if resp.status_code == requests.codes.partial:
                respJson = resp.json()
                if "data" in respJson:
                    respData = respJson["data"]
                    tid = respData["tid"]
                    click.echo("[progress: {:3d}%] {}".format(respData["percentage"], respData["status"]))
                    tempToken = respData["temp_token"]

        status = ""
        if tid != "":
            i = 1
            # click.echo("Info: import task transaction id is {}".format(tid))
            while resp.status_code == requests.codes.partial:
                time.sleep(3)
                resp = data.client.importConfig("file/config", filename, raw, ignoreFed, tid, i, tempToken)
                respJson = resp.json()
                if "data" in respJson:
                    respData = respJson["data"]
                    if "status" in respData:
                        status = respData["status"]
                    if status != "":
                        click.echo("[progress: {:3d}%] {}".format(respData["percentage"], status))
                i = i + 1
            # click.echo("--------------------------")
            if resp.status_code == requests.codes.ok:
                respJson = resp.json()
                if "data" in respJson:
                    respData = respJson["data"]
                    if "status" in respData:
                        status = respData["status"]

        click.echo("")
        if resp.status_code == requests.codes.ok and status == "done":
            click.echo("Uploaded configuration file {}. Please login again.".format(click.format_filename(filename)))
        else:
            click.echo("[1] Error: Failed to upload configuration file {}".format(click.format_filename(filename)))
    except IOError:
        click.echo("")
        click.echo("[2] Error: Failed to upload configuration file %s" % click.format_filename(filename))
    click.echo("")


@request_import.command("group")
@click.argument('filename', type=click.Path(dir_okay=False, exists=True, resolve_path=True))
# @click.option("--raw", default=False, is_flag=True, help="Upload in raw format")
@click.pass_obj
def import_group(data, filename):
    """Import group policy."""
    try:
        tid = ""
        resp = data.client.importConfig("file/group/config", filename, True, None, tid, 0, "")
        if tid == "":
            if resp.status_code == requests.codes.partial:
                respJson = resp.json()
                if "data" in respJson:
                    respData = respJson["data"]
                    tid = respData["tid"]
                    click.echo("[progress: {:3d}%] {}".format(respData["percentage"], respData["status"]))
        status = ""
        if tid != "":
            i = 1
            # click.echo("Info: import task transaction id is {}".format(tid))
            while resp.status_code == requests.codes.partial:
                time.sleep(2)
                resp = data.client.importConfig("file/group/config", filename, True, None, tid, i, "")
                respJson = resp.json()
                if "data" in respJson:
                    respData = respJson["data"]
                    if "status" in respData:
                        status = respData["status"]
                    if status != "":
                        click.echo("[progress: {:3d}%] {}".format(respData["percentage"], status))
                i = i + 1
            # click.echo("--------------------------")
            if resp.status_code == requests.codes.ok:
                respJson = resp.json()
                if "data" in respJson:
                    respData = respJson["data"]
                    if "status" in respData:
                        status = respData["status"]

        click.echo("")
        if resp.status_code == requests.codes.ok and status == "done":
            click.echo("Imported group policy {}.".format(click.format_filename(filename)))
        else:
            click.echo("[1] Error: Failed to import group policy {}".format(click.format_filename(filename)))
    except IOError:
        click.echo("")
        click.echo("[2] Error: Failed to import group policy %s" % click.format_filename(filename))
    click.echo("")


@request_import.command('admission')
@click.argument('filename', type=click.Path(dir_okay=False, exists=True, resolve_path=True))
# @click.option("--raw", default=False, is_flag=True, help="Upload in raw format")
@click.pass_obj
def import_admission(data, filename):
    """Import admission control configuration/rules."""
    try:
        tid = ""
        resp = data.client.importConfig("file/admission/config", filename, True, None, tid, 0, "")
        if tid == "":
            if resp.status_code == requests.codes.partial:
                respJson = resp.json()
                if "data" in respJson:
                    respData = respJson["data"]
                    tid = respData["tid"]
                    click.echo("[progress: {:3d}%] {}".format(respData["percentage"], respData["status"]))
        status = ""
        if tid != "":
            i = 1
            # click.echo("Info: import task transaction id is {}".format(tid))
            while resp.status_code == requests.codes.partial:
                time.sleep(2)
                resp = data.client.importConfig("file/admission/config", filename, True, None, tid, i, "")
                respJson = resp.json()
                if "data" in respJson:
                    respData = respJson["data"]
                    if "status" in respData:
                        status = respData["status"]
                    if status != "":
                        click.echo("[progress: {:3d}%] {}".format(respData["percentage"], status))
                i = i + 1
            # click.echo("--------------------------")
            if resp.status_code == requests.codes.ok:
                respJson = resp.json()
                if "data" in respJson:
                    respData = respJson["data"]
                    if "status" in respData:
                        status = respData["status"]

        click.echo("")
        if resp.status_code == requests.codes.ok and status == "done":
            click.echo("Imported admission control configuration/rules {}.".format(click.format_filename(filename)))
        else:
            click.echo("[1] Error: Failed to import admission control configuration/rules {}".format(
                click.format_filename(filename)))
    except IOError:
        click.echo("")
        click.echo(
            "[2] Error: Failed to import admission control configuration/rules %s" % click.format_filename(filename))
    click.echo("")

@request_import.command('dlp')
@click.argument('filename', type=click.Path(dir_okay=False, exists=True, resolve_path=True))
@click.pass_obj
def import_dlp(data, filename):
    """Import DLP sensors/rules."""
    try:
        tid = ""
        resp = data.client.importConfig("file/dlp/config", filename, True, None, tid, 0, "")
        if tid == "":
            if resp.status_code == requests.codes.partial:
                respJson = resp.json()
                if "data" in respJson:
                    respData = respJson["data"]
                    tid = respData["tid"]
                    click.echo("[progress: {:3d}%] {}".format(respData["percentage"], respData["status"]))
        status = ""
        if tid != "":
            i = 1
            #click.echo("Info: import task transaction id is {}".format(tid))
            while resp.status_code == requests.codes.partial:
                time.sleep(2)
                resp = data.client.importConfig("file/dlp/config", filename, True, None, tid, i, "")
                respJson = resp.json()
                if "data" in respJson:
                    respData = respJson["data"]
                    if "status" in respData:
                        status = respData["status"]
                    if status != "":
                        click.echo("[progress: {:3d}%] {}".format(respData["percentage"], status))
                i = i + 1
            #click.echo("--------------------------")
            if resp.status_code == requests.codes.ok:
                respJson = resp.json()
                if "data" in respJson:
                    respData = respJson["data"]
                    if "status" in respData:
                        status = respData["status"]

        click.echo("")
        if resp.status_code == requests.codes.ok and status == "done":
            click.echo("Imported DLP sensors/rules {}.".format(click.format_filename(filename)))
        else:
            click.echo("[1] Error: Failed to import DLP sensors/rules {}".format(click.format_filename(filename)))
    except IOError:
        click.echo("")
        click.echo("[2] Error: Failed to import DLP sensors/rules %s" % click.format_filename(filename))
    click.echo("")

@request_import.command('waf')
@click.argument('filename', type=click.Path(dir_okay=False, exists=True, resolve_path=True))
@click.pass_obj
def import_waf(data, filename):
    """Import WAF sensors/rules."""
    try:
        tid = ""
        resp = data.client.importConfig("file/waf/config", filename, True, None, tid, 0, "")
        if tid == "":
            if resp.status_code == requests.codes.partial:
                respJson = resp.json()
                if "data" in respJson:
                    respData = respJson["data"]
                    tid = respData["tid"]
                    click.echo("[progress: {:3d}%] {}".format(respData["percentage"], respData["status"]))
        status = ""
        if tid != "":
            i = 1
            # click.echo("Info: import task transaction id is {}".format(tid))
            while resp.status_code == requests.codes.partial:
                time.sleep(2)
                resp = data.client.importConfig("file/waf/config", filename, True, None, tid, i, "")
                respJson = resp.json()
                if "data" in respJson:
                    respData = respJson["data"]
                    if "status" in respData:
                        status = respData["status"]
                    if status != "":
                        click.echo("[progress: {:3d}%] {}".format(respData["percentage"], status))
                i = i + 1
            # click.echo("--------------------------")
            if resp.status_code == requests.codes.ok:
                respJson = resp.json()
                if "data" in respJson:
                    respData = respJson["data"]
                    if "status" in respData:
                        status = respData["status"]

        click.echo("")
        if resp.status_code == requests.codes.ok and status == "done":
            click.echo("Imported WAF sensors/rules {}.".format(click.format_filename(filename)))
        else:
            click.echo("[1] Error: Failed to import WAF sensors/rules {}".format(click.format_filename(filename)))
    except IOError:
        click.echo("")
        click.echo("[2] Error: Failed to import WAF sensors/rules %s" % click.format_filename(filename))
    click.echo("")


@request_export.command()
@click.option("-e", "--enforcer", default="", help="enforcer to collect log from, default is all")
@click.option("-t", "--tail", default=0, help="number of lines to show from the end of debug logs ")
@click.option("-f", "--filename", default="/var/neuvector/nv_debug",
              type=click.Path(dir_okay=False, writable=True, resolve_path=True), \
              help="location to store the ouput")
@click.pass_obj
def debug(data, enforcer, tail, filename):
    """Request export debug """
    id = enforcer
    if enforcer != "":
        obj = utils.get_managed_object(data.client, "enforcer", "enforcer", enforcer)
        if obj:
            id = obj["id"]

    url = "file/debug"
    filter = ""
    if enforcer != "":
        filter += "f_enforcer=%s&" % id
    if tail != 0:
        filter += "f_tail=%d&" % tai
    if filter != "":
        filter = filter.rstrip("&")
        url += "?" + filter

    headers, body = data.client.download(url, None)
    clen = int(headers.get('Content-Length', '-1'))
    ctype, options = multipart.parse_options_header(headers.get("Content-Type"))
    boundary = options.get('boundary', '')
    if ctype != 'multipart/form-data' or not boundary:
        click.echo("Unsupported content type.")
        return

    if filename.endswith(".tar.gz") == False:
        filename += ".tar.gz"
    try:
        for part in multipart.MultipartParser(io.BytesIO(body.content), boundary, clen):
            if part.name == "debug" and part.content_type == "application/x-gzip":
                _write_part(part, filename)
                return
    except Exception as e:
        click.echo(e)


@request.group('license')
@click.pass_obj
def request_license(data):
    """Request license """


@request_license.command()
@click.option("--name", default="", help="user name")
@click.option("--email", default="", help="email")
@click.option("--phone", default="", help="phone")
@click.option("--months", default=1, help="duration in months")
@click.option("--node_limit", default=3, help="number of hosts supported")
@click.option("--cpu_limit", default=2, help="number of cpus supported")
@click.option("--multi_cluster_limit", default=0,
              help="number of managed clusters(excluding primary cluster) supported")
@click.option("--scan", default="disable", help="Allow container scan", type=click.Choice(['enable', 'disable']))
@click.option("--enforce", default="disable", help="Allow enforce mode", type=click.Choice(['enable', 'disable']))
@click.pass_obj
def generate(data, name, email, phone, months, node_limit, cpu_limit, multi_cluster_limit, scan, enforce, serverless):
    """Request license generation code"""

    scanAllowed = False
    if scan == "enable":
        scanAllowed = True

    enforceAllowed = False
    if enforce == "enable":
        enforceAllowed = True

    serverlsessAllowed = False
    if serverless == "enable":
        serverlessAllowed = True

    lc = {"name": name, "email": email, "phone": phone, "months": months,
          "node_limit": node_limit, "cpu_limit": cpu_limit, "multi_cluster_limit": multi_cluster_limit,
          "scan": scanAllowed, "enforce": enforceAllowed, "serverless": serverlessAllowed}
    reply = data.client.create("system/license/request", {"license_request": lc})
    click.echo("License code: %s" % reply["license_code"])


@request_license.command()
@click.argument("license")
@click.pass_obj
def load(data, license):
    """Load new license"""

    reply = data.client.create("system/license/update", {"license_key": license})
    if reply != None:
        _display_license(reply["license"]["info"])


@request_license.command()
@click.pass_obj
def delete(data):
    """Delete current license"""

    data.client.delete("system", "license")

@set_system.group('auto_mode')
@click.pass_obj
def set_system_config_atmo(data):
    """Set system auto mode upgrader configruation"""

@set_system_config_atmo.command("config")
@click.option("-p","--path", default="d2m", type=click.Choice(["d2m", "m2p"]), help="d2m: Discover to Monitor, m2p: Monitor to Protect")
@click.option("-e","--enable", default="false", type=click.Choice(["true", "false"]))
@click.option("-d","--duration", type=click.IntRange(300), default=600, help="in seconds, default: 600,")
@click.pass_obj
def set_system_atmo_config(data, path, enable, duration):
    """Set system auto mode upgrader."""
    enabled = False
    if enable == "true":
        enabled = True

    if path == "d2m":
        data.client.config_system_atmo(mode_auto_d2m=enabled, mode_auto_d2m_duration=duration)
    else:
        data.client.config_system_atmo(mode_auto_m2p=enabled, mode_auto_m2p_duration=duration)
