import click

from prog.cli import create
from prog.cli import delete
from prog.cli import request
from prog.cli import set
from prog.cli import show
from prog import client
from prog import output

CriteriaOpNotEqual = "!="
CriteriaOpNotRegex = "!regex"
CriteriaOpContainsAll = "containsAll"
CriteriaOpContainsAny = "containsAny"
CriteriaOpContainsOtherThan = "containsOtherThan"
CriteriaOpNotContainsAny = "notContainsAny"

AdmCtrlAllowRulesType = "exception"
AdmCtrlDenyRulesType = "deny"

AdmCtrlRuleTypeDisplay = {AdmCtrlAllowRulesType: 'allow', AdmCtrlDenyRulesType: 'deny'}

SingleValueCrt = {"cveHighCount": True,
                  "cveMediumCount": True,
                  "cveHighWithFixCount": True,
                  "cveScoreCount": True,
                  "cveNames": False,
                  "envVars": False,
                  "image": True,
                  "imageRegistry": True,
                  "imageScanned": True,
                  "imageSigned": True,
                  "labels": False,
                  "mountVolumes": False,
                  "namespace": True,
                  "runAsPrivileged": True,
                  "runAsRoot": True,
                  "allowPrivEscalation": True,
                  "pspCompliance": True,
                  "user": True,
                  "userGroups": False,
                  "publishDays": True,
                  "imageCompliance": True,
                  "envVarSecrets": True,
                  "imageNoOS": True,
                  "sharePidWithHost": True,
                  "shareIpcWithHost": True,
                  "shareNetWithHost": True,
                  "count": True,
                  "resourceLimit": True,
                  "modules": False
                  }

NamesDisplay = {"cveHighCount": "High severity CVE count",
                "cveMediumCount": "Medium severity CVE count",
                "cveHighWithFixCount": "Count of high severity CVEs that have fix",
                "cveScoreCount": "Count of CVEs whose score",
                "cveNames": "CVE names",
                "envVars": "Environment variables",
                "image": "Image",
                "imageRegistry": "Image registry",
                "imageScanned": "Image scanned",
                "imageSigned": "Image signed",
                "labels": "Labels",
                "mountVolumes": "Mount volumes",
                "namespace": "Namespace",
                "runAsPrivileged": "Run as privileged",
                "runAsRoot": "Run as root",
                "allowPrivEscalation": "Allow privilege escalation",
                "pspCompliance": "PSP compliance violations",
                "user": "User",
                "userGroups": "User groups",
                "imageCompliance": "Image compliance violations",
                "envVarSecrets": "Environment variables with secrets",
                "imageNoOS": "Base OS of the image is empty",
                "sharePidWithHost": "Share PID namespace with host",
                "shareIpcWithHost": "Share IPC namespace with host",
                "shareNetWithHost": "Share network with host",
                "resourceLimit": "Resource Limit",
                "cpuRequest": "CPU request",
                "cpuLimit": "CPU limit",
                "memoryRequest": "memory request",
                "memoryLimit": "memory limit",
                "modules": "Image Modules/Packages"
                }

NamesDisplay2 = {  # for criteria that has sub-criteria
    "cveHighCount": "More than {v1} high severity CVEs that were reported before {v2} days ago",
    "cveMediumCount": "More than {v1} medium severity CVEs that were reported before {v2} days ago",
    "cveHighWithFixCount": "More than {v1} high severity CVEs with fix that were reported before {v2} days ago",
    "cveScoreCount": "More than {v1} CVEs whose score >= {v2}",
    "resourceLimit": "Resource limit{v1}: {v2}",
}

OpsDisplay1 = {CriteriaOpContainsAny: 'is', CriteriaOpNotContainsAny: 'is not',
               CriteriaOpContainsAll: CriteriaOpContainsAll, CriteriaOpContainsOtherThan: CriteriaOpContainsOtherThan}
OpsDisplay2 = {CriteriaOpContainsAny: 'contains any in', CriteriaOpNotContainsAny: 'not contains any in',
               CriteriaOpContainsAll: 'contains all in', CriteriaOpContainsOtherThan: 'contains value not in'}


def get_admission_rules(data, scope):
    """Get admission control rules."""
    args = {}
    if scope == 'fed' or scope == 'local':
        args["scope"] = scope
    rules = data.client.show("admission/rules", "rules", None, **args)  # show(self, path, obj, obj_id, **kwargs)
    return rules


