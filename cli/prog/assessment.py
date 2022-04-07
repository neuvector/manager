import click
import requests

from prog.cli import request
from prog import output


@request.group("assessment")
@click.pass_obj
def request_assessment(data):
    """Request assessment operation."""


@request_assessment.command("admission_rule")
@click.option('--filename', type=click.Path(dir_okay=False, exists=True, resolve_path=True))
@click.pass_obj
def request_assessment_admission_rule(data, filename):
    """Assess admission control rules."""
    try:
        resp = data.client.assess_admission_rules("assess/admission/rule", filename, True)
        if resp.status_code == requests.codes.ok:
            respJson = resp.json()
            click.echo("")
            click.echo("Properties unavailable for assessing admission control rules:")
            click.echo(", ".join(respJson["props_unavailable"]))
            click.echo("")
            result = respJson["results"]
            columns = ("index", "kind", "name", "allowed", "message")
            output.list(columns, result)
        else:
            click.echo("Error: unexpected response {}", resp)
    except IOError:
        click.echo("Error: Failed to read file %s" % click.format_filename(filename))
    click.echo("")
