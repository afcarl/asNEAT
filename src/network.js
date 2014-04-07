
var Utils = require('asNEAT/utils')['default'],
    NoteOscillatorNode = require('asNEAT/nodes/noteOscillatorNode')['default'],
    OscillatorNode = require('asNEAT/nodes/oscillatorNode')['default'],
    OutNode = require('asNEAT/nodes/outNode')['default'],
    Connection = require('asNEAT/connection')['default'],
    nodeTypes = require('asNEAT/asNEAT')['default'].nodeTypes,
    log = Utils.log,
    name = "Network";

var Network = function(parameters) {
  Utils.extend(this, this.defaultParameters, parameters);

  if (this.nodes.length===0) {
    this.nodes.push(NoteOscillatorNode.random());
    this.nodes.push(new OutNode());
  }
  if (this.connections.length===0) {
    this.connections.push(new Connection({
      sourceNode: this.nodes[0],
      targetNode: this.nodes[1],
      weight: 0.1
    }));
  }
};

Network.prototype.name = name;
Network.prototype.defaultParameters = {
  nodes: [],
  connections: [],
  connectionMutationRate: 0.1,
  nodeMutationRate: 0.1
};
/*
  Creates a deep clone of this network
 */
Network.prototype.clone = function() {

  // Clone each node
  var clonedNodes = [];
  _.forEach(this.nodes, function(node) {
    clonedNodes.push(node.clone());
  });

  // Clone each connection
  var clonedConnections = [];
  _.forEach(this.connections, function(connection) {
    var clonedsourceNode = _.find(clonedNodes, {id: connection.sourceNode.id});
    var clonedtargetNode = _.find(clonedNodes, {id: connection.targetNode.id});

    clonedConnections.push(connection.clone(clonedsourceNode, clonedtargetNode));
  });

  return new Network({
    nodes: clonedNodes,
    connections: clonedConnections,
    connectionMutationRate: this.connectionMutationRate,
    nodeMutationRate: this.nodeMutationRate
  });
};
Network.prototype.play = function() {
  playPrep.call(this);

  // play the oscillators
  // TODO: Better way to access just the oscillator nodes
  _.forEach(this.nodes, function(node) {
    if (node.play)
      node.play();
  });

  return this;
};

/**
  Plays the network until the return handler is called
  @return function stop
**/
Network.prototype.playHold = function() {
  playPrep.call(this);

  var stopHandlers = [];

  // play the oscillators
  // TODO: Better way to access just the oscillator nodes
  _.forEach(this.nodes, function(node) {
    if (node.playHold)
      stopHandlers.push(node.playHold());
  });

  return function stop() {
    _.forEach(stopHandlers, function(handler) {
      handler();
    });
  };
};
function playPrep() {
  // refresh all the nodes since each can only play 
  // once (note: changing in the current webAudio draft)
  _.forEach(this.nodes, function(node) {
    node.refresh();
  });

  // setup all the connections
  _.forEach(this.connections, function(connection) {
    connection.connect();
  });
}

Network.prototype.mutate = function() {
  var mutations = [
    {weight: 0.2, element: this.splitMutation},
    {weight: 0.2, element: this.addOscillator},
    {weight: 0.2, element: this.addConnection},
    {weight: 0.2, element: this.mutateConnectionWeights},
    {weight: 0.2, element: this.mutateNodeParameters}
  ];
  var mutation = Utils.weightedSelection(mutations);
  mutation.call(this);

  // TODO: Other mutations?

  return this;
};

/*
  Randomly select a connection to split in two
*/
Network.prototype.splitMutation = function() {
  // Randomly select a connection
  var connections = this.getEnabledConnections(),
      connsLen = connections.length,
      randomI = Utils.randomIndexIn(0, connsLen),
      conn = connections[randomI],
      typesLen = nodeTypes.length,
      typesI = Utils.randomIndexIn(0, typesLen),
      selectedType = nodeTypes[typesI],
      Node = require('asNEAT/nodes/'+selectedType)['default'];

  // TODO: Create a random new node

  // The first new connection matches the same weight
  // as the old one and the new connection after the 
  // split node is 1.0
  var newNode = Node.random(),
      toConnection = new Connection({
        sourceNode: conn.sourceNode,
        targetNode: newNode,
        weight: conn.weight
      }),
      fromConnection = new Connection({
        sourceNode: newNode,
        targetNode: conn.targetNode
      });

  conn.disable();
  this.nodes.push(newNode);
  this.connections.push(toConnection);
  this.connections.push(fromConnection);

  log('splitting conn '+conn.toString()+' with '+newNode.toString());

  return this;
};

