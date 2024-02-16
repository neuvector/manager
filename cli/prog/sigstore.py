import click

from prog.cli import create
from prog.cli import delete
from prog.cli import set
from prog.cli import show
from prog import client
from prog import output


def get_user_input(name):
    # Get input from user.
    click.echo("Enter/Paste {}. An empty line to save it.".format(name))
    lines = []
    while True:
        line = input()
        if line:
            lines.append(line)
        else:
            break
    text = '\n'.join(lines)
#    click.echo("{}={}".format(name, text))
    click.echo("")

    return text


@show.group('sigstore')
@click.pass_obj
def show_sigstore(data):
    """Show sigstore information."""


@show_sigstore.group("root_of_trust", invoke_without_command=True)
@click.option("--root_name", default=None, help="Root of trust name")
@click.pass_obj
def show_sigstore_rootoftrust(data, root_name):
    """Show root of trust."""

    if root_name == "":
        click.echo("--root_name value cannot be empty string")
        click.echo("")
        return

    resp = data.client.show("scan/sigstore/root_of_trust", None, root_name)  # show(self, path, obj, obj_id, **kwargs)
        
    rootOfTrusts = []    
    if root_name is None:
        if "roots_of_trust" in resp and resp["roots_of_trust"] is not None:
            for r in resp["roots_of_trust"]:
                if "cfg_type" in r:
                    r["cfg_type"] = client.CfgTypeDisplay[r["cfg_type"]]
                for k in ["rekor_public_key", "root_cert", "sct_public_key"]:
                    if k not in r:
                        r[k] = ""
                rootOfTrusts.append(r) 
    else:
        for k in ["rekor_public_key", "root_cert", "sct_public_key"]:
            if k not in resp:
                resp[k] = ""
        rootOfTrusts.append(resp) 

    columns = ("name", "is_private", "rekor_public_key", "root_cert", "sct_public_key", "comment", "cfg_type")
    output.list(columns, rootOfTrusts)


@show_sigstore.group("verifier", invoke_without_command=True)
@click.option("--root_name", required=True, help="Root of trust name")
@click.option("--name", default=None, help="Verifier name")
@click.pass_obj
def show_sigstore_verifier(data, root_name, name):
    """Show verifier."""

    if root_name == "":
        click.echo("--root_name value cannot be empty string")
        click.echo("")
        return
    if name == "":
        click.echo("--name value cannot be empty string")
        click.echo("")
        return

    urlStr = "scan/sigstore/root_of_trust/{}/verifier".format(root_name)
    resp = data.client.show(urlStr, None, name)  # show(self, path, obj, obj_id, **kwargs)
    if resp is None:
        return
        
    verifiers = []
    
    if name is None:
        if "verifiers" in resp and resp["verifiers"] is not None:
            for v in resp["verifiers"]:
                for k in ["public_key", "cert_issuer", "cert_subject"]:
                    if k not in v:
                        v[k] = ""
                verifiers.append(v)
    else:
        for k in ["public_key", "cert_issuer", "cert_subject"]:
            if k not in resp:
                resp[k] = ""
        verifiers.append(resp) 

    columns = ("name", "verifier_type", "public_key", "cert_issuer", "cert_subject", "comment")
    output.list(columns, verifiers)


# create

@create.group('sigstore')
@click.pass_obj
def create_sigstore(data):
    """Create sigstore."""


@create_sigstore.group("root_of_trust", invoke_without_command=True)
@click.option("--root_name", required=True, help="Root of trust name")
@click.option("--private", is_flag=True, default=False, help="Set this flag for private root of trust")
@click.option("--rootless_keypairs_only", is_flag=True, default=False, help="Set this flag to only allow explicit keypair verifiers")
@click.option("--rekor_public_key", is_flag=True, default=False, help="Set this flag for configuring Rekor Public Key")
@click.option("--root_cert", is_flag=True, default=False, help="Set this flag for configuring Root Certificate")
@click.option("--sct_public_key", is_flag=True, default=False, help="Set this flag for configuring SCT Public Key")
@click.option("--comment", default="", help="Comment")
@click.pass_obj
def create_sigstore_rootoftrust(data, root_name, private, rootless_keypairs_only, rekor_public_key, root_cert, sct_public_key, comment):
    """Create root of trust."""

    if root_name == "":
        click.echo("--root_name value cannot be empty string")
        click.echo("")
        return

    rekor_public_key_value = ""
    root_cert_value = ""
    sct_public_key_value = ""
    if private is True:
        if root_cert is True:
            root_cert_value = get_user_input("Root Certificate")
            if root_cert_value == "":
                click.echo("Root Certificate(--root_cert) cannot be empty string")
                click.echo("")
                return
        else:
            click.echo("--root_cert must be specified for private root of trust")
            click.echo("")
            return
        if rekor_public_key is True:
            rekor_public_key_value = get_user_input("Rekor Public Key")
        if sct_public_key is True:
            sct_public_key_value = get_user_input("SCT Public Key")

    info = {
        "name": root_name,
        "is_private": private,
        "rootless_keypairs_only": rootless_keypairs_only,
        "rekor_public_key": rekor_public_key_value,
        "root_cert": root_cert_value,
        "sct_public_key": sct_public_key_value,
        "comment": comment
    }

    data.client.create("scan/sigstore/root_of_trust", info) # create(self, path, body, **kwargs)


