import click
import functools
import socket

from prog import client
from prog import output

RoleDomains = "domain role"

clusterRoleNone = ""
clusterRoleMaster = "master"
clusterRoleJoint = "joint"


def rename_kwargs(**replacements):
    def actual_decorator(func):
        @functools.wraps(func)
        def decorated_func(*args, **kwargs):
            for external_arg, internal_arg in replacements.iteritems():
                if internal_arg in kwargs:
                    kwargs[external_arg] = kwargs.pop(internal_arg)
                return func(*args, **kwargs)

        return decorated_func

    return actual_decorator


def keypress():
    try:
        from msvcrt import getch  # try to import Windows version
        return getch()
    except ImportError:
        import sys, tty, termios
        fd = sys.stdin.fileno()
        old_settings = termios.tcgetattr(fd)
        try:
            tty.setraw(sys.stdin.fileno())
            ch = sys.stdin.read(1)
        finally:
            termios.tcsetattr(fd, termios.TCSADRAIN, old_settings)
        return ch


def convert_byte(byte, span):
    if span == 0:
        if byte < 1024 * 1024:
            return "%.2f (KB)" % (float(byte) / 1024)
        elif byte < 1024 * 1024 * 1024:
            return "%.2f (MB)" % (float(byte) / 1024 / 1024)
        else:
            return "%.2f (GB)" % (float(byte) / 1024 / 1024 / 1024)
    else:
        if byte < 1024 * 1024 * span:
            return "%.2f (Kbps)" % (float(byte) * 8 / 1024 / span)
        else:
            return "%.2f (Mbps)" % (float(byte) * 8 / 1024 / 1024 / span)


def stats_display_format(stats, span):
    f = "cpu"
    if f in stats:
        fo = output.key_output(f)
        if span == 0:
            stats[fo] = ""
        else:
            stats[fo] = "%.2f" % (stats[f] * 100)
    f = "memory"
    if f in stats:
        fo = output.key_output(f)
        if span == 0:
            stats[fo] = ""
        else:
            stats[fo] = "%.3f" % (float(stats[f]) / 1024 / 1024)

    f = "packet_in"
    if f in stats:
        fo = output.key_output(f)
        if span > 0:
            stats[fo] = "%d (pps)" % (stats[f] / span)
    f = "packet_out"
    if f in stats:
        fo = output.key_output(f)
        if span > 0:
            stats[fo] = "%d (pps)" % (stats[f] / span)

    f = "byte_in"
    if f in stats:
        fo = output.key_output(f)
        stats[fo] = convert_byte(stats[f], span)
    f = "byte_out"
    if f in stats:
        fo = output.key_output(f)
        stats[fo] = convert_byte(stats[f], span)


def user_role_domains_display_format(user):
    user[RoleDomains] = ""
    if user.get("role_domains"):
        rlist = []
        for role, domains in user["role_domains"].iteritems():
            rlist.append("%s -> %s" % (",".join(domains), role))
        user[RoleDomains] = "\n".join(rlist)


def get_managed_object_id(clt, path, obj, id_or_name):
    item = None
    try:
        item = clt.show(path, obj, id_or_name)
        return item["id"] if "id" in item else None
    except client.ObjectNotFound:
        items = clt.list(path, obj, id="prefix,%s" % id_or_name, brief=True)
        if len(items) == 0:
            items = clt.list(path, obj, name=id_or_name, brief=True)

        if len(items) == 1:
            return items[0]["id"] if "id" in items[0] else ""


def get_managed_object(clt, path, obj, id_or_name):
    item = None
    try:
        item = clt.show(path, obj, id_or_name)
    except client.ObjectNotFound:
        items = clt.list(path, obj, id="prefix,%s" % id_or_name, brief=True)
        if len(items) == 0:
            items = clt.list(path, obj, name=id_or_name, brief=True)

        if len(items) > 1:
            click.echo("Error: Multiple matches found. Use ID instead.")
            return
        elif len(items) == 0:
            click.echo("Error: Unable to find the %s '%s'." % (obj, id_or_name))
            return

        if "id" in items[0]:
            item = clt.show(path, obj, items[0]["id"])
        else:
            item = item[0]

    return item


def is_valid_ipv4_address(address):
    try:
        socket.inet_pton(socket.AF_INET, address)
    except AttributeError:  # no inet_pton here, sorry
        try:
            socket.inet_aton(address)
        except socket.error:
            return False
        return address.count('.') == 3
    except socket.error:  # not a valid address
        return False

    return True


def parse_username_domain(full):
    tokens = full.split(client.UserDomainDelimiter)
    if len(tokens) == 1:
        return tokens[0], None
    elif len(tokens) == 2:
        return tokens[0], tokens[1]
    else:
        return None, None


def get_username_domain(username, domain):
    if domain:
        return username + client.UserDomainDelimiter + domain
    else:
        return username


def list_format_ip2workload(wl):
    if wl.get("workload"):
        f = "id"
        if wl["workload"].get(f):
            fo = output.key_output(f)
            wl[fo] = wl["workload"][f][:output.SHORT_ID_LENGTH]
        f = "name"
        if wl["workload"].get(f):
            fo = output.key_output(f)
            wl[fo] = wl["workload"][f]


def filter_value_include(f):
    return "in,%s" % f


def is_fed_master(data):
    resp = data.client.show("fed/member", None, None)
    if resp is None or (resp["fed_role"] != clusterRoleMaster):
        return False
    return True


def is_fed_joint(data):
    resp = data.client.show("fed/member", None, None)
    if resp is None or (resp["fed_role"] != clusterRoleJoint):
        return False
    return True