# admission control -----
@show.group("admission")
@click.pass_obj
def show_admission(data):
    """Show admission control configuration."""


@show_admission.command("state")
@click.pass_obj
def show_admission_state(data):
    """Show admission control state."""
    state = data.client.show("admission/state", "state", None)
    # click.echo("Admission control state object: {}".format(json.dumps(state)))
    click.echo("")
    stateDisplay = "disabled"
    if state["enable"]:
        stateDisplay = "enabled"
    if state["cfg_type"] == "ground":
        click.echo("Admission control state: (read-only because it's controlled by CRD rule)")
    else:
        click.echo("Admission control state:")
    click.echo("  state:          {}".format(stateDisplay))
    click.echo("  mode:           {}".format(state["mode"]))
    click.echo("  default action: {}".format(state["default_action"]))
    click.echo("  client mode:    {} ({})".format(state["adm_client_mode"],
                                                  state["adm_client_mode_options"][state["adm_client_mode"]]))
    if "failure_policy" in state:
        click.echo("  failure policy: {}".format(state["failure_policy"]))
    click.echo("")
    click.echo("Admission control client mode options:")
    for option in state["adm_client_mode_options"]:
        click.echo("  {0: <12}  ({1: <15})".format(option, state["adm_client_mode_options"][option]))
    click.echo("")


@show_admission.command("stats")
@click.pass_obj
def show_admission_stats(data):
    """Show admission control statistics."""
    stats = data.client.show("debug/admission_stats", "stats", None)
    click.echo(" ")
    click.echo("[Kubernetes]")
    click.echo("Allowed   requests : {}".format(stats["k8s_allowed_requests"]))
    click.echo("Denied    requests : {}".format(stats["k8s_denied_requests"]))
    click.echo("Erroneous requests : {}".format(stats["k8s_erroneous_requests"]))
    click.echo("Ignored   requests : {}".format(stats["k8s_ignored_requests"]))
    click.echo("Requests under process : {}".format(stats["k8s_processing_requests"]))
    click.echo(" ")


#    click.echo("[Jenkins]")
#    click.echo("Allowed   requests : {}".format(stats["jenkins_allowed_requests"]))
#    click.echo("Denied    requests : {}".format(stats["jenkins_denied_requests"]))
#    click.echo("Erroneous requests : {}".format(stats["jenkins_erroneous_requests"]))
#    click.echo(" ")

def _get_criterion_op_value(c):
    opDisplay = c["op"]
    if c["op"] == CriteriaOpContainsAll or c["op"] == CriteriaOpContainsAny or c["op"] == CriteriaOpNotContainsAny or c["op"] == CriteriaOpContainsOtherThan:
        if SingleValueCrt[c["name"]] is True:
            opDisplay = OpsDisplay1[c["op"]]
        else:
            opDisplay = OpsDisplay2[c["op"]]
        value = "{{{}}}".format(c["value"])
    else:
        opDisplay = c["op"]
        value = c["value"]
    return opDisplay, value


