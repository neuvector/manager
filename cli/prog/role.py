import click

from prog.cli import cli
from prog.cli import set
from prog.cli import create
from prog.cli import delete
from prog.cli import show
from prog import client
from prog import output

GlobalPermissionOptions = None
DomainPermissionOptions = None


# -- role

def getPermissionOptions(data):
    global GlobalPermissionOptions
    global DomainPermissionOptions

    options = data.client.show("user_role_permission/options", "options", None)
    if options:
        pOptions = {}
        global_options = options["global_options"]
        for option in global_options:
            if option["read_supported"] is True:
                option["view supported"] = True
            else:
                option["view supported"] = False
            if option["write_supported"] is True:
                option["modify supported"] = True
            else:
                option["modify supported"] = False
            pOptions[option["id"]] = option
        GlobalPermissionOptions = pOptions

        pOptions = {}
        domain_options = options["domain_options"]
        for option in domain_options:
            if option["read_supported"] is True:
                option["view supported"] = True
            else:
                option["view supported"] = False
            if option["write_supported"] is True:
                option["modify supported"] = True
            else:
                option["modify supported"] = False
            pOptions[option["id"]] = option
        DomainPermissionOptions = pOptions

        return global_options, domain_options
    return None, None


def user_role_permission_display_format(role):
    global GlobalPermissionOptions
    global DomainPermissionOptions

    if role["permissions"]:
        permissions = role["permissions"]
        plist = []
        for p in permissions:
            if p["id"] in GlobalPermissionOptions:
                option = GlobalPermissionOptions[p["id"]]
                r = ""
                w = ""
                if option["read_supported"] is True:
                    if p["read"] is True:
                        r = "Y"
                    elif p["read"] is False:
                        r = "N"
                else:
                    r = "N/A"
                if option["write_supported"] is True:
                    if p["write"] is True:
                        w = "Y"
                    elif p["write"] is False:
                        w = "N"
                else:
                    w = "N/A"
                plist.append("{0: <18}  {1: <19}   {2: <20}".format(p["id"], r, w))
        role["permissions"] = "\n".join(plist)


def getPermissions(data, permissions):
    global GlobalPermissionOptions
    global DomainPermissionOptions

    if GlobalPermissionOptions is None or DomainPermissionOptions is None:
        getPermissionOptions(data)

    plist = []
    ops = {"r": "r", "w": "w", "rw": "rw"}
    for permission in permissions:
        p2 = permission.split(":")
        if (len(p2) != 2) or (p2[1] not in ops):
            return None, "invalid permission format: {}".format(permission)
        p = {"read": False, "write": False}
        id = p2[0]
        if id in GlobalPermissionOptions:
            option = GlobalPermissionOptions[id]
            if p2[1] == "r" or p2[1] == "rw":
                if option["read_supported"] is False:
                    return None, "unsupported read permission: {}".format(permission)
                p["read"] = True
            if p2[1] == "w" or p2[1] == "rw":
                if option["write_supported"] is False:
                    return None, "unsupported write permission: {}".format(permission)
                p["write"] = True
            if (p["read"] is True) or (p["write"] is True):
                p["id"] = id
                plist.append(p)
        else:
            return None, "invalid permission: {}".format(permission)

    return plist, ""


def GetUserGlobalRoleOptions(data):
    roles = data.client.show("user_role", "roles", None)
    user_roles = []
    hasNone = False
    for role in roles:
        user_roles.append(role["name"])
        if role["name"] == "":
            hasNone = True
    if not hasNone:
        user_roles.append("")
    return user_roles


@show.group('role', invoke_without_command=True)
@click.pass_obj
@click.pass_context
def show_role(ctx, data):
    """Show user roles."""
    if ctx.invoked_subcommand is not None:
        return

    roles = data.client.show("user_role", "roles", None)
    click.echo("")
    columns = ("name", "reserved", "comment")
    click.echo("Roles:")
    output.list(columns, roles)


@show_role.command()
@click.argument("name")
@click.pass_obj
def detail(data, name):
    """Show user role details."""
    global GlobalPermissionOptions
    global DomainPermissionOptions

    if GlobalPermissionOptions is None or DomainPermissionOptions is None:
        getPermissionOptions(data)

    role = data.client.show("user_role", "role", name)
    user_role_permission_display_format(role)
    pHeader = "{0: <18}  {1: <19}   {2: <20}".format("permission", "view", "modify")
    columns = ("name", "reserved", "comment", pHeader)
    role[pHeader] = role["permissions"]
    _roles = []
    _roles.append(role)
    output.list(columns, _roles)


@show_role.command()
@click.pass_obj
def permissions(data):
    """Show permissions."""

    global_options, domain_options = getPermissionOptions(data)
    click.echo("")
    columns = ("id", "view supported", "modify supported")
    if global_options is not None:
        click.echo("Permissions that are supported in user's role:")
        output.list(columns, global_options)
    if domain_options is not None:
        click.echo("Permissions that are supported in user's domain role(s):")
        output.list(columns, domain_options)


# --

@create.command('role')
@click.option('--name', required=True, help="role name")
@click.option('--comment', required=True, help="role comment")
@click.option('--permissions', required=True, multiple=True, help="each permission is in {id}:r or {id}:w or {id}:rw")
@click.pass_obj
def create_role(data, name, comment, permissions):
    """Create user role."""

    role = {"name": name}
    if comment is not None:
        role["comment"] = comment
    role["permissions"], errMsg = getPermissions(data, permissions)
    if len(errMsg) > 0:
        click.echo(errMsg)
    else:
        data.client.create("user_role", {"config": role})


# --

@set.command('role')
@click.option('--name', required=True, help="role name")
@click.option('--comment', required=True, help="role comment")
@click.option('--permissions', required=True, multiple=True, help="role permissions")
@click.pass_obj
def set_role(data, name, comment, permissions):
    """Set local role configuration."""

    role = {"name": name}
    if comment is not None:
        role["comment"] = comment
    role["permissions"], errMsg = getPermissions(data, permissions)
    if len(errMsg) > 0:
        click.echo(errMsg)
    else:
        data.client.config("user_role", name, {"config": role})


# --

@delete.command('role')
@click.option('--name', required=True, help="role name")
@click.pass_obj
def delete_role(data, name):
    """Delete user role."""
    data.client.delete("user_role", name)
