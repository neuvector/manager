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

RoleMapping = "role mapping"


def _get_mappable_roles(data, arg):
    mappable_roles = data.client.list("server", "mappable_role", **arg)
    mappable_default_roles = mappable_roles["default_roles"]
    mappable_group_roles = mappable_roles["group_roles"]
    mappable_group_domain_roles = mappable_roles["group_domain_roles"]
    mappable_default_roles.sort(key=roleSortFunc)
    mappable_group_roles.sort(key=roleSortFunc)
    mappable_group_domain_roles.sort(key=roleSortFunc)

    return mappable_default_roles, mappable_group_roles, mappable_group_domain_roles


def verify_default_role(data, arg, default_role):
    mappable_default_roles, mappable_group_roles, mappable_group_domain_roles = _get_mappable_roles(data, arg)
    if default_role not in mappable_default_roles:
        display_roles = []
        for r in mappable_default_roles:
            if r == "":
                r = "none"
            display_roles.append(r)

        click.echo("Invalid default role. Supported default roles: {}".format(', '.join(display_roles)))
        click.echo("")
        return False

    return True


def showMappableGlobalRoles(role, mappable_group_roles):
    display_roles = []
    for r in mappable_group_roles:
        if r == "":
            r = "none"
        display_roles.append(r)

    click.echo("Role {} is invalid for global domain. Supported roles for global domain: {}".format(role, ', '.join(
        display_roles)))
    click.echo("")


def showMappableDomainRoles(role, mappable_group_domain_roles):
    click.echo("Role {} is invalid for namespaces. Supported roles for namespaces: {}".format(role, ', '.join(
        mappable_group_domain_roles)))
    click.echo("")


# [4.1-] for role -> groups mapping
def verify_group_role(data, arg, role):
    mappable_default_roles, mappable_group_roles, mappable_group_domain_roles = _get_mappable_roles(data, arg)
    if role not in mappable_group_domain_roles:
        showMappableGlobalRoles(role, mappable_group_domain_roles)
        return False

    return True


# [4.2+] for supporting per-group's role -> domains mapping
def verify_group_role_ex(data, arg, group, global_role, role_domains):
    mappable_default_roles, mappable_group_roles, mappable_group_domain_roles = _get_mappable_roles(data, arg)
    if global_role not in mappable_group_roles:
        showMappableGlobalRoles(global_role, mappable_group_roles)
        return False
    for role in role_domains:
        if role not in mappable_group_domain_roles:
            showMappableDomainRoles(role, mappable_group_domain_roles)
            return False

    return True


def _show_role_mapping_display_format(server, server_type):
    server[RoleMapping] = ""
    # if server.get(server_type) and server[server_type].get("role_groups"):
    if server.get(server_type) and server[server_type].get("group_mapped_roles"):
        aaa = server[server_type].get("group_mapped_roles")
        mlist = []
        for mapped_roles in server[server_type]["group_mapped_roles"]:
            mlist.append("group: %s" % mapped_roles["group"])
            if mapped_roles["global_role"] != "":
                mlist.append("   global domain -> %s" % (mapped_roles["global_role"]))
            if "role_domains" in mapped_roles:
                for role, domains in mapped_roles["role_domains"].iteritems():
                    mlist.append("   namespace(s) %s -> %s" % (",".join(domains), role))
        server[RoleMapping] = "\n".join(mlist)


@show.group("server")
@click.pass_obj
def show_server(data):
    """Show server."""


def roleSortFunc(p):
    return p


@show_server.command("mappable_roles")
@click.pass_obj
def show_server_mappable_roles(data):
    """Show mappable roles for servers."""
    arg = {"type": "ldap"}
    mappable_default_roles, mappable_group_roles, mappable_group_domain_roles = _get_mappable_roles(data, arg)
    for index in range(len(mappable_default_roles)):
        if mappable_default_roles[index] == "":
            mappable_default_roles[index] = "none"
    for index in range(len(mappable_group_roles)):
        if mappable_group_roles[index] == "":
            mappable_group_roles[index] = "none"

    click.echo("")
    click.echo("Supported default roles: {}".format(', '.join(mappable_default_roles)))
    click.echo("")
    click.echo("Supported mappable roles to global domain for group: {}".format(', '.join(mappable_group_roles)))
    click.echo("")
    click.echo("Supported mappable roles to namespaces for group: {}".format(', '.join(mappable_group_domain_roles)))
    click.echo("")


