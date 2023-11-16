import click
import datetime

from prog.cli import cli
from prog.cli import set
from prog.cli import unset
from prog.cli import create
from prog.cli import delete
from prog.cli import show
from prog.role import GetUserGlobalRoleOptions
from prog import client
from prog import output
from prog import utils

DEFAULT_PWD_WARNING = "The administrative account is using the default password. This is a security risk. It is recommended that you change the default password for this account.\n"


def user_blocked_format(u):
    u["blocked for login"] = ""
    u["password expired"] = ""
    if "blocked_for_failed_login" in u and u["blocked_for_failed_login"] is True:
        u["blocked for login"] = "Y"
    if "blocked_for_password_expired" in u and u["blocked_for_password_expired"] is True:
        u["password expired"] = "Y"


def password_resettable_format(u):
    if "password_resettable" in u and u["password_resettable"] is True:
        u["password resettable"] = "Y"
    else:
        u["password resettable"] = "N"


@cli.command()
@click.option('--username', prompt=True)
@click.option('--password', prompt='Password', hide_input=True)
@click.pass_obj
def login(data, username, password):
    """Login and obtain an authentication token."""
    if data.username:
        click.echo("Error: logout current user before login")
        return

    try:
        token, password_days_until_expire, need_to_reset_password = data.client.login(username, password, "")

        if need_to_reset_password:
            click.echo("You need to change your password")
            click.echo("")
            newPass1 = click.prompt("New Password", hide_input=True)
            newPass2 = click.prompt("Confirm New Password", hide_input=True)
            if newPass1 != newPass2:
                click.echo("New passwords do not match")
                return
            token, password_days_until_expire, need_to_reset_password = data.client.login(username, password, newPass1)

        if token.get("default_password"):
            click.echo(DEFAULT_PWD_WARNING)
    except client.RestException as e:
        click.echo("Error: " + e.msg)
        return

    data.username = username
    msg = "\nYour password will expire in less than a day.\nPlease change your password immediately!\n"
    if password_days_until_expire > 0:
        msg = "Your password will expire after {} day(s).\n".format(password_days_until_expire)
    if password_days_until_expire >= 0:
        click.echo(msg)


@cli.command()
@click.pass_obj
def logout(data):
    """Clear local authentication credentials."""
    data.client.logout()
    data.username = None


@cli.command()
@click.pass_obj
def exit(data):
    """Exit CLI."""
    try:
        data.client.logout()
    except client.RestException:
        pass
    data.username = None


# -- user

@show.group('user', invoke_without_command=True)
@click.pass_obj
@click.pass_context
def show_user(ctx, data):
    """Show user."""
    if ctx.invoked_subcommand is not None:
        return

    users = data.client.list("user", "user")
    for u in users:
        utils.user_role_domains_display_format(u)
        user_blocked_format(u)
        password_resettable_format(u)

    columns = (
    "username", "server", "role", "email", "timeout", "locale", utils.RoleDomains, "last_login_at", "login_count",
    "blocked for login", "password expired", "password resettable")
    output.list(columns, users)


@show_user.command()
@click.argument("username")
@click.pass_obj
def detail(data, username):
    """Show user detail."""
    user = data.client.show("user", "user", username)
    utils.user_role_domains_display_format(user)
    user_blocked_format(user)
    password_resettable_format(user)

    columns = (
    "username", "server", "role", "email", "timeout", "locale", utils.RoleDomains, "last_login_at", "login_count",
    "blocked for login", "password expired", "password resettable")
    output.show(columns, user)


# --

@create.group('user')
@click.pass_obj
def create_user(data):
    """Create user."""


@create_user.command("local")
@click.argument('username')
@click.option('--global_role')
@click.option('--email')
@click.option('--locale')
@click.option('--password', prompt='Password', hide_input=True)
@click.option('--password2', prompt='Confirm Password', hide_input=True)
@click.pass_obj
def create_user_local(data, username, global_role, email, locale, password, password2):
    """Create local user."""
    roles = GetUserGlobalRoleOptions(data)
    if global_role not in roles:
        supported_roles = []
        for r in roles:
            if r == "":
                r = "\"\""
            supported_roles.append(r)
        click.echo("Invalid role. Supported global role: {}".format(', '.join(supported_roles)))
        click.echo("")
        return

    if password != password2:
        click.echo("Passwords do not match")
        return

    user = {"fullname": username, "password": password}
    if global_role != None:
        user["role"] = global_role
    if email != None:
        user["email"] = email
    if locale != None:
        user["locale"] = locale
    data.client.create("user", {"user": user})


