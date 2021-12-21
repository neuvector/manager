import click

from cli import create
from cli import delete
from cli import request
from cli import set
from cli import show
from cli import unset
import client
import output
import utils
import json
from argparse import Namespace

PolicyFedRuleIDBase = 100000
PolicyFedRuleIDMax =  110000

PolicyCfgTypeDisplay = {"learned":"learned", "user_created":"user created", "ground":"crd", "federal":"federated"}

# policy ---

def _isFedNwRule(id):
    return (id > PolicyFedRuleIDBase and id < PolicyFedRuleIDMax)

def _common_policy_display_format(pol):
    f = "applications"
    if pol.get(f):
        fo = output.key_output(f)
        pol[fo] = ",".join(pol[f])

def list_policy_display_format(pol):
    _common_policy_display_format(pol)
    f = "disable"
    if pol["cfg_type"] == "federal":
        pol["scope"] = "fed"
    else:
        pol["scope"] = "local"
    pol["type"] = client.CfgTypeDisplay[pol["cfg_type"]]
    pol["status"] = ""
    if pol.get(f):
        if pol[f]:
            pol["status"] = "disable"

def _show_policy_display_format(pol):
    _common_policy_display_format(pol)
    f = "disable"
    pol["status"] = "enable"
    if pol.get(f):
        if pol[f]:
            pol["status"] = "disable"

@show.group("policy")
@click.pass_obj
def show_policy(data):
    """Show policy."""

@show_policy.group("rule", invoke_without_command=True)
@click.option("--scope", default="all", type=click.Choice(['fed', 'local', 'all']), help="Show federal, local or all policies")
@click.option("--page", default=40, type=click.IntRange(1), help="list page size, default=40")
@click.pass_obj
@click.pass_context
def show_policy_rule(ctx, data, scope, page):
    """Show policy rule."""
    if ctx.invoked_subcommand is not None:
        return

    args = {'start': 0, 'limit': page}
    if scope == 'fed' or scope == 'local':
        args["scope"] = scope

    while True:
        pols = data.client.list("policy/rule", "rule", **args)
        if pols == None:
            break

        for pol in pols:
            list_policy_display_format(pol)

        columns = ("id", "from", "to", "applications", "ports", "action", "learned", "status", "type")
        output.list(columns, pols)

        if args["limit"] > 0 and len(pols) < args["limit"]:
            break

        click.echo("Press <esc> to exit, press other key to continue ...")
        c = utils.keypress()
        if ord(c) == 27:
            break

        args["start"] += page

@show_policy_rule.command()
@click.argument("id")
@click.pass_obj
def detail(data, id):
    """Show policy rule detail."""
    pol = data.client.show("policy/rule", "rule", id)
    if not pol:
        return

    _show_policy_display_format(pol)
    columns = ("id", "comment", "status", "learned", "from", "to", "applications", "ports", "action", "disable")
    output.show(columns, pol)


def _list_derived_policy_display_format(pol):
    f = "domain"
    if f not in pol:
        fo = output.key_output(f)
        pol[fo] = ""

def _output_one_derived(p):
    id = p["workload"]["id"]
    click.echo("Container: id=%s name=%s rules=%d" %
               (id[:output.SHORT_ID_LENGTH], p["workload"]["name"], len(p["rules"])))
    for pol in p["rules"]:
        _list_derived_policy_display_format(pol)
    columns = ("policy_id", "from", "to", "port", "application", "action", "ingress", "domain")
    output.list(columns, p["rules"])

@show_policy.command()
@click.option("-e", "--enforcer", default=None, help="filter sessions by enforcer")
@click.option("-c", "--container", default=None, help="filter sessions by container")
@click.pass_obj
def derived(data, enforcer, container):
    """List derived policy rules"""
    try:
        filter = {}
        if enforcer:
            obj = utils.get_managed_object(data.client, "enforcer", "enforcer", enforcer)
            if obj:
                filter["enforcer"] = obj["id"]
        if container:
            obj = utils.get_managed_object(data.client, "workload", "workload", container)
            if obj:
                filter["workload"] = obj["id"]

        derived = data.client.list("debug/policy/rule", "workload_rule", **filter)
        for p in derived:
            _output_one_derived(p)

    except client.NotEnoughFilter:
        click.echo("Error: 'enforcer' or 'container' filter must be specified.")

@create.group("policy")
@click.pass_obj
def create_policy(data):
    """Create policy."""