/*
  Adds a single oscillator and connects it to a random input
  in one of the current nodes
 */
Network.prototype.addOscillator = function() {

  // TODO: Pick whether an oscillator (FM) or a note oscillator (keyboard)
  var oscillator = NoteOscillatorNode.random();
  
  // TODO: Allow FM connections (to node parameters)
  // Pick a random non oscillator node
  var possibleTargets = _.filter(this.nodes, function(node) {
    return node.name !== "OscillatorNode" &&
           node.name !== "NoteOscillatorNode";
  });

  var target = Utils.randomElementIn(possibleTargets);

  var connection = new Connection({
    sourceNode: oscillator,
    targetNode: target,
    weight: 0.5
  });

  this.nodes.push(oscillator);
  this.connections.push(connection);

  log('adding oscillator '+oscillator.toString());

  return this;
};

Network.prototype.addConnection = function() {
  var possibleConns = this.getPossibleNewConnections();
  if (possibleConns.length===0) {
    log('no possible Connections');
    return this;
  }

  var newConnection = Utils.randomElementIn(possibleConns);
  this.connections.push(newConnection);
  log('new connection: '+newConnection.toString());

  return this;
};
  Network.prototype.getPossibleNewConnections = function() {
    // TODO: Just build the potential connections when new nodes are added removed?
    //       perfomance hit when adding new nodes, but don't have to O(n^2) for adding a new connection.
    //       Would have to regenerate on copy though

    // TODO: Allow connections to parameters for FM synthesis
    var self = this,
        connections = [];

    // Loop through all non output nodes
    _.forEach(this.nodes, function(sourceNode) {
      if (sourceNode.name==="OutNode") 
        return;
      // Create possible connection if it (or its inverse)
      // doesn't exist already
      _.forEach(self.nodes, function(targetNode) {
        if (targetNode.name==="OscillatorNode" ||
            targetNode.name==="NoteOscillatorNode")
          return;
        if (sourceNode===targetNode)
          return;

        var connExists = _.find(self.connections, function(conn) {
          return (conn.sourceNode === sourceNode &&
                  conn.targetNode === targetNode) ||
                 (conn.sourceNode === targetNode &&
                  conn.targetNode === sourceNode);
        });
        if (!connExists)
          connections.push(new Connection({
            sourceNode: sourceNode,
            targetNode: targetNode,
            // less than one to decrease risk of harsh feedback
            weight: 0.5
          }));
      });
    });
      
    return connections;
  };

/*
  @param forceMutation {bool} (default: true) Makes at least one connection mutate
*/
Network.prototype.mutateConnectionWeights = function(forceMutation) {
  if (typeof(forceMutation)==='undefined') forceMutation = true;

  var mutationRate = this.connectionMutationRate,
      anyMutations = false;
  _.forEach(this.connections, function(conn) {
    if (Utils.random() <= mutationRate) {
      conn.mutate();
      anyMutations = true;
    }
  });

  // If no connections were mutated and forcing a mutation
  // mutate a random one
  if (!anyMutations && forceMutation) {
    log('forcing weight mutation');
    var conn = Utils.randomElementIn(this.connections);
    conn.mutate();
  }

  return this;
};

Network.prototype.mutateNodeParameters = function(forceMutation) {
  if (typeof(forceMutation)==='undefined') forceMutation = true;

  var mutationRate = this.nodeMutationRate,
      anyMutations = false;
  _.forEach(this.nodes, function(node) {
    if (Utils.random() <= mutationRate) {
      node.mutate();
      anyMutations = true;
    }
  });

  // If no nodes were mutated and forcing a mutation
  // mutate a random one
  if (!anyMutations && forceMutation) {
    log('forcing node mutation');
    var node = Utils.randomElementIn(this.nodes);
    node.mutate();
  }

  return this;
};

Network.prototype.getEnabledConnections = function() {
  return _.filter(this.connections, 'enabled');
};

Network.prototype.getNoteOscillatorNodes = function() {
  return _.filter(this.nodes, {name: 'NoteOscillatorNode'});
};

Network.prototype.toString = function() {
  var str = "Nodes:<br>";
  _.forEach(this.nodes, function(ele) {
    str+=ele.toString()+"<br>";
  });

  str += "<br>Connections:<br>";
  _.forEach(this.connections, function(ele) {
    str+=ele.toString()+"<br>";
  });

  return str;
};

export default Network;