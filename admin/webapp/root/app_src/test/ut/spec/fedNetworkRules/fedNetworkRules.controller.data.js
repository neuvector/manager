const fedNetworkRulesController = {
  input: {
    initialRules: [
      {
        "action": "allow",
        "applications": ["any"],
        "apps": [],
        "cfg_type": "federal",
        "comment": "",
        "created_timestamp": 1605134476,
        "disable": false,
        "from": "fed.containers",
        "id": 100004,
        "last_modified_timestamp": 1605134476,
        "learned": false,
        "ports": "any",
        "priority": 0,
        "to": "external"
      }, {
        "action": "deny",
        "applications": ["etcd"],
        "apps": [{"name": "etcd"}],
        "cfg_type": "federal",
        "comment": "",
        "created_timestamp": 1604624524,
        "disable": false,
        "from": "fed.containers",
        "id": 100002,
        "last_modified_timestamp": 1604624524,
        "learned": false,
        "ports": "any",
        "priority": 0,
        "to": "fed.nodes"
      }, {
        "action": "deny",
        "applications": ["ElasticSearch"],
        "apps": [{"name": "ElasticSearch"}],
        "cfg_type": "federal",
        "comment": "",
        "created_timestamp": 1604624542,
        "disable": false,
        "from": "fed.containers",
        "id": 100003,
        "last_modified_timestamp": 1604624542,
        "learned": false,
        "ports": "any",
        "priority": 0,
        "to": "fed.nodes"
      }, {
        "action": "allow",
        "applications": ["any"],
        "apps": [],
        "cfg_type": "federal",
        "comment": "",
        "created_timestamp": 1604624508,
        "disable": false,
        "from": "fed.containers",
        "id": 100001,
        "last_modified_timestamp": 1604624508,
        "learned": false,
        "ports": "any",
        "priority": 0,
        "to": "fed.nodes"
      }
    ],
    insertRule_1: {
      "allowed": true,
      "action": "allow",
      "apps": [],
      "applications": ["any"],
      "cfg_type": "federal",
      "comment": "",
      "created_timestamp": 1604624509,
      "disable": false,
      "from": "fed.containers",
      "id": 0,
      "last_modified_timestamp": 1604624509,
      "learned": false,
      "ports": "any",
      "priority": 0,
      "to": "fed.zx"
    },
    insertRule_2: {
      "allowed": true,
      "action": "allow",
      "apps": [{"name": "ElasticSearch"}],
      "applications": ["any"],
      "cfg_type": "federal",
      "comment": "",
      "created_timestamp": 1604624510,
      "disable": false,
      "from": "fed.containers",
      "id": 0,
      "last_modified_timestamp": 1604624510,
      "learned": false,
      "ports": "any",
      "priority": 0,
      "to": "fed.zx2"
    },
    selectedRules_1: [
      {
        "action": "allow",
        "applications": ["any"],
        "apps": [],
        "cfg_type": "federal",
        "comment": "",
        "created_timestamp": 1605134476,
        "disable": false,
        "from": "fed.containers",
        "id": 100004,
        "last_modified_timestamp": 1605134476,
        "learned": false,
        "ports": "any",
        "priority": 0,
        "to": "external"
      }
    ],
    selectedRules_2: [
      {
        "action": "deny",
        "applications": ["ElasticSearch"],
        "apps": [{"name": "ElasticSearch"}],
        "cfg_type": "federal",
        "comment": "test edit, Multiple",
        "created_timestamp": 1604624542,
        "disable": false,
        "from": "fed.containers",
        "id": 100003,
        "last_modified_timestamp": 1604624542,
        "learned": false,
        "ports": "any",
        "priority": 0,
        "to": "fed.nodes",
        "state":"modified-rule"
      }, {
        "action": "allow",
        "applications": ["any"],
        "apps": [],
        "cfg_type": "federal",
        "comment": "",
        "created_timestamp": 1604624508,
        "disable": false,
        "from": "fed.containers",
        "id": 100001,
        "last_modified_timestamp": 1604624508,
        "learned": false,
        "ports": "any",
        "priority": 0,
        "to": "fed.nodes"
      }
    ]
  },
  output: {
    case1: {
      rules: [
        {
          "allowed": true,
        	"action": "allow",
          "apps":[],
        	"applications": [],
        	"cfg_type": "federal",
        	"comment": "",
        	"created_timestamp": 1604624509,
        	"disable": false,
        	"from": "fed.containers",
        	"id": 0,
        	"last_modified_timestamp": 1604624509,
        	"learned": false,
        	"ports": "any",
        	"priority": 0,
        	"to": "fed.zx",
        	"state": "new-rule"
        }, {
        	"id": 100004
        }, {
        	"id": 100002
        }, {
        	"id": 100003
        }, {
        	"id": 100001
        }
      ],
      delete: []
    },
    case2: {
      rules: [
        {
          "id": 100004
        }, {
          "action": "deny",
          "applications": ["etcd"],
          "apps": [{"name": "etcd"}],
          "cfg_type": "federal",
          "comment": "test edit",
          "created_timestamp": 1604624524,
          "disable": false,
          "from": "fed.containers",
          "id": 100002,
          "last_modified_timestamp": 1604624524,
          "learned": false,
          "ports": "any",
          "priority": 0,
          "to": "fed.nodes",
          "state":"modified-rule"
        }, {
          "id": 100003
        }, {
          "id": 100001
        }
      ],
      delete: []
    },
    case3: {delete: [
      100004
    ]},
    case4: {delete: [
      100002
    ]},
    case5: {
      rules: [
        {
          "id": 100002
        }, {
          "id": 100004
        }, {
          "id": 100003
        }, {
          "id": 100001
        }
      ],
      delete: []
    },
    case6: {
      rules: [
        {
          "allowed": true,
          "action": "allow",
          "apps": [],
          "applications": [],
          "cfg_type": "federal",
          "comment": "",
          "created_timestamp": 1604624509,
          "disable": false,
          "from": "fed.containers",
          "id": 0,
          "last_modified_timestamp": 1604624509,
          "learned": false,
          "ports": "any",
          "priority": 0,
          "to": "fed.zx",
          "state": "new-rule"
        }, {
          "action": "deny",
          "applications": ["ElasticSearch"],
          "apps": [{"name": "ElasticSearch"}],
          "cfg_type": "federal",
          "comment": "test edit, Multiple",
          "created_timestamp": 1604624542,
          "disable": false,
          "from": "fed.containers",
          "id": 100003,
          "last_modified_timestamp": 1604624542,
          "learned": false,
          "ports": "any",
          "priority": 0,
          "to": "fed.nodes",
          "state":"modified-rule"
        }, {
          "id": 100004
        },{
          "id": 100001
        }, {
          "allowed": true,
          "action": "allow",
          "apps": [{"name": "ElasticSearch"}],
          "applications": ["ElasticSearch"],
          "cfg_type": "federal",
          "comment": "",
          "created_timestamp": 1604624510,
          "disable": false,
          "from": "fed.containers",
          "id": 0,
          "last_modified_timestamp": 1604624510,
          "learned": false,
          "ports": "any",
          "priority": 0,
          "to": "fed.zx2",
          "state": "new-rule"
        }
      ],
      delete: [100002]
    },
    case7: {delete: [
      100004,
      100003
    ]},
    case8: {
      rules: [
        {
          "id": 100004
        },
        {
          "allowed": true,
          "action": "allow",
          "apps": [{"name": "ElasticSearch"}],
          "applications": ["ElasticSearch"],
          "cfg_type": "federal",
          "comment": "",
          "created_timestamp": 1604624510,
          "disable": false,
          "from": "fed.containers",
          "id": 0,
          "last_modified_timestamp": 1604624510,
          "learned": false,
          "ports": "any",
          "priority": 0,
          "to": "fed.zx2",
          "state": "new-rule"
        },
        {
          "id": 100001
        }
      ],
      delete: [100002, 100003]
    },
    case9: {
      rules: [
        {
          "action": "deny",
          "applications": ["ElasticSearch"],
          "apps": [{"name": "ElasticSearch"}],
          "cfg_type": "federal",
          "comment": "test edit, Multiple",
          "created_timestamp": 1604624542,
          "disable": false,
          "from": "fed.containers",
          "id": 100003,
          "last_modified_timestamp": 1604624542,
          "learned": false,
          "ports": "any",
          "priority": 0,
          "to": "fed.nodes",
          "state":"modified-rule"
        },
        {
          "id": 100001
        }
      ],
      delete: [100004, 100002]
    },
    case10: {
      rules: [
        {
          "id": 100002
        },
        {
          "id": 100004
        },
        {
          "id": 100001
        }
      ],
      delete: [100003]
    },
    case11: {
      rules: [
        {
          "id": 100004
        },
        {
          "id": 100002
        },
        {
          "allowed": true,
          "action": "allow",
          "apps": [{"name": "ElasticSearch"}],
          "applications": ["ElasticSearch"],
          "cfg_type": "federal",
          "comment": "",
          "created_timestamp": 1604624510,
          "disable": false,
          "from": "fed.containers",
          "id": 0,
          "last_modified_timestamp": 1604624510,
          "learned": false,
          "ports": "any",
          "priority": 0,
          "to": "fed.zx2",
          "state": "new-rule"
        },
        {
          "id": 100001
        }
      ],
      delete: [100003]
    }
  }
};