@create_policy.command("rule")
@click.argument("from")
@click.argument("to")
@click.option("--scope", default="local", type=click.Choice(["fed", "local"]), show_default=True, help="It's a local or federal rule")
@click.option("--id", type=int, default=0, help="Policy rule ID. (Optional)")
@click.option("--ports", default="any", help="Port list. eg: any or 80,8080,8500-8508,tcp/443,tcp/3306-3307,udp/53")
@click.option("--applications", default="any", help="Application list. eg: http,kafka")
@click.option("--action", default="allow", type=click.Choice(['allow', 'deny']))
@click.option("--disable", default=False, is_flag=True, help="Disable the policy rule")
@click.option("--after", type=int, help="Specify policy rule ID that the new rule is inserted after. Use 0 to insert to the first; default to the end")
@click.option("--comment")
@click.pass_obj
@utils.rename_kwargs(from_group="from")
@utils.rename_kwargs(to_group="to")
def create_policy_rule(data, from_group, to_group, scope, id, ports, applications, action, disable, after, comment):
    """Create and append policy rule, with unique rule id (< 10000)."""

    args = {}
    apps = []
    if applications:
        apps = applications.split(",")

    rule1 = {"id": id, "from": from_group, "to": to_group, "ports": ports, "applications": apps,
            "action": action, "disable": disable, "comment": comment, "cfg_type": client.UserCreatedCfg}
    args["scope"] = scope
    if scope == "fed" or _isFedNwRule(id):
        rule1["cfg_type"] = client.FederalCfg
    else:
        rule1["cfg_type"] = client.UserCreatedCfg
    rules = {"rules": [rule1]}

    if after != None:
        rules["after"] = after
    else:
        if scope == "fed" or _isFedNwRule(id):
            rules["after"] = 0
    data.client.config("policy", "rule", {"insert": rules}, **args)

@set.group("policy")
@click.pass_obj
def set_policy(data):
    """Set policy configuration."""

@set_policy.command("rule")
@click.argument("id", type=int)
@click.option("--from", "from_group")
@click.option("--to", "to_group")
@click.option("--ports", help="Port list. eg: any or 80,8080,8500-8508,tcp/443,tcp/3306-3307,udp/53")
@click.option("--applications", help="Application list. eg: http,kafka")
@click.option("--action", type=click.Choice(['allow', 'deny']))
@click.option("--disable/--enable", default=None, help="Disable/Enable the policy rule")
@click.option("--after", type=int, help="Specify policy rule ID that the new rule is inserted after. Use 0 to insert to the first.")
@click.option("--comment")
@click.pass_obj
def set_policy_rule(data, id, from_group, to_group, ports, applications, action, disable, after, comment):
    """Configure policy rule."""

    rule = {"id": id}
    modify = False
    if from_group:
        rule["from"] = from_group
        modify = True
    if to_group:
        rule["to"] = to_group
        modify = True
    if ports:
        rule["ports"] = ports
        modify = True
    if applications:
        rule["applications"] = applications.split(",")
        modify = True
    if action:
        rule["action"] = action
        modify = True
    if disable != None:
        rule["disable"] = disable
        modify = True
    if _isFedNwRule(id):
        rule["cfg_type"] = client.FederalCfg
    else:
        rule["cfg_type"] = client.UserCreatedCfg

    if modify:
        ret = data.client.config("policy/rule", id, {"config": rule})
        if ret != True:
            return

    if after != None:
        move = {"id": id, "after": after}
        data.client.config("policy", "rule", {"move": move})

@delete.group("policy")
@click.pass_obj
def delete_policy(data):
    """Delete policy."""

@delete_policy.command("rule")
@click.argument('id', type=int)
@click.pass_obj
def delete_policy(data, id):
    """Delete policy rule."""
    data.client.delete("policy/rule", id)

# response rule ---

def _list_response_rule_display_format(rule):
    rule["type"] = client.CfgTypeDisplay[rule["cfg_type"]]
    f = "group"
    if f not in rule:
        rule[f] = ""
    f = "disable"
    if f not in rule:
        rule[f] = ""

    f = "conditions"
    conds = ""
    if f in rule:
        for c in rule[f]:
           if conds == "":
               conds = c["type"] + ":" + c["value"]
           else:
               conds = conds + ", " + c["type"] + ":" +c["value"]
    rule[f] = conds

    f = "actions"
    acts = ""
    if f in rule:
        for a in rule[f]:
           if acts == "":
               acts = a
           else:
               acts = acts + ", " + a
    rule[f] = acts

    f = "webhooks"
    acts = ""
    if f in rule:
        for a in rule[f]:
           if acts == "":
               acts = a
           else:
               acts = acts + ", " + a
    rule[f] = acts

