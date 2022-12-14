"use strict";
var import_vitest = require("vitest");
var import_test = require("../../../test");
var import_cache = require("../cache");
const config = (0, import_test.testConfigFile)();
(0, import_vitest.test)("root subscribe - field change", function() {
  const cache = new import_cache.Cache(config);
  const selection = {
    viewer: {
      type: "User",
      keyRaw: "viewer",
      fields: {
        id: {
          type: "ID",
          keyRaw: "id"
        },
        firstName: {
          type: "String",
          keyRaw: "firstName"
        },
        favoriteColors: {
          type: "String",
          keyRaw: "favoriteColors"
        }
      }
    }
  };
  cache.write({
    selection,
    data: {
      viewer: {
        id: "1",
        firstName: "bob",
        favoriteColors: ["red", "green", "blue"]
      }
    }
  });
  const set = import_vitest.vi.fn();
  cache.subscribe({
    rootType: "Query",
    selection,
    set
  });
  cache.write({
    selection,
    data: {
      viewer: {
        id: "1",
        firstName: "mary"
      }
    }
  });
  (0, import_vitest.expect)(set).toHaveBeenCalledWith({
    viewer: {
      firstName: "mary",
      favoriteColors: ["red", "green", "blue"],
      id: "1"
    }
  });
});
(0, import_vitest.test)("root subscribe - linked object changed", function() {
  const cache = new import_cache.Cache(config);
  const selection = {
    viewer: {
      type: "User",
      keyRaw: "viewer",
      fields: {
        id: {
          type: "ID",
          keyRaw: "id"
        },
        firstName: {
          type: "String",
          keyRaw: "firstName"
        },
        favoriteColors: {
          type: "String",
          keyRaw: 'favoriteColors(where: "foo")',
          nullable: true
        }
      }
    }
  };
  cache.write({
    selection,
    data: {
      viewer: {
        id: "1",
        firstName: "bob",
        favoriteColors: ["red", "green", "blue"]
      }
    }
  });
  const set = import_vitest.vi.fn();
  cache.subscribe({
    rootType: "Query",
    selection,
    set
  });
  cache.write({
    selection,
    data: {
      viewer: {
        id: "2",
        firstName: "mary"
      }
    }
  });
  (0, import_vitest.expect)(set).toHaveBeenCalledWith({
    viewer: {
      firstName: "mary",
      favoriteColors: null,
      id: "2"
    }
  });
  cache.write({
    selection: {
      firstName: {
        type: "String",
        keyRaw: "firstName"
      }
    },
    data: {
      firstName: "Michelle"
    },
    parent: "User:2"
  });
  (0, import_vitest.expect)(set).toHaveBeenCalledTimes(2);
  (0, import_vitest.expect)(set).toHaveBeenLastCalledWith({
    viewer: {
      firstName: "Michelle",
      id: "2",
      favoriteColors: null
    }
  });
  (0, import_vitest.expect)(cache._internal_unstable.subscriptions.get("User:1", "firstName")).toHaveLength(0);
});
(0, import_vitest.test)("subscribing to null object doesn't explode", function() {
  const cache = new import_cache.Cache(config);
  const selection = {
    viewer: {
      type: "User",
      keyRaw: "viewer",
      fields: {
        id: {
          type: "ID",
          keyRaw: "id"
        },
        firstName: {
          type: "String",
          keyRaw: "firstName"
        },
        favoriteColors: {
          nullable: true,
          type: "String",
          keyRaw: 'favoriteColors(where: "foo")'
        }
      }
    }
  };
  cache.write({
    selection,
    data: {
      viewer: null
    }
  });
  const set = import_vitest.vi.fn();
  cache.subscribe({
    rootType: "Query",
    selection,
    set
  });
  cache.write({
    selection,
    data: {
      viewer: {
        id: "2",
        firstName: "mary"
      }
    }
  });
  (0, import_vitest.expect)(set).toHaveBeenCalledWith({
    viewer: {
      firstName: "mary",
      favoriteColors: null,
      id: "2"
    }
  });
});
(0, import_vitest.test)("overwriting a reference with null clears its subscribers", function() {
  const cache = new import_cache.Cache(config);
  const selection = {
    viewer: {
      type: "User",
      keyRaw: "viewer",
      nullable: true,
      fields: {
        id: {
          type: "ID",
          keyRaw: "id"
        },
        firstName: {
          type: "String",
          keyRaw: "firstName"
        },
        favoriteColors: {
          type: "String",
          keyRaw: 'favoriteColors(where: "foo")'
        }
      }
    }
  };
  cache.write({
    selection,
    data: {
      viewer: {
        id: "2",
        firstName: "mary"
      }
    }
  });
  const set = import_vitest.vi.fn();
  cache.subscribe({
    rootType: "Query",
    selection,
    set
  });
  cache.write({
    selection,
    data: {
      viewer: null
    }
  });
  (0, import_vitest.expect)(set).toHaveBeenCalledWith({
    viewer: null
  });
  (0, import_vitest.expect)(cache._internal_unstable.subscriptions.get("User:2", "firstName")).toHaveLength(0);
});
(0, import_vitest.test)("overwriting a linked list with null clears its subscribers", function() {
  const cache = new import_cache.Cache(config);
  const selection = {
    viewer: {
      type: "User",
      keyRaw: "viewer",
      fields: {
        id: {
          type: "ID",
          keyRaw: "id"
        },
        friends: {
          type: "User",
          keyRaw: "friends",
          nullable: true,
          fields: {
            firstName: {
              type: "String",
              keyRaw: "firstName"
            },
            id: {
              type: "ID",
              keyRaw: "id"
            }
          }
        }
      }
    }
  };
  const set = import_vitest.vi.fn();
  cache.subscribe({
    rootType: "Query",
    selection,
    set
  });
  cache.write({
    selection,
    data: {
      viewer: {
        id: "1",
        friends: [
          { id: "2", firstName: "Jason" },
          { id: "3", firstName: "Nick" }
        ]
      }
    }
  });
  (0, import_vitest.expect)(cache._internal_unstable.subscriptions.get("User:1", "friends")).toHaveLength(1);
  (0, import_vitest.expect)(cache._internal_unstable.subscriptions.get("User:2", "firstName")).toHaveLength(1);
  (0, import_vitest.expect)(cache._internal_unstable.subscriptions.get("User:3", "firstName")).toHaveLength(1);
  cache.write({
    selection: {
      id: {
        type: "String",
        keyRaw: "id"
      },
      friends: selection.viewer.fields.friends
    },
    data: {
      id: "1",
      friends: null
    },
    parent: "User:1"
  });
  (0, import_vitest.expect)(set).toHaveBeenNthCalledWith(2, {
    viewer: {
      id: "1",
      friends: null
    }
  });
  (0, import_vitest.expect)(cache._internal_unstable.subscriptions.get("User:2", "firstName")).toHaveLength(0);
  (0, import_vitest.expect)(cache._internal_unstable.subscriptions.get("User:3", "firstName")).toHaveLength(0);
});
(0, import_vitest.test)("root subscribe - linked list lost entry", function() {
  const cache = new import_cache.Cache(config);
  const selection = {
    viewer: {
      type: "User",
      keyRaw: "viewer",
      fields: {
        id: {
          type: "ID",
          keyRaw: "id"
        },
        friends: {
          type: "User",
          keyRaw: "friends",
          fields: {
            id: {
              type: "ID",
              keyRaw: "id"
            },
            firstName: {
              type: "String",
              keyRaw: "firstName"
            }
          }
        }
      }
    }
  };
  cache.write({
    selection,
    data: {
      viewer: {
        id: "1",
        friends: [
          {
            id: "2",
            firstName: "jane"
          },
          {
            id: "3",
            firstName: "mary"
          }
        ]
      }
    }
  });
  const set = import_vitest.vi.fn();
  cache.subscribe({
    rootType: "Query",
    selection,
    set
  });
  cache.write({
    selection,
    data: {
      viewer: {
        id: "1",
        friends: [
          {
            id: "2"
          }
        ]
      }
    }
  });
  (0, import_vitest.expect)(set).toHaveBeenCalledWith({
    viewer: {
      id: "1",
      friends: [
        {
          firstName: "jane",
          id: "2"
        }
      ]
    }
  });
  (0, import_vitest.expect)(cache._internal_unstable.subscriptions.get("User:3", "firstName")).toHaveLength(0);
});
(0, import_vitest.test)("subscribing to list with null values doesn't explode", function() {
  const cache = new import_cache.Cache(config);
  const selection = {
    viewer: {
      type: "User",
      keyRaw: "viewer",
      fields: {
        id: {
          type: "ID",
          keyRaw: "id"
        },
        friends: {
          type: "User",
          keyRaw: "friends",
          fields: {
            id: {
              type: "ID",
              keyRaw: "id"
            },
            firstName: {
              type: "String",
              keyRaw: "firstName"
            }
          }
        }
      }
    }
  };
  cache.write({
    selection,
    data: {
      viewer: {
        id: "1",
        friends: [
          {
            id: "2",
            firstName: "jane"
          },
          null
        ]
      }
    }
  });
  const set = import_vitest.vi.fn();
  cache.subscribe({
    rootType: "Query",
    selection,
    set
  });
  cache.write({
    selection,
    data: {
      viewer: {
        id: "1",
        friends: [
          {
            id: "2"
          }
        ]
      }
    }
  });
  (0, import_vitest.expect)(set).toHaveBeenCalledWith({
    viewer: {
      id: "1",
      friends: [
        {
          firstName: "jane",
          id: "2"
        }
      ]
    }
  });
});
(0, import_vitest.test)("root subscribe - linked list reorder", function() {
  const cache = new import_cache.Cache(config);
  const selection = {
    viewer: {
      type: "User",
      keyRaw: "viewer",
      fields: {
        id: {
          type: "ID",
          keyRaw: "id"
        },
        friends: {
          type: "User",
          keyRaw: "friends",
          fields: {
            id: {
              type: "ID",
              keyRaw: "id"
            },
            firstName: {
              type: "String",
              keyRaw: "firstName"
            }
          }
        }
      }
    }
  };
  cache.write({
    selection,
    data: {
      viewer: {
        id: "1",
        friends: [
          {
            id: "2",
            firstName: "jane"
          },
          {
            id: "3",
            firstName: "mary"
          }
        ]
      }
    }
  });
  const set = import_vitest.vi.fn();
  cache.subscribe({
    rootType: "Query",
    set,
    selection
  });
  cache.write({
    selection,
    data: {
      viewer: {
        id: "1",
        friends: [
          {
            id: "3"
          },
          {
            id: "2"
          }
        ]
      }
    }
  });
  (0, import_vitest.expect)(set).toHaveBeenCalledWith({
    viewer: {
      id: "1",
      friends: [
        {
          id: "3",
          firstName: "mary"
        },
        {
          id: "2",
          firstName: "jane"
        }
      ]
    }
  });
  (0, import_vitest.expect)(cache._internal_unstable.subscriptions.get("User:2", "firstName")).toHaveLength(1);
  (0, import_vitest.expect)(cache._internal_unstable.subscriptions.get("User:3", "firstName")).toHaveLength(1);
});
(0, import_vitest.test)("unsubscribe", function() {
  const cache = new import_cache.Cache(config);
  const selection = {
    viewer: {
      type: "User",
      keyRaw: "viewer",
      fields: {
        id: {
          type: "ID",
          keyRaw: "id"
        },
        firstName: {
          type: "String",
          keyRaw: "firstName"
        },
        favoriteColors: {
          type: "String",
          keyRaw: 'favoriteColors(where: "foo")'
        }
      }
    }
  };
  cache.write({
    selection,
    data: {
      viewer: {
        id: "1",
        firstName: "bob",
        favoriteColors: ["red", "green", "blue"]
      }
    }
  });
  const spec = {
    rootType: "Query",
    selection,
    set: import_vitest.vi.fn()
  };
  cache.subscribe(spec);
  (0, import_vitest.expect)(cache._internal_unstable.subscriptions.get("User:1", "firstName")).toHaveLength(1);
  cache.unsubscribe(spec);
  (0, import_vitest.expect)(cache._internal_unstable.subscriptions.get("User:1", "firstName")).toHaveLength(0);
});
(0, import_vitest.test)("subscribe to new list nodes", function() {
  const cache = new import_cache.Cache(config);
  const selection = {
    viewer: {
      type: "User",
      keyRaw: "viewer",
      fields: {
        id: {
          type: "ID",
          keyRaw: "id"
        },
        friends: {
          type: "User",
          keyRaw: "friends",
          list: {
            name: "All_Users",
            connection: false,
            type: "User"
          },
          fields: {
            id: {
              type: "ID",
              keyRaw: "id"
            },
            firstName: {
              type: "String",
              keyRaw: "firstName"
            }
          }
        }
      }
    }
  };
  const set = import_vitest.vi.fn();
  cache.subscribe({
    rootType: "Query",
    set,
    selection
  });
  cache.write({
    selection,
    data: {
      viewer: {
        id: "1",
        friends: [
          {
            id: "2",
            firstName: "jane"
          }
        ]
      }
    }
  });
  cache.write({
    selection: {
      id: {
        type: "String",
        keyRaw: "id"
      },
      firstName: {
        type: "String",
        keyRaw: "firstName"
      }
    },
    data: {
      id: "2",
      firstName: "jane-prime"
    },
    parent: "User:2"
  });
  (0, import_vitest.expect)(set).toHaveBeenNthCalledWith(2, {
    viewer: {
      id: "1",
      friends: [
        {
          firstName: "jane-prime",
          id: "2"
        }
      ]
    }
  });
  cache.write({
    selection,
    data: {
      viewer: {
        id: "1",
        friends: [
          {
            id: "2",
            firstName: "jane-prime"
          },
          {
            id: "3",
            firstName: "mary"
          }
        ]
      }
    }
  });
  cache.write({
    selection: {
      id: {
        type: "String",
        keyRaw: "id"
      },
      firstName: {
        type: "String",
        keyRaw: "firstName"
      }
    },
    data: {
      id: "3",
      firstName: "mary-prime"
    },
    parent: "User:3"
  });
  (0, import_vitest.expect)(set).toHaveBeenNthCalledWith(4, {
    viewer: {
      id: "1",
      friends: [
        {
          firstName: "jane-prime",
          id: "2"
        },
        {
          firstName: "mary-prime",
          id: "3"
        }
      ]
    }
  });
});
(0, import_vitest.test)("variables in query and subscription", function() {
  const cache = new import_cache.Cache(config);
  const selection = {
    viewer: {
      type: "User",
      keyRaw: "viewer",
      fields: {
        id: {
          type: "ID",
          keyRaw: "id"
        },
        friends: {
          type: "User",
          keyRaw: "friends(filter: $filter)",
          list: {
            name: "All_Users",
            connection: false,
            type: "User"
          },
          fields: {
            id: {
              type: "ID",
              keyRaw: "id"
            },
            firstName: {
              type: "String",
              keyRaw: "firstName"
            }
          }
        }
      }
    }
  };
  cache.write({
    selection,
    data: {
      viewer: {
        id: "1",
        friends: [
          {
            id: "2",
            firstName: "jane"
          },
          {
            id: "3",
            firstName: "mary"
          }
        ]
      }
    },
    variables: {
      filter: "foo"
    }
  });
  const set = import_vitest.vi.fn();
  cache.subscribe(
    {
      rootType: "Query",
      selection,
      set,
      variables: () => ({ filter: "foo" })
    },
    {
      filter: "foo"
    }
  );
  (0, import_vitest.expect)(cache.list("All_Users").lists[0].key).toEqual('friends(filter: "foo")');
  cache.write({
    selection,
    data: {
      viewer: {
        id: "1",
        friends: [
          {
            id: "2"
          }
        ]
      }
    },
    variables: {
      filter: "foo"
    }
  });
  (0, import_vitest.expect)(set).toHaveBeenCalledWith({
    viewer: {
      id: "1",
      friends: [
        {
          firstName: "jane",
          id: "2"
        }
      ]
    }
  });
  (0, import_vitest.expect)(cache._internal_unstable.subscriptions.get("User:3", "firstName")).toHaveLength(0);
});
(0, import_vitest.test)("deleting a node removes nested subscriptions", function() {
  const cache = new import_cache.Cache(config);
  const selection = {
    viewer: {
      type: "User",
      keyRaw: "viewer",
      fields: {
        id: {
          type: "ID",
          keyRaw: "id"
        },
        friends: {
          type: "User",
          keyRaw: "friends",
          list: {
            name: "All_Users",
            connection: false,
            type: "User"
          },
          fields: {
            id: {
              type: "ID",
              keyRaw: "id"
            },
            firstName: {
              type: "String",
              keyRaw: "firstName"
            }
          }
        }
      }
    }
  };
  cache.write({
    selection,
    data: {
      viewer: {
        id: "1",
        friends: [
          {
            id: "2",
            firstName: "jane"
          }
        ]
      }
    }
  });
  const set = import_vitest.vi.fn();
  cache.subscribe({
    rootType: "Query",
    selection,
    set
  });
  (0, import_vitest.expect)(cache._internal_unstable.subscriptions.get("User:2", "firstName")).toHaveLength(1);
  cache.delete("User:1");
  (0, import_vitest.expect)(cache._internal_unstable.subscriptions.get("User:2", "firstName")).toHaveLength(0);
});
(0, import_vitest.test)("same record twice in a query survives one unsubscribe (reference counting)", function() {
  const cache = new import_cache.Cache(config);
  const selection = {
    viewer: {
      type: "User",
      keyRaw: "viewer",
      fields: {
        id: {
          type: "ID",
          keyRaw: "id"
        },
        firstName: {
          type: "String",
          keyRaw: "firstName"
        },
        friends: {
          type: "User",
          keyRaw: "friends",
          list: {
            name: "All_Users",
            connection: false,
            type: "User"
          },
          fields: {
            id: {
              type: "ID",
              keyRaw: "id"
            },
            firstName: {
              type: "String",
              keyRaw: "firstName"
            }
          }
        }
      }
    }
  };
  cache.write({
    selection,
    data: {
      viewer: {
        id: "1",
        firstName: "bob",
        friends: [
          {
            id: "1",
            firstName: "bob"
          }
        ]
      }
    },
    variables: {
      filter: "foo"
    }
  });
  const set = import_vitest.vi.fn();
  cache.subscribe(
    {
      rootType: "Query",
      selection,
      set
    },
    {
      filter: "foo"
    }
  );
  (0, import_vitest.expect)(cache._internal_unstable.subscriptions.get("User:1", "firstName")).toHaveLength(1);
  cache.list("All_Users").remove({ id: "1" });
  (0, import_vitest.expect)(cache._internal_unstable.subscriptions.get("User:1", "firstName")).toHaveLength(1);
});
(0, import_vitest.test)("embedded references", function() {
  const cache = new import_cache.Cache(config);
  const selection = {
    viewer: {
      type: "User",
      keyRaw: "viewer",
      fields: {
        id: {
          type: "ID",
          keyRaw: "id"
        },
        friends: {
          type: "User",
          keyRaw: "friends",
          fields: {
            edges: {
              type: "UserEdge",
              keyRaw: "edges",
              fields: {
                node: {
                  type: "User",
                  keyRaw: "node",
                  fields: {
                    id: {
                      type: "ID",
                      keyRaw: "id"
                    },
                    firstName: {
                      type: "String",
                      keyRaw: "firstName"
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  };
  cache.write({
    selection,
    data: {
      viewer: {
        id: "1",
        friends: {
          edges: [
            {
              node: {
                id: "2",
                firstName: "jane"
              }
            },
            {
              node: {
                id: "3",
                firstName: "mary"
              }
            }
          ]
        }
      }
    }
  });
  const set = import_vitest.vi.fn();
  cache.subscribe(
    {
      rootType: "Query",
      selection,
      set
    },
    {
      filter: "foo"
    }
  );
  cache.write({
    selection: {
      user: {
        type: "User",
        keyRaw: "user",
        fields: {
          id: {
            type: "ID",
            keyRaw: "id"
          },
          firstName: {
            type: "String",
            keyRaw: "firstName"
          }
        }
      }
    },
    data: {
      user: {
        id: "2",
        firstName: "not-jane"
      }
    }
  });
  (0, import_vitest.expect)(set).toHaveBeenCalledWith({
    viewer: {
      id: "1",
      friends: {
        edges: [
          {
            node: {
              id: "2",
              firstName: "not-jane"
            }
          },
          {
            node: {
              id: "3",
              firstName: "mary"
            }
          }
        ]
      }
    }
  });
});
(0, import_vitest.test)("self-referencing linked lists can be unsubscribed (avoid infinite recursion)", function() {
  const cache = new import_cache.Cache(config);
  const selection = {
    viewer: {
      type: "User",
      keyRaw: "viewer",
      fields: {
        id: {
          type: "ID",
          keyRaw: "id"
        },
        firstName: {
          type: "String",
          keyRaw: "firstName"
        },
        friends: {
          type: "User",
          keyRaw: "friends",
          fields: {
            id: {
              type: "ID",
              keyRaw: "id"
            },
            firstName: {
              type: "String",
              keyRaw: "firstName"
            },
            friends: {
              type: "User",
              keyRaw: "friends",
              fields: {
                id: {
                  type: "ID",
                  keyRaw: "id"
                },
                firstName: {
                  type: "String",
                  keyRaw: "firstName"
                }
              }
            }
          }
        }
      }
    }
  };
  cache.write({
    selection,
    data: {
      viewer: {
        id: "1",
        firstName: "bob",
        friends: [
          {
            id: "1",
            firstName: "bob",
            friends: [
              {
                id: "1",
                firstName: "bob"
              }
            ]
          }
        ]
      }
    }
  });
  const spec = {
    set: import_vitest.vi.fn(),
    selection,
    rootType: "Query"
  };
  cache.subscribe(spec);
  cache.unsubscribe(spec);
  (0, import_vitest.expect)(cache._internal_unstable.subscriptions.get("User:1", "firstName")).toHaveLength(0);
});
(0, import_vitest.test)("self-referencing links can be unsubscribed (avoid infinite recursion)", function() {
  const cache = new import_cache.Cache(config);
  const selection = {
    viewer: {
      type: "User",
      keyRaw: "viewer",
      fields: {
        id: {
          type: "ID",
          keyRaw: "id"
        },
        firstName: {
          type: "String",
          keyRaw: "firstName"
        },
        friend: {
          type: "User",
          keyRaw: "friend",
          fields: {
            id: {
              type: "ID",
              keyRaw: "id"
            },
            firstName: {
              type: "String",
              keyRaw: "firstName"
            },
            friend: {
              type: "User",
              keyRaw: "friend",
              fields: {
                id: {
                  type: "ID",
                  keyRaw: "id"
                },
                firstName: {
                  type: "String",
                  keyRaw: "firstName"
                },
                friend: {
                  type: "User",
                  keyRaw: "friend",
                  fields: {
                    id: {
                      type: "ID",
                      keyRaw: "id"
                    },
                    firstName: {
                      type: "String",
                      keyRaw: "firstName"
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  };
  cache.write({
    selection,
    data: {
      viewer: {
        id: "1",
        firstName: "bob",
        friend: {
          id: "1",
          firstName: "bob",
          friend: {
            id: "1",
            firstName: "bob",
            friend: {
              id: "1",
              firstName: "bob"
            }
          }
        }
      }
    }
  });
  const spec = {
    set: import_vitest.vi.fn(),
    selection,
    rootType: "Query"
  };
  cache.subscribe(spec);
  cache.unsubscribe(spec);
  (0, import_vitest.expect)(cache._internal_unstable.subscriptions.get("User:1", "firstName")).toHaveLength(0);
});
(0, import_vitest.test)("overwriting a value in an optimistic layer triggers subscribers", function() {
  const cache = new import_cache.Cache(config);
  const selection = {
    viewer: {
      type: "User",
      keyRaw: "viewer",
      fields: {
        id: {
          type: "ID",
          keyRaw: "id"
        },
        firstName: {
          type: "String",
          keyRaw: "firstName"
        },
        favoriteColors: {
          type: "String",
          keyRaw: "favoriteColors"
        }
      }
    }
  };
  cache.write({
    selection,
    data: {
      viewer: {
        id: "1",
        firstName: "bob",
        favoriteColors: ["red", "green", "blue"]
      }
    }
  });
  const set = import_vitest.vi.fn();
  cache.subscribe({
    rootType: "Query",
    selection,
    set
  });
  const layer = cache._internal_unstable.storage.createLayer(true);
  cache.write({
    selection,
    data: {
      viewer: {
        id: "1",
        firstName: "mary"
      }
    },
    layer: layer.id
  });
  (0, import_vitest.expect)(set).toHaveBeenCalledWith({
    viewer: {
      firstName: "mary",
      favoriteColors: ["red", "green", "blue"],
      id: "1"
    }
  });
});
(0, import_vitest.test)("clearing a display layer updates subscribers", function() {
  const cache = new import_cache.Cache(config);
  const selection = {
    viewer: {
      type: "User",
      keyRaw: "viewer",
      fields: {
        id: {
          type: "ID",
          keyRaw: "id"
        },
        firstName: {
          type: "String",
          keyRaw: "firstName"
        },
        favoriteColors: {
          type: "String",
          keyRaw: "favoriteColors"
        }
      }
    }
  };
  cache.write({
    selection,
    data: {
      viewer: {
        id: "1",
        firstName: "bob",
        favoriteColors: ["red", "green", "blue"]
      }
    }
  });
  const set = import_vitest.vi.fn();
  cache.subscribe({
    rootType: "Query",
    selection,
    set
  });
  const layer = cache._internal_unstable.storage.createLayer(true);
  cache.write({
    selection,
    data: {
      viewer: {
        id: "1",
        firstName: "mary"
      }
    },
    layer: layer.id
  });
  (0, import_vitest.expect)(set).toHaveBeenCalledWith({
    viewer: {
      firstName: "mary",
      favoriteColors: ["red", "green", "blue"],
      id: "1"
    }
  });
  layer.clear();
  cache.write({
    selection,
    data: {
      viewer: {
        firstName: "mary",
        favoriteColors: ["red", "green", "blue"],
        id: "1"
      }
    },
    layer: layer.id
  });
  (0, import_vitest.expect)(set).toHaveBeenNthCalledWith(2, {
    viewer: {
      firstName: "mary",
      favoriteColors: ["red", "green", "blue"],
      id: "1"
    }
  });
});
import_vitest.test.todo("can write to and resolve layers");
import_vitest.test.todo("resolving a layer with the same value as the most recent doesn't notify subscribers");
