import click

from prog.cli import cli
from prog.cli import set
from prog.cli import create
from prog.cli import delete
from prog.cli import show
from prog import client
from prog import output


# -- password profile

@show.group('password_profile', invoke_without_command=True)
@click.pass_obj
@click.pass_context
def show_pwd_profile(ctx, data):
    """Show password profile."""
    if ctx.invoked_subcommand is not None:
        return

    respData = data.client.show("password_profile", None, None)
    activeName = ""
    profiles = []
    if "active_profile_name" in respData:
        activeName = respData["active_profile_name"]
    if "pwd_profiles" in respData:
        profiles = respData["pwd_profiles"]
    click.echo("")
    for profile in profiles:
        if profile["name"] == activeName:
            profile["active"] = "Y"
        else:
            profile["active"] = ""
    columns = ("name", "comment", "active")
    output.list(columns, profiles)


@show_pwd_profile.command()
@click.argument("name")
@click.pass_obj
def detail(data, name):
    """Show password profile details."""
    header1 = "block a user after consecutive login failures"
    header2 = "password is valid for days"
    header3 = "keep password hash history"
    header4 = "default user session timeout seconds"
    profile = data.client.show("password_profile", "pwd_profile", name)
    columns = (
    "name", "comment", "min_len", "min_uppercase_count", "min_lowercase_count", "min_digit_count", "min_special_count",
    header1, header2, header3, header4)
    profiles = []

    if profile["enable_block_after_failed_login"] is True and profile["block_after_failed_login_count"] > 0 and profile[
        "block_minutes"] > 0:
        profile[header1] = "block {} minutes after {} consecutive login faulures".format(profile["block_minutes"],
                                                                                         profile[
                                                                                             "block_after_failed_login_count"])
    else:
        profile[header1] = "not enabled"

    if profile["enable_password_expiration"] is True and profile["password_expire_after_days"] > 0:
        profile[header2] = "user password is valid for {} days".format(profile["password_expire_after_days"])
    else:
        profile[header2] = "not enabled"

    if profile["enable_password_history"] is True and profile["password_keep_history_count"] > 0:
        profile[header3] = "keep {} password hash history".format(profile["password_keep_history_count"])
    else:
        profile[header3] = "not enabled"

    profile[header4] = profile["session_timeout"]

    profiles.append(profile)

    click.echo("Profile basics:")
    columns1 = ("name", "comment", header4)
    output.list(columns1, profiles)

    click.echo("Password Format Requirement:")
    columns2 = ("min_len", "min_uppercase_count", "min_lowercase_count", "min_digit_count", "min_special_count")
    output.list(columns2, profiles)

    click.echo("Password Usage:")
    columns3 = (header1, header2, header3)
    output.list(columns3, profiles)


@show_pwd_profile.command()
@click.pass_obj
def basic_rule(data):
    """Show basic password requirements of active password profile."""
    profile = data.client.show("password_profile", "pwd_profile", "nvsyspwdprofile")
    columns = ("rule", "value", "comment")
    rules = []
    rule1 = {"rule": "minimum length", "value": profile["min_len"], "comment": ""}
    rule2 = {"rule": "minimum uppercase character count", "value": profile["min_uppercase_count"], "comment": "A ~ Z"}
    rule3 = {"rule": "minimum lowercase character count", "value": profile["min_lowercase_count"], "comment": "a ~ z"}
    rule4 = {"rule": "minimum digit character count", "value": profile["min_digit_count"], "comment": "0 ~ 9"}
    rule5 = {"rule": "minimum special character count", "value": profile["min_special_count"],
             "comment": "!\"#$%&\'()*+,-./:;<=>?@[\\]^_`{|}~"}
    rules.append(rule1)
    rules.append(rule2)
    rules.append(rule3)
    rules.append(rule4)
    rules.append(rule5)
    output.list(columns, rules)


# --

@set.command('password_profile')
@click.option('--name', required=True, help="password profile name")
@click.option('--comment', help="profile comment")
@click.option('--min_len', type=int, help="minimum password length")
@click.option('--min_uppercase_count', type=int, help="minimum uppercase letter count")
@click.option('--min_lowercase_count', type=int, help="minimum lowercase letter count")
@click.option('--min_digit_count', type=int, help="minimum digit character count")
@click.option('--min_special_count', type=int, help="minimum special character count")
@click.option('--enable_block_after_failed_login', type=bool,
              help="enable to block user after consecutive login failures")
@click.option('--block_after_failed_login_count', type=int,
              help="block user after number of consecutive login failures")
@click.option('--block_minutes', type=int, help="how long to block user after consecutive login failures")
@click.option('--enable_password_expiration', type=bool, help="enable password expiration")
@click.option('--password_expire_after_days', type=int,
              help="a user password is valid for number of days. User needs to reset password before it expires.")
@click.option('--enable_password_history', type=bool, help="enable password hash history")
@click.option('--password_keep_history_count', type=int, help="password hash history count to keep (max: 32)")
@click.option('--session_timeout', type=int, help="default user session timeout seconds (30 ~ 3600)")
@click.pass_obj
def set_pwd_profile(data, name, comment, min_len, min_uppercase_count, min_lowercase_count, min_digit_count,
                    min_special_count, enable_block_after_failed_login,
                    block_after_failed_login_count, block_minutes, enable_password_expiration,
                    password_expire_after_days, enable_password_history, password_keep_history_count,
                    session_timeout):
    """Set password profile configuration."""

    profile = {"name": name}
    if comment is not None:
        profile["comment"] = comment
    if min_len is not None:
        profile["min_len"] = min_len
    if min_uppercase_count is not None:
        profile["min_uppercase_count"] = min_uppercase_count
    if min_lowercase_count is not None:
        profile["min_lowercase_count"] = min_lowercase_count
    if min_digit_count is not None:
        profile["min_digit_count"] = min_digit_count
    if min_special_count is not None:
        profile["min_special_count"] = min_special_count
    if enable_block_after_failed_login is not None:
        profile["enable_block_after_failed_login"] = enable_block_after_failed_login
    if block_after_failed_login_count is not None:
        profile["block_after_failed_login_count"] = block_after_failed_login_count
    if block_minutes is not None:
        profile["block_minutes"] = block_minutes
    if enable_password_expiration is not None:
        profile["enable_password_expiration"] = enable_password_expiration
    if password_expire_after_days is not None:
        profile["password_expire_after_days"] = password_expire_after_days
    if enable_password_history is not None:
        profile["enable_password_history"] = enable_password_history
    if password_keep_history_count is not None:
        profile["password_keep_history_count"] = password_keep_history_count
    if session_timeout is not None:
        profile["session_timeout"] = session_timeout
    data.client.config("password_profile", name, {"config": profile})

# --