def get_response_rules(data, scope, container):
    """Get response rules."""
    rules = {}
    args = {}
    if scope == 'fed' or scope == 'local':
        args["scope"] = scope

    if container != None:
        obj = utils.get_managed_object(data.client, "workload", "workload", container)
        if obj == None:
           click.echo("Cannot find the workload")
           return
        rules = data.client.show("response/workload_rules", "rules", obj["id"])
    else:
        rules = data.client.show("response/rule", "rules", None, **args)

    return rules

@show.group("response")
@click.pass_obj
def show_response(data):
    """Show response rule."""

@show_response.group("rule", invoke_without_command=True)
@click.option("-c","--container")
@click.option("--scope", default="all", type=click.Choice(['fed', 'local', 'all']), help="Show federal, local or all response rules")
@click.pass_obj
@click.pass_context
def show_response_rule(ctx, data, container, scope):
    """Show response rule."""

    if ctx.invoked_subcommand is not None:
        return

    columns = ("id", "group", "event", "conditions", "actions", "webhooks", "disable", "type")
    fedRules = get_response_rules(data, scope, container)

    click.echo("")
    if len(fedRules) > 0:
        for rule in fedRules:
            _list_response_rule_display_format(rule)
        output.list(columns, fedRules)

def _show_response_rule_option_display_format(option):
    for tag in option:
        val = ""
        for item in option[tag]:
           if val == "":
               val = item
           else:
               val = val + ", " + item
        option[tag] = val

@show_response_rule.command("options")
@click.option("--scope", default="local", type=click.Choice(['fed', 'local']), show_default=True, help="Show federal, local response rule options")
@click.pass_obj
def show_response_rule_options(data, scope):
    args = {}
    args["scope"] = scope
    options = data.client.show("response/options", "response_rule_options", None, **args)
    for event in options:
        option = options[event]
        _show_response_rule_option_display_format(option)
        click.echo("Event %s :" % event)
        click.echo("  Types: %s" % option["types"])
        if "name" in option:
            click.echo("  Name options: %s" % option["name"])
        if "level" in option:
            click.echo("  Level options: %s" % option["level"])

    click.echo("------")
    webhooks = data.client.show("response/options", "webhooks", None, **args)
    click.echo("Webhooks:")
    for wh in webhooks:
        click.echo("  {}".format(wh))

@create.group("response")
@click.pass_obj
def create_response(data):
    """Create response rules."""

@create_response.command("rule")
@click.option("--scope", default="local", type=click.Choice(['fed', 'local']), show_default=True, help="It's a local or federal rule")
@click.option("--group", help="Group name that the rule is applied to. Not applicable for admission and event")
@click.option("--event", help="event, cve-report, security-event, admission-control, compliance")
@click.option("--condition",  multiple=True, help="type:value, type can be name, cve-high, cve-medium, level and process")
@click.option("--action", default=None, multiple=True, help="quarantine, suppress-log, webhook")
@click.option("--webhook", "-w", multiple=True, help="webhook names")
@click.option("--id", type=int, default=0, help="Response rule ID. (Optional)")
@click.option("--after", type=int, help="Specify response rule ID that the new rule is inserted after. Use 0 to insert to the first; default to the end")
@click.option("--disable/--enable", default=None, help="Disable/Enable the response rule")
@click.option("--comment")
@click.pass_obj
def create_response_rule(data, scope, group, event, condition, action, webhook, id, after, disable, comment):
    """Create and append response rule, with unique rule id (< 10000).  """

    if event == None:
        click.echo("Error: Must provide event for response rule.")
        return

    if action == None or len(action) == 0:
        click.echo("Error: Must provide action for response rule.")
        return

    rule = {"id": id, "event": event, "actions": action}

    args = {}
    if scope == "fed":
        rule["cfg_type"] = client.FederalCfg
    else:
        rule["cfg_type"] = client.UserCreatedCfg
    args["scope"] = scope

    if webhook != None and len(webhook) != 0:
        rule["webhooks"] = webhook

    if group != None:
        rule["group"] = group

    if comment != None:
        rule["comment"] = comment

    if disable != None:
        rule["disable"] = disable

    conds = []
    for c in condition:
        d = c.split(":")
        if len(d) != 2:
            click.echo("Error: Must provide both condition type and value")
            return
        r = {"type": d[0], "value":d[1]}
        conds.append(r)

    if len(conds) != 0:
        rule["conditions"] = conds

    rules = {"rules": [rule]}

    if after != None:
        rules["after"] = after

    data.client.config("response", "rule", {"insert":rules}, **args)