@show_server.command("ldap")
@click.pass_obj
def show_server_ldap(data):
    """Show ldap servers."""
    arg = {"type": "ldap"}
    servers = data.client.list("server", "server", **arg)
    for s in servers:
        output.lift_fields(s, "ldap", (
            "directory", "hostname", "port", "base_dn", "ssl", "bind_dn", "enable", "group_member_attr",
            "username_attr",
            "default_role"))
        _show_role_mapping_display_format(s, "ldap")

    click.echo("Total LDAP servers: %s" % len(servers))
    columns = (
        "server_name", "enable", "directory", "hostname", "port", "base_dn", "ssl", "bind_dn", "group_member_attr",
        "username_attr", "default_role", RoleMapping)
    output.list(columns, servers)


@show_server.command("saml")
@click.pass_obj
def show_server_saml(data):
    """Show saml servers."""
    arg = {"type": "saml"}
    servers = data.client.list("server", "server", **arg)
    for s in servers:
        output.lift_fields(s, "saml", ("sso_url", "issuer", "enable", "default_role"))
        _show_role_mapping_display_format(s, "saml")

    click.echo("Total SAML servers: %s" % len(servers))
    columns = ("sso_url", "issuer", "enable", "default_role", RoleMapping)
    output.list(columns, servers)


@show_server.command("oidc")
@click.pass_obj
def show_server_oidc(data):
    """Show OpenID Connect servers."""
    arg = {"type": "oidc"}
    servers = data.client.list("server", "server", **arg)
    for s in servers:
        output.lift_fields(s, "oidc", (
            "issuer", "authorization_endpoint", "token_endpoint", "user_info_endpoint", "enable", "default_role"))
        _show_role_mapping_display_format(s, "oidc")

    click.echo("Total OpenID Connect servers: %s" % len(servers))
    columns = ("issuer", "authorization_endpoint", "token_endpoint", "user_info_endpoint", "enable", "default_role")
    output.list(columns, servers)


@show_server.command("detail")
@click.argument("name")
@click.pass_obj
def show_server_detail(data, name):
    """Show server detail."""
    server = data.client.show("server", "server", name)

    if server["server_type"] == "ldap":
        output.lift_fields(server, "ldap",
                           ("directory", "hostname", "port", "base_dn", "ssl", "bind_dn", "enable", "default_role"))
        _show_role_mapping_display_format(server, "ldap")
        columns = (
            "server_name", "enable", "directory", "hostname", "port", "base_dn", "ssl", "bind_dn", "default_role",
            RoleMapping)
        output.show(columns, server)
    elif server["server_type"] == "saml":
        output.lift_fields(server, "saml", ("sso_url", "issuer", "enable", "default_role"))
        _show_role_mapping_display_format(server, "saml")
        columns = ("sso_url", "issuer", "enable", "default_role", RoleMapping)
        output.show(columns, server)
    elif server["server_type"] == "oidc":
        output.lift_fields(server, "oidc", (
            "issuer", "authorization_endpoint", "token_endpoint", "user_info_endpoint", "enable", "default_role"))
        columns = ("issuer", "authorization_endpoint", "token_endpoint", "user_info_endpoint", "enable", "default_role")
        output.show(columns, server)


@show_server.command("user")
@click.argument("name")
@click.pass_obj
def show_server_user(data, name):
    """Show server user."""
    users = data.client.list("server/%s/user" % name, "user")
    for u in users:
        utils.user_role_domains_display_format(u)

    columns = ("username", "role", "email", "timeout", "locale", utils.RoleDomains)
    output.list(columns, users)


@create.group("server")
@click.pass_obj
def create_server(data):
    """Create server."""