@create_sigstore.group("verifier", invoke_without_command=True)
@click.option("--root_name", required=True, help="Root of trust name")
@click.option("--name", required=True, help="Verifier name")
@click.option("--verifier_type", default='keyless', type=click.Choice(['keyless', 'keypair']), help="Verifier type")
@click.option("--public_key", is_flag=True, default=False, help="Set this flag for Public Key. Only for 'keypair' verifier type")
@click.option("--cert_issuer", default="", help="Certificate issuer. Only for keyless verifier type")
@click.option("--cert_subject", default="", help="Certificate subject. Only for keyless verifier type")
@click.option("--comment", default="", help="Comment")
@click.pass_obj
def create_sigstore_verifier(data, root_name, name, verifier_type, public_key, cert_issuer, cert_subject, comment):
    """Create verifier in root of trust."""

    if root_name == "":
        click.echo("--root_name value cannot be empty string")
        click.echo("")
        return
    if name == "":
        click.echo("--name value cannot be empty string")
        click.echo("")
        return

    public_key_value = ""
    if verifier_type == "keypair":
        if public_key is True:
            public_key_value = get_user_input("Public Key")
        if public_key_value == "":
            click.echo("Public Key(--public_key) cannot be empty string for keypair verifier type")
            click.echo("")
            return
    if verifier_type == "keyless" and (cert_issuer == "" or cert_subject == ""):
        click.echo("--cert_issuer and --cert_subject value cannot be empty string for keyless verifier type")
        click.echo("")
        return

    info = {
        "name": name,
        "verifier_type": verifier_type,
        "public_key": public_key_value,
        "cert_issuer": cert_issuer,
        "cert_subject": cert_subject,
        "comment": comment
    }

    urlStr = "scan/sigstore/root_of_trust/{}/verifier".format(root_name)
    data.client.create(urlStr, info)  # create(self, path, body, **kwargs)


# config

@set.group('sigstore')
@click.pass_obj
def set_sigstore(data):
    """Configure sigstore."""


@set_sigstore.group("root_of_trust", invoke_without_command=True)
@click.option("--root_name", required=True, help="Root of trust name")
@click.option("--rekor_public_key", is_flag=True, default=False, help="Set this flag for configuring Rekor Public Key")
@click.option("--root_cert", is_flag=True, default=False, help="Set this flag for configuring Root Certificate")
@click.option("--sct_public_key", is_flag=True, default=False, help="Set this flag for configuring SCT Public Key")
@click.option("--comment", default=None, help="Comment")
@click.pass_obj
def set_sigstore_rootoftrust(data, root_name, rekor_public_key, root_cert, sct_public_key, comment):
    """Configure root of trust."""

    if root_name == "":
        click.echo("--root_name value cannot be empty string")
        click.echo("")
        return
    if root_cert == "":
        click.echo("--root_cert value cannot be empty string")
        click.echo("")
        return

    info = {}

    if rekor_public_key is True:
        info["rekor_public_key"] = get_user_input("Rekor Public Key")
    if root_cert is True:
        info["root_cert"] = get_user_input("Root Certificate")
    if sct_public_key is True:
        info["sct_public_key"] = get_user_input("SCT Public Key")
    if comment is not None:
        info["comment"] = comment

    data.client.config("scan/sigstore/root_of_trust", root_name, info) # config(self, path, obj_id, body, **kwargs):
    
    
@set_sigstore.group("verifier", invoke_without_command=True)
@click.option("--root_name", required=True, help="Root of trust name")
@click.option("--name", required=True, help="Verifier name")
@click.option("--verifier_type", default=None, type=click.Choice(['keyless', 'keypair']), help="Verifier type")
@click.option("--public_key", is_flag=True, default=False, help="Set this flag for Public Key. Only for 'keypair' verifier type")
@click.option("--cert_issuer", default=None, help="Certificate issuer")
@click.option("--cert_subject", default=None, help="Certificate subject")
@click.option("--comment", default=None, help="Comment")
@click.pass_obj
def set_sigstore_verifier(data, root_name, name, verifier_type, public_key, cert_issuer, cert_subject, comment):
    """Configure verifier in root of trust."""

    if root_name == "":
        click.echo("--root_name value cannot be empty string")
        click.echo("")
        return
    if name == "":
        click.echo("--name value cannot be empty string")
        click.echo("")
        return

    info = {}

    if verifier_type is not None:
        info["verifier_type"] = verifier_type
    if public_key is True:
        info["public_key"] = get_user_input("Public Key")
    if cert_issuer is not None:
        info["cert_issuer"] = cert_issuer
    if cert_subject is not None:
        info["cert_subject"] = cert_subject
    if comment is not None:
        info["comment"] = comment

    urlStr = "scan/sigstore/root_of_trust/{}/verifier".format(root_name)
    data.client.config(urlStr, name, info) # config(self, path, obj_id, body, **kwargs):
    
    
# delete

@delete.group('sigstore')
@click.pass_obj
def delete_sigstore(data):
    """Delete sigstore."""


@delete_sigstore.group('root_of_trust', invoke_without_command=True)
@click.option("--root_name", required=True, help="Root of trust name")
@click.pass_obj
def delete_sigstore_rootoftrust(data, root_name):
    """Delete root of trust."""

    if root_name == "":
        click.echo("--root_name value cannot be empty string")
        click.echo("")
        return

    data.client.delete("scan/sigstore/root_of_trust", root_name) # delete(self, path, obj_id, **kwargs)


@delete_sigstore.group('verifier', invoke_without_command=True)
@click.option("--root_name", required=True, help="Root of trust name")
@click.option("--name", required=True, help="Verifier name")
@click.pass_obj
def delete_sigstore_verifier(data, root_name, name):
    """Delete verifier in root of trust."""

    if root_name == "":
        click.echo("--root_name value cannot be empty string")
        click.echo("")
        return
    if name == "":
        click.echo("--name value cannot be empty string")
        click.echo("")
        return

    urlStr = "scan/sigstore/root_of_trust/{}/verifier".format(root_name)
    data.client.delete(urlStr, name) # delete(self, path, obj_id, **kwargs)