@set.group("response")
@click.pass_obj
def set_response(data):
    """Set reponse rule configuration."""

@set_response.command("rule")
@click.argument("id", type=int)
@click.option("--scope", default="local", type=click.Choice(['fed', 'local']), show_default=False, required=False, help="obsolete")
@click.option("--group", "group")
@click.option("--event", help="event, cve-report, security-event, benchmark, admission-control")
@click.option("--condition",  multiple=True, help="type:value, type can be name, cve-high, cve-medium, level and process")
@click.option("--action", multiple=True, help="quarantine, suppress-log, webhook")
@click.option("--webhook", "-w", multiple=True, help="webhook names")
@click.option("--no_webhook", default=False, is_flag=True, help="clear webhooks")
@click.option("--after", type=int, help="Specify response rule ID that the new rule is inserted after. Use 0 to insert to the first.")
@click.option("--disable/--enable", default=None, help="Disable/Enable the response rule")
@click.option("--comment")
@click.pass_obj
def set_response_rule(data, id, scope, group, event, condition, action, webhook, no_webhook, after, disable, comment):
    """Configure response rule."""

    args = {}

    rule = {"id": id}
    modify = False
    if group != None:
        rule["group"] = group
        modify = True
    if event != None:
        rule["event"] = event
        modify = True
    if condition != None and len(condition) != 0:
        conds = []
        for c in condition:
            d = c.split(":")
            if len(d) != 2:
                click.echo("Error: Must provide both condition type and value")
                return
            r = {"type": d[0], "value":d[1]}
            conds.append(r)
        rule["conditions"] = conds
        modify = True
    if action != None and len(action) != 0:
        rule["actions"] = action
        modify = True
    if webhook != None and len(webhook) != 0:
        rule["webhooks"] = webhook
        modify = True
    if no_webhook:
        rule["webhooks"] = []
        modify = True
    if disable != None:
        rule["disable"] = disable
        modify = True
    if comment != None:
        rule["comment"] = comment
        modify = True

    if modify:
        ret = data.client.config("response/rule", id, {"config": rule}, **args)
        if ret != True:
            return

    if after != None:
        move = {"id": id, "after": after}
        data.client.config("response", "rule", {"move":move})


@unset.group("response")
@click.pass_obj
def unset_response(data):
    """Unset reponse rule configuration."""

@unset_response.group("rule")
@click.pass_obj
def unset_response_rule(data):
    """Unset reponse rule configuration."""

@unset_response_rule.command("group")
@click.option("--scope", default="local", type=click.Choice(['fed', 'local']), show_default=False, required=False, help="obsolete")
@click.argument("id", type=int)
@click.pass_obj
def unset_response_rule_group(data, scope, id):
    args = {}
    rule = {"id": id, "group":""}
    data.client.config("response/rule", id, {"config": rule}, **args)

@unset_response_rule.command("conditions")
@click.option("--scope", default="local", type=click.Choice(['fed', 'local']), show_default=False, required=False, help="obsolete")
@click.argument("id", type=int)
@click.pass_obj
def unset_response_rule_conditions(data, scope, id, **args):
    args = {}
    rule = {"id": id, "conditions":[]}
    data.client.config("response/rule", id, {"config": rule}, **args)

@delete.group("response")
@click.pass_obj
def delete_response(data):
    """Delete response rule."""

@delete_response.command("rule")
@click.option("--scope", default="local", type=click.Choice(['fed', 'local']), show_default=False, required=False, help="obsolete")
@click.argument('id', type=int)
@click.pass_obj
def delete_response_rule(data, scope, id):
    """Delete response rule."""
    args = {}
    data.client.delete("response/rule", id, **args)

@request.group("policy")
@click.pass_obj
def request_policy(data):
    """Request policy operation."""

@request_policy.group('rule')
@click.pass_obj
def request_policy_rules(data):
    """Request policies."""

@request_policy_rules.command("promote")
@click.option("--id",  multiple=True, help="id of the policies to promote to federate level on master cluster")
@click.pass_obj
def request_policy_rule_promote(data, id):
    """Promote policies to federate level."""
    if id is None or len(id) == 0:
        click.echo("""Error: Missing option "--id".""")
        return

    ids = []
    for idString in id:
        ids.append(int(idString))

    req = {"ids": ids}
    body = dict()
    body["request"] = req
    #click.echo("Policies request object: {}".format(json.dumps(body)))
    data = data.client.request("policy/rules", "promote", None, body)