@set.group('user')
@click.pass_obj
def set_user(data):
    """Set user configuration."""


@set_user.group("local")
@click.argument('username')
@click.pass_obj
@click.pass_context
def set_user_local(ctx, data, username):
    """Set local user."""
    data.id_or_name = username


@set_user_local.command("config")
@click.option('--global_role')
@click.option('--timeout', type=click.IntRange(30, 3600), help="Set user idle time in seconds (30 ~ 3600).")
@click.option('--email')
@click.option('--locale')
@click.option('--password', is_flag=True)
@click.pass_obj
def set_user_local_config(data, global_role, timeout, email, locale, password):
    """Set local user configuration."""

    user = {"fullname": data.id_or_name}
    doit = False
    doitPassword = False
    if global_role != None:
        roles = GetUserGlobalRoleOptions(data)
        if global_role not in roles:
            click.echo("Invalid role")
            return

        doit = True
        user["role"] = global_role
    if timeout != None:
        doit = True
        user["timeout"] = timeout
    if email != None:
        doit = True
        user["email"] = email
    if locale != None:
        doit = True
        user["locale"] = locale
    if password == True:
        if data.username == data.id_or_name:
            # set currrent login user's password
            current = click.prompt("Current Password", hide_input=True)
        pass1 = click.prompt("New Password", hide_input=True)
        pass2 = click.prompt("Confirm Password", hide_input=True)
        if pass1 != pass2:
            click.echo("Passwords do not match")
            return

        doitPassword = True
        if data.username == data.id_or_name:
            user["password"] = current
        user["new_password"] = pass1

    if (not doit) and (not doitPassword):
        click.echo("Please specify configurations to be set.")
    else:
        if data.username == data.id_or_name:
            data.client.config("user", data.id_or_name, {"config": user})
        else:
            if doit:
                data.client.config("user", data.id_or_name, {"config": user})
            else:
                # this api allows resetting another user's password if it has been expired
                data.client.create("user/{}/password".format(data.id_or_name), {"config": user})


@set_user_local.command("role")
@click.argument('role')
@click.option('--domain', '-d', multiple=True, help="Domains of the role.")
@click.pass_obj
def set_user_local_role(data, role, domain):
    """Set user role domain access control. Users with global role fedAdmin cannot be assined domain roles."""

    if len(domain) > 0:
        user = {"fullname": data.id_or_name, "role": role, "domains": domain}
        data.client.config("user", "%s/role/%s" % (data.id_or_name, role), {"config": user})
    else:
        click.echo("Please specify at least one domain.")


@set_user_local.command("unblock")
@click.pass_obj
def set_user_local_unblock(data):
    """Unblock local user so that login is allowed immediately."""

    cfg = {"fullname": data.id_or_name, "clear_failed_login": True}
    data.client.create("user/{}/password".format(data.id_or_name), {"config": cfg})


@set_user_local.command("reset_password")
@click.option('--change_password_in_next_login', is_flag=True, help="change password in next login")
@click.pass_obj
def set_user_local_rest_password(data, change_password_in_next_login):
    """Reset local user's password."""

    pass1 = click.prompt("New Password", hide_input=True)
    pass2 = click.prompt("Confirm New Password", hide_input=True)
    if pass1 != pass2:
        click.echo("New Passwords do not match")
        return

    cfg = {"fullname": data.id_or_name, "force_reset_password": True}
    if change_password_in_next_login:
        cfg["reset_password_in_next_login"] = True
    cfg["new_password"] = pass1
    data.client.create("user/{}/password".format(data.id_or_name), {"config": cfg})


@unset.group('user')
@click.pass_obj
def unset_user(data):
    """Unset user configuration."""


@unset_user.group("local")
@click.argument('username')
@click.pass_obj
@click.pass_context
def unset_user_local(ctx, data, username):
    """Unset local user."""
    data.id_or_name = username