def _list_admission_rule_display_format(rule):
    # attribs = ["category", "comment", "disable"]
    rule["type"] = client.CfgTypeDisplay[rule["cfg_type"]]
    rule["action"] = AdmCtrlRuleTypeDisplay[rule["rule_type"]]
    attribs = ["comment", "disable"]
    for attrib in attribs:
        if attrib not in rule:
            rule[attrib] = ""
    criteria = ""
    if "criteria" in rule:
        types = {}
        for c in rule["criteria"]:  # for each criterion
            if c["name"] in types:
                types[c["name"]].append(c)
            else:
                types[c["name"]] = [c]
        for t in types:
            if len(types[t]) == 0:
                continue
            positive = False
            for c in types[t]:
                if c["op"] != CriteriaOpNotEqual and c["op"] != CriteriaOpNotRegex and c["op"] != CriteriaOpNotContainsAny:  
                    positive = True
                    break
            tc = ""
            for c in types[t]:
                opDisplay, value = _get_criterion_op_value(c)
                if c["name"] in NamesDisplay2:
                    if "sub_criteria" in c:
                        subCriteria = c["sub_criteria"]
                        if len(subCriteria) == 0:
                            criterion = "({} {} {})".format(NamesDisplay[c["name"]], opDisplay, value)
                        else:
                            if c["name"] == "resourceLimit":
                                subCritStr = ""
                                for subCriterion in subCriteria:
                                    subOpDisplay, subValue = _get_criterion_op_value(subCriterion)
                                    # subStr = "({} {} {})".format(NamesDisplay[subCriterion["name"]].format(v1=subValue, v2=subValue))
                                    str = "({} {} {})".format(NamesDisplay[subCriterion["name"]], subCriterion["op"],
                                                              subCriterion["value"])
                                    if subCritStr == "":
                                        subCritStr = str
                                    else:
                                        subCritStr = "{} or {}".format(subCritStr, str)
                                criterion = "({})".format(NamesDisplay2[c["name"]].format(v1=value, v2=subCritStr))
                            else:
                                if len(subCriteria) == 1:
                                    for subCriterion in subCriteria:
                                        subOpDisplay, subValue = _get_criterion_op_value(subCriterion)
                                        criterion = "({})".format(
                                            NamesDisplay2[c["name"]].format(v1=value, v2=subValue))
                                        break
                                else:
                                    criterion = "(unsupported sub-criteria number: {})".format(len(subCriteria))
                    elif c["name"] in NamesDisplay:
                        criterion = "({} {} {})".format(NamesDisplay[c["name"]], opDisplay, value)
                    else:
                        criterion = "(unsupported {})".format(c["name"])
                elif c["name"] in NamesDisplay:
                    criterion = "({} {} {})".format(NamesDisplay[c["name"]], opDisplay, value)
                else:
                    criterion = "(unsupported {})".format(c["name"])
                if tc == "":
                    tc = criterion
                else:
                    if positive:
                        tc = "{} or {}".format(tc, criterion)
                    else:
                        tc = "{} and {}".format(tc, criterion)
            if len(types[t]) > 1:
                tc = "({})".format(tc)

            if criteria == "":
                criteria = tc
            else:
                criteria = "{} and {}".format(criteria, tc)
    rule["criteria"] = criteria


@show_admission.group("rule", invoke_without_command=True)
@click.option("--id", type=int, help="Rule id")
@click.option("--scope", default="local", type=click.Choice(['fed', 'local']), help="Obsolete")
@click.pass_obj
@click.pass_context
def show_admission_rule(ctx, data, id, scope):
    """Show admission control rule."""
    if ctx.invoked_subcommand is not None:
        return
    if id is None:
        click.echo("""Error: Missing option "--id".""")
        return

    rules = []
    rule = data.client.show("admission/rule", "rule", id)  # show(self, path, obj, obj_id)
    _list_admission_rule_display_format(rule)
    rules.append(rule)
    click.echo(" ")
    # columns = ("id", "category", "criteria", "disable", "comment", "type")
    columns = ("id", "criteria", "disable", "comment", "action", "type")
    output.list(columns, rules)


@show_admission.group("rules", invoke_without_command=True)
@click.option("--scope", default="all", type=click.Choice(['fed', 'local', 'all']),
              help="Show federal, local or all admission rules")
@click.pass_obj
@click.pass_context
def show_admission_rules(ctx, data, scope):
    """Show admission control rules."""
    if ctx.invoked_subcommand is not None:
        return
    click.echo(" ")

    rules = get_admission_rules(data, scope)
    for rule in rules:
        _list_admission_rule_display_format(rule)

    if len(rules) > 0:
        # columns = ("id", "category", "criteria", "disable", "comment", "type")
        columns = ("id", "criteria", "disable", "comment", "action", "type")
        output.list(columns, rules)


def _get_criterion_option(option):
    ops = []
    for o in option["ops"]:
        ops.append(o)
    option["ops"] = "{}".format(", ".join(ops))
    if "values" in option:
        option["values"] = "{}".format(", ".join(option["values"]))
    else:
        option["values"] = ""


