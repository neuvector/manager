import cmd2
import itertools
import shlex
import sys

from prog.client import Unauthorized
from prog.client import RestException

from prog import admission
from prog import assessment
from prog import auth
from prog import bench
from prog import cli
from prog import client
from prog import cluster
from prog import compliance
from prog import controller
from prog import convers
from prog import diag
from prog import dlp
from prog import waf
from prog import domain
from prog import enforcer
from prog import federation
from prog import file_access
from prog import host
from prog import log
from prog import group
from prog import policy
from prog import process
from prog import pwd_profile
from prog import registry
from prog import repository
from prog import role
from prog import scan
from prog import server
from prog import system
from prog import workload

# _BUILTIN_CMDS = set(
#    ["_load", "_relative_load", "cmdenvironment", "ed", "edit",
#     "hi", "history", "l", "li", "list", "load", "pause", "py",
#     "r", "run", "save", "set", "shell", "shortcuts", "show"])

invalidArgMsg = """
Error: Invalid argument.

To use comparison operators(>, >=, <, <=) in the --criteria option value, enclose it in double quotation marks.
Example:  --criteria "cveHighCount:>=:5"
"""


class InteractiveCLI(cmd2.Cmd, object):
    intro = 'Welcome to the NeuVector command line. Type help or ? to list commands.\n'

    def __init__(self, ctx):
        self.ctx = ctx
        self._set_prompt('', '', ctx.server_ip)

        cmd2.Cmd.__init__(self)

    def postparsing_precmd(self, args):
        stop, statement = super(InteractiveCLI, self).postparsing_precmd(args)
        if len(statement.parsed) > 2:
            if statement.parsed[0] == "set" or statement.parsed[0] == "create":
                if statement.parsed[1].find("admission rule ") >= 0:
                    ops = [">", "<"]
                    for idx in range(2, len(statement.parsed)):
                        for op in ops:
                            if statement.parsed[idx].find(op) >= 0:
                                raise Exception(invalidArgMsg)
        return stop, statement

    def _set_prompt(self, username, domain, server_ip):
        if not hasattr(sys.stdin, 'isatty') or sys.stdin.isatty():
            if username:
                if client.RemoteCluster["id"] != "":
                    server_ip = "joint.{}".format(client.RemoteCluster["id"])
                if domain:
                    self.prompt = '%s@%s#%s> ' % (username, domain, server_ip)
                else:
                    self.prompt = '%s#%s> ' % (username, server_ip)
            else:
                self.prompt = '#%s> ' % server_ip
        else:
            self.prompt = ''

    def _is_builtin_cmd(self, args):
        method_name = '_'.join(
            itertools.chain(
                ['do'],
                itertools.takewhile(lambda x: not x.startswith('-'), args)
            )
        )
        return True if hasattr(self, method_name) else False

    def do_help(self, args):
        self.default(args)

    def do_shell(self, args):
        self.default(args)

    def precmd(self, line):
        args = shlex.split(line.raw)
        if len(args) > 0:
            if args[0] == "help":
                return line
            if args[0] == "?":
                return "help"
            if self._is_builtin_cmd([args[0]]):
                # Modify the command to disable builtin commands
                return "builtin " + line.raw

        return "cli " + line.raw

    def postcmd(self, stop, line):
        self._set_prompt(self.ctx.username, self.ctx.domain, self.ctx.server_ip)
        if line == "cli exit" or line == "exit":
            return True
        return stop

    def default(self, line):
        args = shlex.split(line)
        # Forward help command with expected format
        if len(args) > 0 and args[0] == "help":
            args[0] = "--help"
        if len(args) > 0 and args[0] == "builtin":
            sys.argv[1:] = args[1:]
        else:
            sys.argv[1:] = args

        # Capture click' ctx.exit() call so cmd2 can move smoothly
        try:
            cli.cli()
        except Unauthorized:
            self.ctx.username = None
            self.ctx.domain = None
            print("Error: Unauthorized! Login first.")
        except RestException as e:
            print("Error: %s" % e.msg)
        except SystemExit:
            pass


def main(debug, server, port):
    ctx_data = cli.init_context_data(debug, server, port)
    if not ctx_data:
        return

    ic = InteractiveCLI(ctx_data)
    ic.cmdloop()
    # cli()
