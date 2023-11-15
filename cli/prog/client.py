import json
import requests

UserDomainDelimiter = "@"

EndpointKindExternal = "external"
EndpointKindContainer = "container"
EndpointKindHostIP = "node_ip"
EndpointKindWorkloadIP = "workload_ip"
EndpointKindGroup = "group"

UserCreatedCfg = "user_created"
FederalCfg = "federal"

RemoteCluster = {"id": ""}
LocalClusterRequests = {
    "/v1/auth",
    "/v1/fed/config",
    "/v1/fed/promote",
    "/v1/fed/demote",
    "/v1/fed/join_token",
    "/v1/fed/join",
    "/v1/fed/leave",
    #   "/v1/fed/tokens"
}

LocalClusterRequestPrefix = {
    "/v1/fed/cluster/",
}

CfgTypeDisplay = {"learned": "learned", "user_created": "user created", "ground": "crd", "federal": "federated",
                  "system_defined": "system defined"}


class RemoteClusterInfo(object):
    def resetRemoteCluster():
        global RemoteCluster
        RemoteCluster = {"id": ""}


class RestException(Exception):
    message = "An unknown exception occurred."

    def __init__(self, **kwargs):
        try:
            super(RestException, self).__init__(self.message % kwargs)
            self.msg = self.message % kwargs
        except Exception:
            super(RestException, self).__init__(self.message)


class LongPollTimeout(RestException):
    message = "Longpoll timeout"


class ConnectionError(RestException):
    message = "Fail to connect to server"


class ConnectTimeout(RestException):
    message = "Connection timeout"


class RequestError(RestException):
    message = "Request error"


class LoginFailure(RestException):
    message = "Invalid login credential."


class TooManyLogin(RestException):
    message = "Too many login."


class AlreadyLogin(RestException):
    message = "User %(user)s already login."


class ResponseError(RestException):
    message = "Unable to parse response: %(msg)s"


class Unauthorized(RestException):
    message = "Not authorized! Login first."


class LoginBlocked(RestException):
    message = "This user is temporarily blocked for login because of too many failed login attempts."


class LoginPwsExpired(RestException):
    message = "Login password is already expired."


class ObjectNotFound(RestException):
    message = "Object not found."


class NotEnoughFilter(RestException):
    message = "More criteria required."


class RestRequestError(RestException):
    message = "%(err)s: %(msg)s"


class RestRequestErrorNoMsg(RestException):
    message = "%(err)s"


class InvalidInputError(RestException):
    message = "%(msg)s"