@unset_user_local.command("config")
@click.option('--global_role', is_flag=True, help="Unset user global role")
@click.option('--timeout', is_flag=True, help="Unset user idle timeout")
@click.option('--email', is_flag=True, help="Unset user email")
@click.pass_obj
def unset_user_local_config(data, global_role, timeout, email):
    """Unset user configurations."""
    user = {"fullname": data.id_or_name}
    doit = False
    if global_role == True:
        doit = True
        user["role"] = ""
    if timeout == True:
        doit = True
        user["timeout"] = 0
    if email == True:
        doit = True
        user["email"] = ""

    if doit:
        data.client.config("user", data.id_or_name, {"config": user})
    else:
        click.echo("Please specify configurations to be unset.")


@unset_user_local.command("role")
@click.argument('role')
@click.pass_obj
def unset_user_local_role(data, role):
    """Unset user role domain access control."""

    role, valid = verify_role_for_domain(data, role)
    if valid is False:
        return

    if not utils.is_fed_master(data):
        click.echo("Error: This operation is allowed only on primary cluster in a federation")
        return

    user = {"fullname": data.id_or_name, "role": role}
    data.client.config("user", "%s/role/%s" % (data.id_or_name, role), {"config": user})


@delete.group('user')
@click.pass_obj
def delete_user(data):
    """Delete user."""


@delete_user.command('local')
@click.argument('username')
@click.pass_obj
def delete_user_local(data, username):
    """Delete local user."""
    data.client.delete("user", username)


# -- remote

@set_user.group("remote")
@click.argument('username')
@click.argument('server')
@click.pass_obj
@click.pass_context
def set_user_remote(ctx, data, username, server):
    """Set remote user."""
    data.id_or_name = username
    data.server = server


@set_user_remote.command("config")
@click.option('--global_role')
@click.option('--timeout', type=click.IntRange(30, 3600), help="Set user idle time in seconds (30 ~ 3600).")
@click.option('--email')
@click.option('--locale')
@click.pass_obj
def set_user_remote_config(data, global_role, timeout, email, locale):
    """Set remote user configuration."""

    fullname = "%s:%s" % (data.server, data.id_or_name)
    user = {"fullname": fullname}
    doit = False
    if global_role != None:
        roles = GetUserGlobalRoleOptions(data)
        if global_role not in roles:
            click.echo("Invalid role")
            return

        doit = True
        user["role"] = global_role
    if timeout != None:
        doit = True
        user["timeout"] = timeout
    if email != None:
        doit = True
        user["email"] = email
    if locale != None:
        doit = True
        user["locale"] = locale

    if doit:
        data.client.config("user", fullname, {"config": user})
    else:
        click.echo("Please specify configurations to be set.")


@set_user_remote.command("role")
@click.argument('role')
@click.option('--domain', '-d', multiple=True, help="Domains of the role.")
@click.pass_obj
def set_user_remote_role(data, role, domain):
    """Set user role domain access control."""

    role, valid = verify_role_for_domain(data, role)
    if valid is False:
        return

    fullname = "%s:%s" % (data.server, data.id_or_name)
    if len(domain) > 0:
        user = {"fullname": fullname, "role": role, "domains": domain}
        data.client.config("user", "%s/role/%s" % (data.id_or_name, role), {"config": user})
    else:
        click.echo("Please specify at least one domain.")


@unset_user.group("remote")
@click.argument('username')
@click.argument('server')
@click.pass_obj
@click.pass_context
def unset_user_remote(ctx, data, username, server):
    """Unset remote user."""
    data.id_or_name = username
    data.server = server


@unset_user_remote.command("config")
@click.option('--global_role', is_flag=True, help="Unset user global role")
@click.option('--timeout', is_flag=True, help="Unset user idle timeout")
@click.option('--email', is_flag=True, help="Unset user email")
@click.pass_obj
def unset_user_remote_config(data, global_role, timeout, email):
    """Unset user configurations."""
    fullname = "%s:%s" % (data.server, data.id_or_name)
    user = {"fullname": fullname}
    doit = False
    if global_role == True:
        doit = True
        user["role"] = ""
    if timeout == True:
        doit = True
        user["timeout"] = 0
    if email == True:
        doit = True
        user["email"] = ""

    if doit:
        data.client.config("user", fullname, {"config": user})
    else:
        click.echo("Please specify configurations to be unset.")


