# Neuvector CLI

CLI tool used to control the Neuvector manager.

### Source Code
https://github.com/neuvector/manager

# How to use
## Install requirements
```
pip install -r requirements.txt
```
### If requirements.txt is not available, you use the following contents
```
click==8.1.3
cmd2==2.4.2
prettytable==3.6.0
requests==2.28.1
six==1.15.0
```

### Optional
You can use virtualenv with this project. I have tested it and it doesn't have any weird behaviours with the dependencies.

# Usage

## Startup
You can start up the CLI using `python cli`. Optional flag is `-d` to enable debug output.
```
┌─(~/Projects/nv/manager/cli)
└─(15:53:20 on main)──> python cli
Welcome to the NeuVector command line. Type help or ? to list commands.

#127.0.0.1>
```


## Login
Use the `login` command to login.
```
#127.0.0.1> login
Username: admin
Password: <password>
admin#127.0.0.1>
```

## Help
At any time, you can use the `-h` flag on commands or just drill down the command options to get help. This usually gives you hints and options that you can use. We're using the python `click` package to provide this feature.
```
admin#127.0.0.1> request enforcer
Usage: cli request enforcer [OPTIONS] ID_OR_NAME COMMAND [ARGS]...

  Request enforcer

Options:
  -h, --help  Show this message and exit.

Commands:
  logs     Request enforcer logs
  profile  Profiling enforcer performance.

```


## Examples
### Setting the `policy_mode`
Note that I am in debug mode which provides extra context in the output.
```
admin#127.0.0.1> request system policy_mode discover
URL: POST https://127.0.0.1:10443/v1/system/request
Body:
   {"request": {"policy_mode": "Discover"}}
Response:
   200
admin#127.0.0.1>
```

### Showing System Stats
```
admin#127.0.0.1> show system stats
URL: GET https://127.0.0.1:10443/v1/debug/system/stats
Body:

Response:
   200 {"stats":{"expired_tokens":7,"scan_data_keys":0,"scan_state_keys":9}}
+-----------------+-------+
| Field           | Value |
+-----------------+-------+
| Expired tokens  | 7     |
| Scan state keys | 9     |
| Scan data keys  | 0     |
+-----------------+-------+
```

# Code structure
TBD