def _list_admission_rule_options(data, ruleType, category, ruleOptionsObj):
    click.echo(" ")
    # click.echo("Rule options for {} {} rules:".format(category, ruleType))
    click.echo("Rule options for {} rules:".format(AdmCtrlRuleTypeDisplay[ruleType]))
    ruleOptionsDisplay = []
    ruleOptions = ruleOptionsObj["rule_options"]
    for name in ruleOptions:
        option = ruleOptions[name]
        if "sub_options" in option:
            subOptions = option["sub_options"]
            subOptionsStr = ""
            for name in subOptions:
                str = ""
                subOption = subOptions[name]
                _get_criterion_option(subOption)
                if subOption["values"] == "":
                    str = "{}  {}".format(subOption["name"], subOption["ops"])
                else:
                    str = "{} {}  {}".format(subOption["name"], subOption["ops"], subOption["values"])
                if subOptionsStr == "":
                    subOptionsStr = str
                else:
                    subOptionsStr = "{}\n{}".format(subOptionsStr, str)
            option["sub-options"] = subOptionsStr
        else:
            option["sub-options"] = ""
        _get_criterion_option(option)
        ruleOptionsDisplay.append(option)
    columns = ("name", "ops", "values", "sub-options")
    output.list(columns, ruleOptionsDisplay)


def _list_admission_cat_options(data, ruleType, optionsObj):
    _list_admission_rule_options(data, ruleType, "Kubernetes", optionsObj["k8s_options"])
    # _list_admission_rule_options(data, ruleType, "Jenkins", optionsObj["jenkins_options"])


def _list_admission_psp_collection(data, criteria):
    click.echo(" ")
    click.echo("Content for PSP compliance violation criterion:")
    columns = ("name", "op", "value")
    output.list(columns, criteria)


@show_admission_rule.command("options")
@click.pass_obj
def show_admission_rule_options(data):
    """Show admission control rule options."""
    resp = data.client.show("admission/options", None, None)
    if "admission_options" in resp:
        rest_admission_options = resp["admission_options"]
        if "deny_options" in rest_admission_options:
            _list_admission_cat_options(data, "deny", rest_admission_options["deny_options"])
        if "exception_options" in rest_admission_options:
            _list_admission_cat_options(data, AdmCtrlAllowRulesType, rest_admission_options["exception_options"])
        if "psp_collection" in rest_admission_options:
            _list_admission_psp_collection(data, rest_admission_options["psp_collection"])
    else:
        click.echo("")
        click.echo("")


#
@create.group("admission")
@click.pass_obj
def create_admission(data):
    """Create admission control rule."""


def _parse_adm_criterion(c):
    d = c.split(":")
    if len(d) < 3:
        click.echo("Error: Must provide criterion name, op and value")
        return
    elif len(d) > 3:
        d[2] = ":".join(d[2:])
    crit = {"name": d[0], "op": d[1], "value": d[2]}
    return crit


def _parse_adm_criteria(criteria):
    crits = []
    for c in criteria:
        c0 = c.split("/")
        mainCrit = {}
        c3 = c.split(":")
        if len(c0) > 0 and c0[0] == "resourceLimit":
            c3 = [c0[0]]
        elif len(c3) < 3:
            msg = "Error: Incorrect criteria option: {}".format(c)
            click.echo(msg)
            return False, None
        crtName = c3[0]
        if crtName == "cveHighCount" or crtName == "cveMediumCount" or crtName == "cveHighWithFixCount" or crtName == "cveScoreCount":
            c2 = c.split("/")
            if len(c2) == 0:
                click.echo("""Error: Invalid option value "--criteria".""")
                return False, None
            if len(c2) > 1:  # meaning there is sub-criteria
                subCrits = []
                for c in c2[1:]:
                    subCrit = _parse_adm_criterion(c)
                    subCrits.append(subCrit)
                mainCrit = _parse_adm_criterion(c2[0])
                mainCrit["sub_criteria"] = subCrits
            else:  # meaning there is no sub-criteria
                mainCrit = _parse_adm_criterion(c)
            crits.append(mainCrit)
        elif crtName == "resourceLimit":
            c2 = c.split("/")
            if len(c2) == 0:
                click.echo("""Error: Invalid option value "--criteria".""")
                return False, None
            if len(c2) > 1:  # meaning there is sub-criteria
                subCrits = []
                for c in c2[1:]:
                    subCrit = _parse_adm_criterion(c)
                    subCrits.append(subCrit)
                mainCrit = {"name": "resourceLimit", "sub_criteria": subCrits}
            crits.append(mainCrit)
        else:
            mainCrit = _parse_adm_criterion(c)
            mainCrit["sub_criteria"] = None
            crits.append(mainCrit)
    return True, crits