@create_server.command("oidc")
@click.argument("name")
@click.argument("issuer")
@click.argument("client_id")
@click.argument("client_secret")
@click.option("--enable/--disable", default=True, is_flag=True, help="Enable/Disable the server")
@click.option("--default_role", default='', help="admin, reader, none, or any custom role")
@click.option('--scopes', '-s', multiple=True)
@click.option('--group_claim', help="Custom group claim")
@click.pass_obj
def create_server_oidc(data, name, issuer, client_id, client_secret, enable, default_role, scopes, group_claim):
    """Create OpenID Connect server."""
    if default_role == "none":
        default_role = ""
    arg = {"type": "oidc"}
    if verify_default_role(data, arg, default_role) is False:
        return
    oidc = {
        "issuer": issuer, "client_id": client_id, "client_secret": client_secret,
        "enable": enable, "default_role": default_role,
    }
    if scopes:
        oidc["scopes"] = scopes
    if group_claim:
        oidc["group_claim"] = group_claim

    data.client.create("server", {"config": {"name": name, "oidc": oidc}})


@create_server.command("ldap")
@click.argument("name")
@click.argument("hostname")
@click.argument("base")
@click.option("--enable/--disable", default=True, is_flag=True, help="Enable/Disable the server")
@click.option("--default_role", default='', help="admin, reader, none, or any custom role")
@click.option("--directory", default='OpenLDAP', type=click.Choice(['OpenLDAP', 'MicrosoftAD']), help="Directory type")
@click.option("--port", type=int, help="Server port, default is 389")
@click.option("--ssl", default=False, is_flag=True, help="Enable SSL")
@click.option("--group_member_attr", help="Group members attribute")
@click.option("--username_attr", help="Username attribute")
@click.option("--bind", help="Bind distinguish name")
@click.pass_obj
def create_server_ldap(data, name, hostname, base, enable, default_role, directory, port, ssl, group_member_attr,
                       username_attr, bind):
    """Create LDAP server."""
    if default_role == "none":
        default_role = ""
    arg = {"type": "ldap"}
    if verify_default_role(data, arg, default_role) is False:
        return
    ldap = {
        "hostname": hostname, "base_dn": base, "ssl": ssl,
        "enable": enable, "default_role": default_role, "directory": directory,
        "group_member_attr": group_member_attr,
        "username_attr": username_attr,
    }
    if port != None:
        ldap["port"] = port
    if bind != None:
        ldap["bind_dn"] = bind

        pass1 = click.prompt("Bind Password", hide_input=True)
        pass2 = click.prompt("Confirm Bind Password", hide_input=True)
        if pass1 != pass2:
            click.echo("Passwords do not match")
            return
        ldap["bind_password"] = pass1

    data.client.create("server", {"config": {"name": name, "ldap": ldap}})


# set

@set.group("server")
@click.pass_obj
def set_server(data):
    """Set server configuration."""


@set_server.group("oidc")
@click.argument('name')
@click.pass_obj
@click.pass_context
def set_server_oidc(ctx, data, name):
    """Set OpenID Connect server."""
    data.id_or_name = name


@set_server_oidc.command("config")
@click.option("--issuer", help="Server URL")
@click.option("--client_id", help="Client ID")
@click.option("--client_secret", help="Client secret")
@click.option('--scopes', '-s', multiple=True)
@click.option('--group_claim', help="Custom group claim")
@click.option("--enable/--disable", default=None, is_flag=True, help="Enable/Disable the server")
@click.option("--default_role", default=None, help="admin, reader, none, or any custom role")
@click.pass_obj
def set_server_oidc_config(data, issuer, client_id, client_secret, scopes, group_claim, enable, default_role):
    """Set OpenID Connect server."""
    oidc = {}
    doit = False
    if enable != None:
        doit = True
        oidc["enable"] = enable
    if default_role != None:
        doit = True
        if default_role == "none":
            default_role = ""
        arg = {"type": "oidc"}
        if verify_default_role(data, arg, default_role) is False:
            return
        oidc["default_role"] = default_role
    if issuer != None:
        doit = True
        oidc["issuer"] = issuer
    if client_id != None:
        doit = True
        oidc["client_id"] = client_id
    if client_secret != None:
        doit = True
        oidc["client_secret"] = client_secret
    if scopes:
        doit = True
        oidc["scopes"] = scopes
    if group_claim:
        doit = True
        oidc["group_claim"] = group_claim

    if doit:
        server = {"name": data.id_or_name, "oidc": oidc}
        data.client.config("server", data.id_or_name, {"config": server})
    else:
        click.echo("Please specify configurations to be set.")