@unset_user_remote.command("role")
@click.argument('role', type=click.Choice(['admin', 'reader']))
@click.pass_obj
def unset_user_remote_role(data, role):
    """Unset user role domain access control."""

    role, valid = verify_role_for_domain(data, role)
    if valid is False:
        return

    fullname = "%s:%s" % (data.server, data.id_or_name)
    user = {"fullname": fullname, "role": role}
    data.client.config("user", "%s/role/%s" % (data.id_or_name, role), {"config": user})


@delete_user.command('remote')
@click.argument('username')
@click.argument('server')
@click.pass_obj
def delete_user_remote(data, username, server):
    """Delete remote user."""
    user = "%s:%s" % (server, username)
    data.client.delete("user", user)


# -- apikey

@show.group('apikey', invoke_without_command=True)
@click.pass_obj
@click.pass_context
def show_apikey(ctx, data):
    """Show API key."""
    if ctx.invoked_subcommand is not None:
        return

    users = data.client.list("api_key", "apikey")
    for u in users:
        utils.user_role_domains_display_format(u)
        user_blocked_format(u)

    columns = ("apikey_name", "description", "expiration_type", "role", utils.RoleDomains)
    output.list(columns, users)


@show_apikey.command()
@click.argument("apikey_name")
@click.pass_obj
def detail(data, apikey_name):
    """Show API key detail."""
    user = data.client.show("api_key", "apikey", apikey_name)
    utils.user_role_domains_display_format(user)
    user_blocked_format(user)

    dt = datetime.datetime.utcfromtimestamp(user["created_timestamp"])
    user["creation_time"] = dt.strftime('%Y-%m-%d %H:%M:%S')

    if user["expiration_type"] == "never":
        user["expiration_time"] = "(never)"
    else:
        dt = datetime.datetime.utcfromtimestamp(user["expiration_timestamp"])
        user["expiration_time"] = dt.strftime('%Y-%m-%d %H:%M:%S')

    columns = ("apikey_name", "description", "creation_time", "expiration_time", "expiration_type", "expiration_hours", "role", utils.RoleDomains)
    output.show(columns, user)

@delete.group('apikey', invoke_without_command=True)
@click.argument('apikey_name')
@click.pass_obj
def delete_apikey(data, apikey_name):
    """Delete API key."""
    data.client.delete("api_key", apikey_name)

# create apikey
@create.group('apikey', invoke_without_command=True)
@click.argument('apikey_name')
@click.option('--global_role')
@click.option('--expiration_type', help="Available options: never, oneday, onemonth, oneyear, hours")
@click.option('--expiration_hours', help="Set when expiration_type = hours")
@click.option('--description')
@click.pass_obj
def create_apikey(data, apikey_name, global_role, expiration_type, expiration_hours, description):
    """Create API key."""
    roles = GetUserGlobalRoleOptions(data)
    if global_role not in roles:
        supported_roles = []
        for r in roles:
            if r == "":
                r = "\"\""
            supported_roles.append(r)
        click.echo("Invalid role. Supported global role: {}".format(', '.join(supported_roles)))
        click.echo("")
        return

    hours = 0
    if expiration_type == "hours":
        try:
            hours = int(expiration_hours)
        except ValueError:
            click.echo("Invalid expiration_hours. Please enter a valid integer.")
            return

    user = {"apikey_name": apikey_name, "expiration_type": expiration_type, "expiration_hours": hours, "description": description}
    if global_role != None:
        user["role"] = global_role
    resp = data.client.create("api_key", {"apikey": user})

    columns = ("apikey_name", "apikey_secret")

    click.echo("")
    click.echo("Save the info below! This is the only time you'll be able to see it. If you lose it, you'll need to create a new API key.")
    click.echo("")
    output.show(columns, resp["apikey"])
    click.echo("To utilize the API key, join the apikey_name and apikey_secret together with a ':' delimiter, and set the resulting value in the HTTP header X-Auth-Apikey.")
    click.echo("X-Auth-Apikey: " + resp["apikey"]["apikey_name"] + ":" + resp["apikey"]["apikey_secret"])
    click.echo("")