@create_admission.command("rule")
@click.option("--type", default="deny", type=click.Choice(['deny', 'allow']), show_default=True, help="Rule type")
@click.option("--scope", default="local", type=click.Choice(['fed', 'local']), show_default=True,
              help="It's a local or federal rule")
# @click.option("--category", default="Kubernetes", help="rule category. default: Kubernetes")
@click.option("--criteria", multiple=True,
              help="Format is name:op:value{/subName:op:value}. name can be image, namespace, user, labels, mountVolumes, cveNames, cveHighCount, cveHighWithFixCount, cveMediumCount, cveScoreCount, imageScanned, imageSigned, runAsRoot, allowPrivEscalation, pspCompliance, userGroups, imageCompliance, envVarSecrets, imageNoOS, sharePidWithHost, shareIpcWithHost, shareNetWithHost, resourceLimit. subName can be publishDays, count, cpuRequest, cpuLimit, memoryRequest, memoryLimit. See command: show admission rule options")
@click.option("--disable/--enable", default=False, help="Disable/enable the admission control rule [default: --enable]")
@click.option("--comment", default="", help="Rule comment")
@click.pass_obj
def create_admission_rule(data, type, scope, criteria, disable, comment):
    """Create an admission control rule.\n
       Notice: \n
       For criteria/comment options, you need to use double quote character around the option value, like --criteria \"cveHighCount:>=:2/publishDays:>=:30\" or --criteria \"cveScoreCount:>=:7/count:>=:5\" """
    if criteria is None or len(criteria) == 0:
        click.echo("""Error: Missing option "--criteria".""")
        return

    if type == 'allow':
        type = AdmCtrlAllowRulesType

    rule = {"disable": disable}
    result, crits = _parse_adm_criteria(criteria)
    if not result:
        return

    rule["criteria"] = crits
    rule["comment"] = comment
    rule["category"] = "Kubernetes"
    if scope == "fed":
        rule["cfg_type"] = client.FederalCfg
    else:
        rule["cfg_type"] = client.UserCreatedCfg
    rule["rule_type"] = type
    rule["id"] = 0
    body = dict()
    body["config"] = rule
    # click.echo("Admission control rule object: {}".format(json.dumps(body)))
    ret = data.client.create("admission/rule", body)
    if not ret:
        return


#
@set.group("admission")
@click.pass_obj
def set_admission(data):
    """Set admission control configuration."""


@set_admission.command("state")
@click.option("--disable/--enable", default=None, required=False, help="Disable/enable admission control")
@click.option("--mode", required=False, type=click.Choice(['monitor', 'protect']), help="Admission control mode")
# @click.option("--default_action", required=False, type=click.Choice(['allow', 'deny']), help="Default action for the request if no rule matches")
@click.option("--client_mode", required=False,
              help="The client mode that Kube-apiserver uses when sending requests to Neuvector admission control webhook server")
@click.pass_obj
def set_admission_state(data, disable, mode, client_mode):
    """Configure admission control state."""
    current = data.client.show("admission/state", "state", None)
    default_action = None
    enable = None
    if disable is True:
        enable = False
    elif disable is False:
        enable = True

    client_mode_selection = None
    if client_mode is not None:
        client_mode_options = current["adm_client_mode_options"]
        if client_mode in client_mode_options:
            client_mode_selection = client_mode
        else:
            click.echo("Error: --client_mode value is invalid")
            return

    if enable is not None:
        current["enable"] = enable
    if mode is not None:
        current["mode"] = mode
    if default_action is not None:
        current["default_action"] = default_action
    if client_mode_selection is not None:
        current["adm_client_mode"] = client_mode_selection

    body = dict()
    body["state"] = current
    ret = data.client.config("admission", "state", body)  # config(self, path, obj_id, body, **kwargs)
    if not ret:
        return


@set_admission.command("rule")
@click.option("--id", type=int, required=True, help="Rule id")
@click.option("--scope", default="local", type=click.Choice(['fed', 'local']), show_default=True, help="Obsolete")
# @click.option("--category", default="Kubernetes", show_default=True, help="Rule category")
@click.option("--criteria", multiple=True,
              help="Format is name:op:value{/subName:op:value}. name can be image, namespace, user, labels, mountVolumes, cveNames, cveHighCount, cveHighWithFixCount, cveMediumCount, cveScoreCount, imageScanned, imageSigned, runAsRoot, allowPrivEscalation, pspCompliance, userGroups, imageCompliance, envVarSecrets, imageNoOS, sharePidWithHost, shareIpcWithHost, shareNetWithHost, resourceLimit. subName can be publishDays, count, cpuRequest, cpuLimit, memoryRequest, memoryLimit. See command: show admission rule options")