@set_server.group("ldap")
@click.argument('name')
@click.pass_obj
@click.pass_context
def set_server_ldap(ctx, data, name):
    """Set LDAP server."""
    data.id_or_name = name


@set_server_ldap.command("config")
@click.option("--hostname", help="Server hostname or IP")
@click.option("--base", help="LDAP server base DN")
@click.option("--enable/--disable", default=None, is_flag=True, help="Enable/Disable the server")
@click.option("--default_role", default=None, help="admin, reader, none, or any custom role")
@click.option("--directory", default=None, type=click.Choice(['OpenLDAP', 'MicrosoftAD']), help="Directory type")
@click.option("--port", type=int, help="Server port, default is 389")
@click.option("--ssl", type=click.Choice(['enable', 'disable']))
@click.option("--group_member_attr", default=None, help="Group members attribute")
@click.option("--username_attr", default=None, help="Username attribute")
@click.option("--bind", help="Bind distinguish name")
@click.pass_obj
def set_server_ldap_config(data, hostname, base, enable, default_role, directory, port, ssl, group_member_attr,
                           username_attr, bind):
    """Set LDAP server configuration."""
    ldap = {}
    doit = False
    if hostname != None:
        doit = True
        ldap["hostname"] = hostname
    if base != None:
        doit = True
        ldap["base_dn"] = base
    if enable != None:
        doit = True
        ldap["enable"] = enable
    if default_role != None:
        doit = True
        if default_role == "none":
            default_role = ""
        arg = {"type": "ldap"}
        if verify_default_role(data, arg, default_role) is False:
            return
        ldap["default_role"] = default_role
    if directory != None:
        doit = True
        ldap["directory"] = directory
    if port != None:
        doit = True
        ldap["port"] = port
    if ssl != None:
        doit = True
        ldap["ssl"] = True if ssl == 'enable' else False
    if group_member_attr != None:
        doit = True
        ldap["group_member_attr"] = group_member_attr
    if username_attr != None:
        doit = True
        ldap["username_attr"] = username_attr
    if bind != None:
        doit = True
        ldap["bind_dn"] = bind

        pass1 = click.prompt("Bind Password", hide_input=True)
        pass2 = click.prompt("Confirm Bind Password", hide_input=True)
        if pass1 != pass2:
            click.echo("Passwords do not match")
            return
        ldap["bind_password"] = pass1

    if doit:
        server = {"name": data.id_or_name, "ldap": ldap}
        data.client.config("server", data.id_or_name, {"config": server})
    else:
        click.echo("Please specify configurations to be set.")


@set_server_ldap.command("role")
@click.argument('role', required=True)
@click.option('--group', '-g', multiple=True, help="Groups mapped to the role.")
@click.pass_obj
def set_server_ldap_role(data, role, group):
    """Set LDAP server role group mapping (deprecated). See: set server ldap NAME group_role"""
    arg = {"type": "ldap"}
    if verify_group_role(data, arg, role) is False:
        return

    if len(group) > 0:
        role_group = {"name": data.id_or_name, "role": role, "groups": group}
        data.client.config("server", "%s/role/%s" % (data.id_or_name, role), {"config": role_group})
    else:
        click.echo("Please specify at least one group.")


@set_server_ldap.command("group_role")
@click.option('--group', required=True, help="Group name.")
@click.option('--global_role', required=False, help="Group's mapped role for global domain.")
@click.option('--role_domains', multiple=True,
              help="Group's mapped role for namespaces. Format: {role}:{namespace1,namespace2,...}")
