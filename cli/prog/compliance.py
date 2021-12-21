import click

from cli import show
import client
import output

def _list_compliance_entry_display_format(e):
    f = "tags"
    if e.get(f):
        e[output.key_output(f)] = ",".join(e[f])


@show.group('compliance')
@click.pass_obj
def show_compliance(data):
    """Show compliance information."""

@show_compliance.command("profile")
@click.argument("name")
@click.pass_obj
def show_compliance_profile(data, name):
    """Show compliance profile."""
    profile = data.client.show("compliance/profile", "profile", name)
    if not profile:
        return

    entries = profile["entries"]
    for e in entries:
        _list_compliance_entry_display_format(e)

    columns = ("test_number", "tags")
    output.list(columns, profile["entries"])