@click.option("--enable", "state", flag_value='enable', help="Enable the admission control rule")
@click.option("--disable", "state", flag_value='disable', help="Enable the admission control rule")
@click.option("--comment", help="Rule comment")
@click.pass_obj
def set_admission_rule(data, id, scope, criteria, state, comment):
    category = None  # Do not allow category yet
    disable = False
    """Configure admission control deny rule.\n
       Notice: \n
       For criteria/comment options, you need to use double quote character around the option value, like --criteria \"cveHighCount:>=:2/publishDays:>=:30\" or --criteria \"cveScoreCount:>=:7/count:>=:5\" """
    if state == "disable":
        disable = True

    rule = None
    scope = "local"
    if id > 100000:
        scope = "fed"
    rules = get_admission_rules(data, scope)
    for rule_ in rules:
        if int(rule_["id"]) == int(id):
            rule = rule_
            break
    if rule is None:
        click.echo("Error: Rule not found")
        return

    modify = False
    result, crits = _parse_adm_criteria(criteria)
    if not result:
        return

    defaultRule = rule["critical"]

    if len(crits) != 0:
        rule["criteria"] = crits
        modify = True
    if state is not None:
        if defaultRule and disable:
            if click.confirm('The whitelist rule to disable is a default rule. Do you want to continue?'):
                disable = disable
            else:
                return
        rule["disable"] = disable
        modify = True
    if comment is not None:
        rule["comment"] = comment
        modify = True
    if category is not None:
        if defaultRule:
            click.echo("Abort because category of the default whitelist rule cannot be modified.")
            click.echo("")
            return
        rule["category"] = category
        modify = True

    if modify:
        body = dict()
        body["config"] = rule
        ret = data.client.config("admission", "rule", body)
        if scope == "fed":
            click.echo("A federal-level admission control deny rule has been configured.")


#
@delete.group("admission")
@click.pass_obj
def delete_admission(data):
    """Delete admission control rule."""


@delete_admission.command("rule")
@click.option("--id", type=int, help="Rule id")
@click.option("--scope", default="local", type=click.Choice(['fed', 'local']), show_default=True,
              help="It's a local or federal rule")
@click.pass_obj
def delete_admission_rule(data, id, scope):
    """Delete admission control rule."""
    args = {}
    if id is not None:
        data.client.delete("admission/rule", id, **args)
        if scope == "fed":
            click.echo("A federal-level admission control rule has been deleted.")
    else:
        deleteRules = False
        if scope == "fed":
            if click.confirm(
                    'All federal-level admission control deny rules will be deleted. Do you want to continue?'):
                deleteRules = True
        else:
            if click.confirm(
                    'All local non-default admission control rules(except default rules) will be deleted. Do you want to continue?'):
                deleteRules = True
        if deleteRules:
            if scope == 'fed' or scope == 'local':
                args["scope"] = scope
            data.client.delete("admission/rules", None, **args)


@request.group("admission")
@click.pass_obj
def request_admission(data):
    """Request admission control operation."""


@request_admission.command("test")
@click.pass_obj
def request_admission_test(data):
    """Test admission control webhook server connectivity."""
    data.client.request("debug/admission", "test", None, {})
    click.echo("")
    click.echo(
        "NeuVector admission control webhook server receives the request sent from Kube-apiserver for testing successfully.")
    click.echo("")


@request_admission.group('rule')
@click.pass_obj
def request_admission_rule(data):
    """Request admission control."""


@request_admission_rule.command("promote")
@click.option("--id", multiple=True,
              help="id of the admission control rules to promote to federate level on master cluster")
@click.pass_obj
def request_admission_rule_promote(data, id):
    """Promote admission control rules to federate level."""
    if id is None or len(id) == 0:
        click.echo("""Error: Missing option "--id".""")
        return

    ids = []
    for idString in id:
        ids.append(int(idString))

    req = {"ids": ids}
    body = dict()
    body["request"] = req
    # click.echo("Admission control request object: {}".format(json.dumps(body)))
    data = data.client.request("admission/rule", "promote", None, body)