class RestClient(object):
    RESTErrNotFound = 1
    RESTErrMethodNotAllowed = 2
    RESTErrUnauthorized = 3
    RESTErrOpNotAllowed = 4
    RESTErrTooManyLoginUser = 5
    RESTErrInvalidRequest = 6
    RESTErrObjectNotFound = 7
    RESTErrNotEnoughFilter = 12
    RESTErrUserLoginBlocked = 47
    RESTErrPasswordExpired = 48

    def __init__(self, url, debug):
        self.url = url
        self.debug = debug
        self.sess = requests.Session()
        self.sess.headers.update({"Content-Type": "application/json"})

        try:
            if hasattr(requests.packages.urllib3, "disable_warnings"):
                requests.packages.urllib3.disable_warnings()
        except AttributeError:
            pass

    def _request(self, method, urlLocal, body=None, files=None, decode_req=True, decode_resp=True):
        global RemoteCluster
        url = urlLocal  # ex: "https://neuvector-svc-controller.neuvector:10443/v1/auth"
        if urlLocal.find(self.url) == 0:
            uri = urlLocal[len(self.url):]  # ex: "/v1/auth"
            if RemoteCluster["id"] != "":
                fixURL = True
                if uri in LocalClusterRequests:
                    fixURL = False  # do not change URL
                else:
                    for prefix in LocalClusterRequestPrefix:
                        if prefix == "/v1/fed/cluster/":
                            if uri.find(
                                    prefix) == 0 and method == "DELETE":  # special handling for DELETE("/v1/fed/cluster/{id}")
                                sub = uri[len(prefix):]  # ex: {id}
                                if sub.find("/") < 0:
                                    fixURL = False  # do not change URL
                                    break
                        else:
                            if uri.find(prefix) == 0:
                                fixURL = False  # do not change URL
                                break
                if fixURL:  # this is a request for remote cluster
                    url = "{}/v1/fed/cluster/{}{}".format(self.url, RemoteCluster["id"], uri)
                    # print "[DEBUG] from remote cluster, id: {}\n".format(RemoteCluster["id"])
                    # print "[DEBUG] Sending request to url {}\n".format(url) ##=>
        if self.debug:
            print("URL: " + method + " " + url)
            # for key in self.sess.headers:
            #     print "%s: %s" % (key, self.sess.headers[key])
            print("Body:")
            if decode_req:
                print("  ", json.dumps(body) if body else "")

        try:
            if decode_req:
                body_data = json.dumps(body) if body else ""
                resp = self.sess.request(method, url, data=body_data, files=files,
                                         verify=False)
            else:
                resp = self.sess.request(method, url, data=body, files=files,
                                         verify=False)
        except requests.exceptions.ConnectionError:
            raise ConnectionError()
        except requests.exceptions.Timeout:
            raise ConnectTimeout()
        # except requests.exceptions.RequestException as e:
        except requests.exceptions.RequestException:
            # print e
            raise RequestError()

        try:
            if decode_resp:
                if self.debug:
                    print("Response:")
                    print("  ", resp.status_code, resp.text)
                data = resp.json()
            else:
                data = resp
        except Exception as e:
            data = None

        return resp.status_code, resp.headers, resp.text, data

    def _token(self):
        return self.sess.headers.get("X-Auth-Token")

    def _clear_token(self):
        self.sess.headers.pop("X-Auth-Token", None)

    def _errcode(self, data):
        return data.get("code")

    def _errtxt(self, data):
        return data.get("error")

    def _errmsg(self, data):
        return data.get("message")

    def _handle_common_error(self, status, data):
        if status == requests.codes.not_modified:
            raise LongPollTimeout()
        elif self._errcode(data) == self.RESTErrUnauthorized and status >= 400 and status < 500:
            # Test auth server return Unauthorized with status 500. Should not clear token.
            self._clear_token()
            raise Unauthorized()
        elif self._errcode(data) == self.RESTErrObjectNotFound:
            raise ObjectNotFound()
        else:
            if self._errtxt(data) == self._errmsg(data):
                raise RestRequestErrorNoMsg(err=self._errtxt(data))
            else:
                raise RestRequestError(err=self._errtxt(data), msg=self._errmsg(data))

    def login(self, username, password, new_password):
        if self._token():
            raise AlreadyLogin(user=username)

        pwd = {"username": username, "password": password}
        if new_password is not None and new_password != "":
            pwd["new_password"] = new_password
        body = {"password": pwd}
        status, _, text, data = self._request("POST",
                                              self.url + '/v1/auth',
                                              body=body)
        if status == requests.codes.ok:
            global RemoteCluster
            RemoteCluster = {"id": ""}

            if not data:
                raise ResponseError(msg=text)

            need_to_reset_password = False
            if "need_to_reset_password" in data:
                if data["need_to_reset_password"]:
                    return None, 0, True

            if data.get("token") and data["token"].get("token"):
                token = data["token"]["token"]
                self.sess.headers.update({"X-Auth-Token": token})
                return data["token"], data["password_days_until_expire"], False
            else:
                raise ResponseError(msg=data)
        else:
            if self._errcode(data) == self.RESTErrTooManyLoginUser:
                raise TooManyLogin()
            elif self._errcode(data) == self.RESTErrUserLoginBlocked:
                raise LoginBlocked()
            elif self._errcode(data) == self.RESTErrPasswordExpired:
                raise LoginPwsExpired()
            else:
                raise LoginFailure()

    def logout(self):
        if not self._token():
            return

        try:
            status, _, _, data = self._request("DELETE",
                                               self.url + '/v1/auth')
        except RestException:
            pass

        self._clear_token()
        global RemoteCluster
        RemoteCluster = {"id": ""}

    def list(self, path, obj, sort=None, sort_dir=None, **kwargs):
        if not self._token():
            raise Unauthorized()

        # Make query url with sort parameters
        url = "%s/v1/%s" % (self.url, path)
        if sort or len(kwargs) > 0:
            url += "?"
            if sort:
                if not sort_dir or (sort_dir != "asc" and sort_dir != "desc"):
                    sort_dir = "asc"

                url += "s_%s=%s&" % (sort, sort_dir)
            for key, value in iter(kwargs.items()):
                if key == 'start':
                    url += "start=%s&" % value
                elif key == 'limit':
                    url += "limit=%s&" % value
                elif key == 'brief':
                    url += "brief=%s&" % value
                elif key == 'with_cap':
                    url += "with_cap=%s&" % value
                elif key == 'verbose':
                    url += "verbose=%s&" % value
                elif key == 'view':
                    url += "view=%s&" % value
                elif key == 'scope':
                    url += "scope=%s&" % value
                else:
                    url += "f_%s=%s&" % (key, value)
            url = url.rstrip("&")

        status, _, _, data = self._request("GET", url)

        json_header = obj + "s"
        if status == requests.codes.ok:
            # Don't use 'get', array can be empty
            if json_header in data:
                return data[json_header]
            else:
                raise ResponseError(msg=data)
        else:
            self._handle_common_error(status, data)

    def show(self, path, obj, obj_id, **kwargs):
        if not self._token():
            raise Unauthorized()

        if obj_id == None:
            url = "%s/v1/%s" % (self.url, path)
        else:
            url = "%s/v1/%s/%s" % (self.url, path, obj_id)
        if len(kwargs) > 0:
            url += "?"
            for key, value in iter(kwargs.items()):
                if key == 'brief':
                    url += "brief=%s&" % value
                elif key == 'with_cap':
                    url += "with_cap=%s&" % value
                elif key == 'verbose':
                    url += "verbose=%s&" % value
                elif key == 'view':
                    url += "view=%s&" % value
                elif key == 'scope':
                    url += "scope=%s&" % value
                elif key == 'show':
                    url += "show=%s&" % value
                elif key == 'token_duration':
                    url += "token_duration=%s&" % value
                else:
                    url += "f_%s=%s&" % (key, value)
            url = url.rstrip("&")
        status, _, _, data = self._request("GET", url)

        json_header = obj
        if status == requests.codes.ok:
            if not obj:
                return data
            elif json_header in data:
                return data[json_header]
            else:
                raise ResponseError(msg=data)
        else:
            self._handle_common_error(status, data)

    def create(self, path, body, **kwargs):
        if not self._token():
            raise Unauthorized()

        url = "%s/v1/%s" % (self.url, path)
        if len(kwargs) > 0:
            url += "?"
            for key, value in iter(kwargs.items()):
                url += "f_%s=%s&" % (key, value)
            url = url.rstrip("&")

        status, _, _, data = self._request("POST", url, body=body)

        if status == requests.codes.ok:
            return data

        self._handle_common_error(status, data)

    def config(self, path, obj_id, body, **kwargs):
        if not self._token():
            raise Unauthorized()

        url = "%s/v1/%s/%s" % (self.url, path, obj_id)
        if len(kwargs) > 0:
            url += "?"
            for key, value in iter(kwargs.items()):
                if key == 'scope':
                    url += "scope=%s&" % value
                else:
                    url += "f_%s=%s&" % (key, value)
            url = url.rstrip("&")
        status, _, _, data = self._request("PATCH", url, body=body)

        if status == requests.codes.ok:
            return True

        self._handle_common_error(status, data)

    def delete(self, path, obj_id, **kwargs):
        if not self._token():
            raise Unauthorized()

        if obj_id == None:
            url = "%s/v1/%s" % (self.url, path)
        else:
            url = "%s/v1/%s/%s" % (self.url, path, obj_id)
        if len(kwargs) > 0:
            url += "?"
            for key, value in iter(kwargs.items()):
                if key == 'scope':
                    url += "scope=%s&" % value
                else:
                    url += "f_%s=%s&" % (key, value)
            url = url.rstrip("&")

        status, _, _, data = self._request("DELETE", url)
        if status == requests.codes.ok:
            return True

        self._handle_common_error(status, data)

    def request(self, path, obj, obj_id, body):
        if not self._token():
            raise Unauthorized()

        if obj_id == None:
            status, _, _, data = self._request("POST",
                                               "%s/v1/%s/%s" % (self.url, path, obj),
                                               body=body)
        else:
            status, _, _, data = self._request("POST",
                                               "%s/v1/%s/%s/%s" % (self.url, path, obj, obj_id),
                                               body=body)
        if status == requests.codes.ok:
            return data

        self._handle_common_error(status, data)

    def requestDownload(self, path, obj, obj_id, body):
        if not self._token():
            raise Unauthorized()

        if obj_id == None:
            status, _, text, data = self._request("POST",
                                                  "%s/v1/%s/%s" % (self.url, path, obj),
                                                  body=body)
        else:
            status, _, text, data = self._request("POST",
                                                  "%s/v1/%s/%s/%s" % (self.url, path, obj, obj_id),
                                                  body=body)
        if status == requests.codes.ok:
            return text

        self._handle_common_error(status, data)

    def download(self, path, body, **kwargs):
        if not self._token():
            raise Unauthorized()

        url = "%s/v1/%s" % (self.url, path)
        if len(kwargs) > 0:
            url += "?"
            for key, value in iter(kwargs.items()):
                if key == 'start':
                    url += "start=%s&" % value
                elif key == 'limit':
                    url += "limit=%s&" % value
                else:
                    url += "f_%s=%s&" % (key, value)
            url = url.rstrip("&")

        if body is None:
            status, headers, _, data = self._request("GET", url, decode_resp=False)
        else:
            status, headers, _, data = self._request("GET", url, body=body, decode_resp=False)
        if status == requests.codes.ok:
            return headers, data
        else:
            self._handle_common_error(status, data.json())

    def upload(self, path, filename, raw):
        if not self._token():
            raise Unauthorized()

        url = "%s/v1/%s" % (self.url, path)
        headers = {"X-Auth-Token": self._token()}

        if self.debug:
            print("URL: POST " + url)

        try:
            # import pdb; pdb.set_trace()
            if raw:
                f = open(filename)
                data = f.read()
                f.close()
                headers["Content-Type"] = "text/plain"
                resp = requests.post(url, headers=headers, data=data, verify=False)
            else:
                files = {'configuration': open(filename, 'rb')}
                resp = requests.post(url, headers=headers, files=files, verify=False)
        except requests.exceptions.ConnectionError:
            raise ConnectionError()
        except requests.exceptions.Timeout:
            raise ConnectTimeout()
        except requests.exceptions.RequestException:
            raise RequestError()

        if resp.status_code == requests.codes.ok:
            return True

        if self.debug:
            print("resp: {} {}".format(resp.status_code, resp.text))
        self._handle_common_error(resp.status_code, resp.json())

        return resp

    def assess_admission_rules(self, path, filename, raw):
        if not self._token():
            raise Unauthorized()

        url = "%s/v1/%s" % (
        self.url, path)  # ex: "https://neuvector-svc-controller.neuvector:10443/v1/assess/admission/rule"
        urlLocal = url
        global RemoteCluster
        if urlLocal.find(self.url) == 0:
            uri = urlLocal[len(self.url):]  # ex: "/v1/assess/admission/rule"
            if RemoteCluster["id"] != "":
                # this is a request for remote cluster
                url = "{}/v1/fed/cluster/{}{}".format(self.url, RemoteCluster["id"], uri)
        headers = {"X-Auth-Token": self._token()}

        if self.debug:
            print("URL: POST " + url)

        try:
            # import pdb; pdb.set_trace()
            if raw:
                f = open(filename)
                data = f.read()
                f.close()
                headers["Content-Type"] = "text/plain"
                resp = requests.post(url, headers=headers, data=data, verify=False)
                # status, _, _, data = self._request("POST", url, body=body)
            else:
                files = {'configuration': open(filename, 'rb')}
                resp = requests.post(url, headers=headers, files=files, verify=False)
        except requests.exceptions.ConnectionError:
            raise ConnectionError()
        except requests.exceptions.Timeout:
            raise ConnectTimeout()
        except requests.exceptions.RequestException:
            raise RequestError()

        if self.debug:
            print("resp: {} {}".format(resp.status_code, resp.text))
        if resp.status_code != requests.codes.ok:
            self._handle_common_error(resp.status_code, resp.json())
        return resp

    def importConfig(self, path, filename, raw, standalone, tid, iter, tempToken):
        # iter=0 means triggers import. iter>=1 means starting query import status
        if not self._token():
            raise Unauthorized()

        url = "%s/v1/%s" % (self.url, path) # ex: "https://neuvector-svc-controller.neuvector:10443/v1/file/group/config"
        urlLocal = url
        global RemoteCluster
        if urlLocal.find(self.url) == 0:
            uri = urlLocal[len(self.url):]  # ex: "/v1/file/group/config"
            if RemoteCluster["id"] != "":
                # this is a request for remote cluster
                url = "{}/v1/fed/cluster/{}{}".format(self.url, RemoteCluster["id"], uri)
        headers = {"X-Auth-Token": self._token()}
        if standalone != None:
            headers["X-As-Standalone"] = standalone

        if self.debug:
            print("URL: POST " + url)

        try:
            # import pdb; pdb.set_trace()
            if tid != "":
                headers["X-Transaction-ID"] = tid
                resp = requests.post(url, headers=headers, data="", verify=False)
            elif raw:
                f = open(filename)
                data = f.read()
                f.close()
                headers["Content-Type"] = "text/plain"
                resp = requests.post(url, headers=headers, data=data, verify=False)
            else:
                files = {'configuration': open(filename, 'rb')}
                resp = requests.post(url, headers=headers, files=files, verify=False)
        except requests.exceptions.ConnectionError:
            importData = self.show("file/group", "data", "config")
            if importData["status"] == "importing" or importData["status"] == "preparing":
                raise RestRequestErrorNoMsg(err="Failed to import: Another import is ongoing")
            else:
                raise ConnectionError()
        except requests.exceptions.Timeout:
            raise ConnectTimeout()
        except requests.exceptions.RequestException:
            raise RequestError()

        if self.debug:
            # print "Request:"
            # print(resp.request.url)
            # print(resp.request.headers)
            # print(resp.request.body)
            # print ""
            print("Response:")
            print("  ", resp.status_code, resp.text)
        if resp.status_code == requests.codes.ok:
            return resp

        if tid != "" and iter >= 1:
            if self._errcode(resp.json()) == self.RESTErrUnauthorized and (
                    resp.status_code == 401 or resp.status_code == 408):
                # Use temp token
                self.sess.headers.update({"X-Auth-Token": tempToken})
                resp = self.importConfig(path, filename, raw, standalone, tid, iter, "")
                self._clear_token()
                return resp

        if resp.status_code != requests.codes.partial:
            self._handle_common_error(resp.status_code, resp.json())

        return resp

    def config_system(self, **kwargs):
        if not self._token():
            raise Unauthorized()

        conf = {}
        for key, value in iter(kwargs.items()):
            conf[key] = value

        body = {"config": conf}

        status, _, _, data = self._request("PATCH",
                                           "%s/v1/system/config" % self.url,
                                           body=body)

        if status == requests.codes.ok:
            return True

        self._handle_common_error(status, data)

    def config_system_net(self, **kwargs):
        if not self._token():
            raise Unauthorized()

        conf = {}
        for key, value in kwargs.items():
            conf[key] = value

        body = {"net_config": conf}

        status, _, _, data = self._request("PATCH",
                                           "%s/v1/system/config" % self.url,
                                           body=body)

        if status == requests.codes.ok:
            return True

        self._handle_common_error(status, data)

    def config_system_atmo(self, **kwargs):
        if not self._token():
            raise Unauthorized()

        conf = {}
        for key, value in kwargs.items():
            conf[key] = value

        body = {"atmo_config": conf}

        status, _, _, data = self._request("PATCH",
                                           "%s/v1/system/config" % self.url,
                                           body=body)

        if status == requests.codes.ok:
            return True

        self._handle_common_error(status, data)

    def reset_token(self, token):
        self.sess.headers.update({"X-Auth-Token": token})
