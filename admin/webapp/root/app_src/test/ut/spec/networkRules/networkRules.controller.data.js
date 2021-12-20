const networkRulesController = {
  input: {
    initialRules: [
      {
        "action": "allow",
        "applications": ["any"],
        "apps": [],
        "cfg_type": "learned",
        "comment": "",
        "created_timestamp": 1605134476,
        "disable": false,
        "from": "containers",
        "id": 10004,
        "last_modified_timestamp": 1605134476,
        "learned": false,
        "ports": "any",
        "priority": 0,
        "to": "external"
      }, {
        "action": "deny",
        "applications": ["etcd"],
        "apps": [{"name": "etcd"}],
        "cfg_type": "user_created",
        "comment": "",
        "created_timestamp": 1604624524,
        "disable": false,
        "from": "containers",
        "id": 2,
        "last_modified_timestamp": 1604624524,
        "learned": false,
        "ports": "any",
        "priority": 0,
        "to": "nodes"
      }, {
        "action": "deny",
        "applications": ["ElasticSearch"],
        "apps": [{"name": "ElasticSearch"}],
        "cfg_type": "user_created",
        "comment": "",
        "created_timestamp": 1604624542,
        "disable": false,
        "from": "containers",
        "id": 3,
        "last_modified_timestamp": 1604624542,
        "learned": false,
        "ports": "any",
        "priority": 0,
        "to": "nodes"
      }, {
        "action": "allow",
        "applications": ["any"],
        "apps": [],
        "cfg_type": "learned",
        "comment": "",
        "created_timestamp": 1604624508,
        "disable": false,
        "from": "containers",
        "id": 10001,
        "last_modified_timestamp": 1604624508,
        "learned": false,
        "ports": "any",
        "priority": 0,
        "to": "nodes"
      }
    ],
    insertRule_1: {
      "allowed": true,
      "action": "allow",
      "apps": [],
      "applications": ["any"],
      "comment": "",
      "created_timestamp": 1604624509,
      "disable": false,
      "from": "containers",
      "id": 0,
      "last_modified_timestamp": 1604624509,
      "learned": false,
      "ports": "any",
      "priority": 0,
      "to": "nv.zx"
    },
    insertRule_2: {
      "allowed": true,
      "action": "allow",
      "apps": [{"name": "ElasticSearch"}],
      "applications": ["any"],
      "comment": "",
      "created_timestamp": 1604624510,
      "disable": false,
      "from": "containers",
      "id": 0,
      "last_modified_timestamp": 1604624510,
      "learned": false,
      "ports": "any",
      "priority": 0,
      "to": "nv.zx2"
    },
    selectedRules_1: [
      {
        "action": "allow",
        "applications": ["any"],
        "apps": [],
        "cfg_type": "learned",
        "comment": "",
        "created_timestamp": 1605134476,
        "disable": false,
        "from": "containers",
        "id": 10004,
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
        "cfg_type": "user_created",
        "comment": "test edit, Multiple",
        "created_timestamp": 1604624542,
        "disable": false,
        "from": "containers",
        "id": 3,
        "last_modified_timestamp": 1604624542,
        "learned": false,
        "ports": "any",
        "priority": 0,
        "to": "nodes",
        "state":"modified-rule"
      }, {
        "action": "allow",
        "applications": ["any"],
        "apps": [],
        "cfg_type": "learned",
        "comment": "",
        "created_timestamp": 1604624508,
        "disable": false,
        "from": "containers",
        "id": 10001,
        "last_modified_timestamp": 1604624508,
        "learned": false,
        "ports": "any",
        "priority": 0,
        "to": "nodes"
      }
    ]
  },
  output: {
    case1: {
      rules:[
        {
          "allowed": true,
        	"action": "allow",
          "apps":[],
        	"applications": [],
        	"comment": "",
        	"created_timestamp": 1604624509,
        	"disable": false,
        	"from": "containers",
        	"id": 0,
        	"last_modified_timestamp": 1604624509,
        	"learned": false,
        	"ports": "any",
        	"priority": 0,
        	"to": "nv.zx",
        	"state": "new-rule"
        }, {
        	"id": 10004
        }, {
        	"id": 2
        }, {
        	"id": 3
        }, {
        	"id": 10001
        }
      ],
      delete:[]
    },
    case2: {
      rules: [
        {
          "id": 10004
        }, {
          "action": "deny",
          "applications": ["etcd"],
          "apps": [{"name": "etcd"}],
          "cfg_type": "user_created",
          "comment": "test edit",
          "created_timestamp": 1604624524,
          "disable": false,
          "from": "containers",
          "id": 2,
          "last_modified_timestamp": 1604624524,
          "learned": false,
          "ports": "any",
          "priority": 0,
          "to": "nodes",
          "state":"modified-rule"
        }, {
          "id": 3
        }, {
          "id": 10001
        }
      ],
      delete:[]
    },
    case3: {delete: [
      10004
    ]},
    case4: {delete: [
      2
    ]},
    case5: {
      rules: [
        {
          "id": 2
        }, {
          "id": 10004
        }, {
          "id": 3
        }, {
          "id": 10001
        }
      ],
      delete:[]
    },
    case6: {
      rules: [
        {
          "allowed": true,
          "action": "allow",
          "apps": [],
          "applications": [],
          "comment": "",
          "created_timestamp": 1604624509,
          "disable": false,
          "from": "containers",
          "id": 0,
          "last_modified_timestamp": 1604624509,
          "learned": false,
          "ports": "any",
          "priority": 0,
          "to": "nv.zx",
          "state": "new-rule"
        }, {
          "action": "deny",
          "applications": ["ElasticSearch"],
          "apps": [{"name": "ElasticSearch"}],
          "cfg_type": "user_created",
          "comment": "test edit, Multiple",
          "created_timestamp": 1604624542,
          "disable": false,
          "from": "containers",
          "id": 3,
          "last_modified_timestamp": 1604624542,
          "learned": false,
          "ports": "any",
          "priority": 0,
          "to": "nodes",
          "state":"modified-rule"
        }, {
          "id": 10004
        },{
          "id": 10001
        }, {
          "allowed": true,
          "action": "allow",
          "apps": [{"name": "ElasticSearch"}],
          "applications": ["ElasticSearch"],
          "comment": "",
          "created_timestamp": 1604624510,
          "disable": false,
          "from": "containers",
          "id": 0,
          "last_modified_timestamp": 1604624510,
          "learned": false,
          "ports": "any",
          "priority": 0,
          "to": "nv.zx2",
          "state": "new-rule"
        }
      ],
      delete:[2]
    },
    case7: {delete: [
      10004,
      2
    ]},
    case8: {
      rules: [
        {
          "id": 10004
        },
        {
          "allowed": true,
          "action": "allow",
          "apps": [{"name": "ElasticSearch"}],
          "applications": ["ElasticSearch"],
          "comment": "",
          "created_timestamp": 1604624510,
          "disable": false,
          "from": "containers",
          "id": 0,
          "last_modified_timestamp": 1604624510,
          "learned": false,
          "ports": "any",
          "priority": 0,
          "to": "nv.zx2",
          "state": "new-rule"
        },
        {
          "id": 10001
        }
      ],
      delete:[2,3]
    },
    case9: {
      rules: [
        {
          "action": "deny",
          "applications": ["ElasticSearch"],
          "apps": [{"name": "ElasticSearch"}],
          "cfg_type": "user_created",
          "comment": "test edit, Multiple",
          "created_timestamp": 1604624542,
          "disable": false,
          "from": "containers",
          "id": 3,
          "last_modified_timestamp": 1604624542,
          "learned": false,
          "ports": "any",
          "priority": 0,
          "to": "nodes",
          "state":"modified-rule"
        },
        {
          "id": 10001
        }
      ],
      delete:[10004,2]
    },
    case10: {
      rules: [
        {
          "id": 2
        },
        {
          "id": 10004
        },
        {
          "id": 10001
        }
      ],
      delete:[3]
    },
    case11: {
      rules: [
        {
          "id": 10004
        },
        {
          "id": 2
        },
        {
          "allowed": true,
          "action": "allow",
          "apps": [{"name": "ElasticSearch"}],
          "applications": ["ElasticSearch"],
          "comment": "",
          "created_timestamp": 1604624510,
          "disable": false,
          "from": "containers",
          "id": 0,
          "last_modified_timestamp": 1604624510,
          "learned": false,
          "ports": "any",
          "priority": 0,
          "to": "nv.zx2",
          "state": "new-rule"
        },
        {
          "id": 10001
        }
      ],
      delete:[3]
    }
  }
};