@click.pass_obj
def set_server_ldap_group_role(data, group, global_role, role_domains):
    """Set one group's role mapping of an LDAP server."""
    arg = {"type": "ldap"}
    if global_role is None:
        global_role = ""
    if global_role == "none":
        global_role = ""

    mapped_roles = {"group": group, "global_role": global_role}
    roleDomains = {}
    for one_role_domains in role_domains:
        list = one_role_domains.split(":")
        if len(list) == 2:
            domains = []
            for domain in list[1].split(","):
                domains.append(domain)
            roleDomains[list[0]] = domains

    if verify_group_role_ex(data, arg, group, global_role, roleDomains) is False:
        return

    mapped_roles["role_domains"] = roleDomains
    group_role_domains = {"name": data.id_or_name, "mapped_roles": mapped_roles}
    data.client.config("server", "%s/group/%s" % (data.id_or_name, group), {"config": group_role_domains})


@set_server_ldap.command("group_mapping_order")
@click.option('--group', multiple=True, help="Group name in role matching order.")
@click.pass_obj
def set_server_ldap_groups_mapping_order(data, group):
    """Set the matching order of groups' roles mapping of LDAP server. Unspecified groups are ordered after specified
    groups in their original sequence. Groups that have fedAdmin/fedReader role mapping for global domain have higher
    priority """
    groups_order = {"name": data.id_or_name, "groups": group}
    data.client.config("server", "%s/groups" % (data.id_or_name), {"config": groups_order})


# unset

@unset.group("server")
@click.pass_obj
def unset_server(data):
    """Unset server configuration."""


@unset_server.group('ldap')
@click.argument('name')
@click.pass_obj
@click.pass_context
def unset_server_ldap(ctx, data, name):
    """Unset LDAP server."""
    data.id_or_name = name


@unset_server_ldap.command("config")
@click.option("--port", is_flag=True, help="Unset port")
@click.option("--bind", is_flag=True, help="Remove bind DN")
@click.pass_obj
def unset_server_ldap_config(data, port, bind):
    """Unset LDAP configuration."""
    ldap = {}
    unset = False
    if port is not None:
        unset = True
        ldap["port"] = 0
    if bind != None:
        unset = True
        ldap["bind_dn"] = ""
        ldap["bind_password"] = ""

    if unset:
        server = {"name": data.id_or_name, "ldap": ldap}
        data.client.config("server", data.id_or_name, {"config": server})
    else:
        click.echo("Please specify configurations to be unset.")


@unset_server_ldap.command("role")
@click.argument('role', required=True)
@click.pass_obj
def unset_server_ldap_role(data, role):
    """Unset LDAP server role group mapping (deprecated). See: unset server ldap NAME group_role"""
    arg = {"type": "ldap"}
    if verify_group_role(data, arg, role) is False:
        return

    role_group = {"name": data.id_or_name, "role": role}
    data.client.config("server", "%s/role/%s" % (data.id_or_name, role), {"config": role_group})


@unset_server_ldap.command("group_role")
@click.option('--group', required=True, help="Group name.")
@click.pass_obj
def unset_server_ldap_group_role(data, group):
    """Unset one group's domain roles mapping of LDAP server."""
    mapped_roles = {"group": group}
    group_role_domains = {"name": data.id_or_name, "group": group, "mapped_roles": mapped_roles}
    data.client.config("server", "%s/group/%s" % (data.id_or_name, group), {"config": group_role_domains})


# delete

@delete.command('server')
@click.argument('name')
@click.pass_obj
def delete_server(data, name):
    """Delete server."""
    data.client.delete("server", name)


@request.group('server')
@click.pass_obj
def request_server(data):
    """Request server"""


@request_server.group("ldap")
@click.pass_obj
def request_server_ldap(data):
    """Request server LDAP"""


@request_server_ldap.command("test")
@click.argument('name')
@click.argument('username')
@click.option('-p', '--password', prompt='Password', hide_input=True)
@click.pass_obj
def request_server_ldap_test(data, name, username, password):
    """Test LDAP server authentication."""
    test = {"username": username, "password": password}
    resp = data.client.request("debug", "server", "test", {"test": {"name": name, "test_ldap": test}})

    if resp is None:
        click.echo("Server test succeeded.")
    else:
        click.echo("Server test failed.")
