module("Network Tests");
var Network = require('asNEAT/network')['default'];

test('network', function() {
  var a = new Network();
  equal(a.connections.length, 1, "network starts with single connection");
});

test("Same default objects/arrays not referenced by multiple networks", function() {
  var a = new Network();
  var b = new Network();
  notEqual(a.nodes, b.nodes, "Nodes not the same");
});

test("crossWith", function() {
  var a,b,c;
  
  a = new Network();
  c = a.crossWith(a);
  ok(a.nodes.length === c.nodes.length, 
    "crossing with itself contains same number of nodes");
  ok(a.connections.length === c.connections.length, 
    "crossing with itself contains same number of connections");

  a = new Network(),
  b = new Network(),
  c = a.crossWith(b);
  equal(c.nodes.length, a.nodes.length+b.nodes.length-1,
    "Child has same number nodes as a+b, less the shared output node");
  equal(c.connections.length, a.connections.length+b.connections.length,
    "Child has same number connections");

  a = new Network();
  b = a.clone();
  a.splitMutation();
  b.addOscillator();
  c = a.crossWith(b);
  ok(c.nodes.length === (a.nodes.length+1) &&
     c.nodes.length === (b.nodes.length+1),
    "SplitMutation && addOscillator adds correct number nodes");
  ok(c.connections.length === (a.connections.length+1) &&
     c.connections.length === (b.connections.length+2),
    "SplitMutation && addOscillator adds correct number connections");
  ok(_.reduce(c.nodes, function(result, val){
    return result && (
      _.some(a.nodes, {'id': val.id}) ||
      _.some(b.nodes, {'id': val.id})
    );
  }, true), "C contains only nodes found in a and b");
  ok(_.reduce(c.connections, function(result, val){
    return result && (
      _.some(a.connections, {'id': val.id}) ||
      _.some(b.connections, {'id': val.id})
    );
  }, true), "C contains only connections found in a and b");

  equal(c.nodes.length, _.uniq(c.nodes, true, 'id').length,
    "C contains no duplicate nodes");
  equal(c.connections.length, _.uniq(c.connections, true, 'id').length,
    "C contains no duplicate connections");
});

test("split node", function() {
  var a = new Network(),
      connection = a.connections[0];

  a.splitMutation();
  equal(a.connections.length, 3, "connections increased (1_old+2_new)");
  ok(!connection.enabled, "old connection is disabled");
});

test("getNoteOscillatorNodes", function() {
  var a = new Network(),
      firstOscillator = a.nodes[1];

  equal(firstOscillator, a.getNoteOscillatorNodes()[0], "gets first oscillator");
  equal(a.getNoteOscillatorNodes().length, 1, "starts with one");
  
  a.addOscillator();
  equal(a.getNoteOscillatorNodes().length +a.getOscillatorNodes().length, 2,
    "addOscillator increases to 2");
  equal(a.getNoteOscillatorNodes().length +a.getOscillatorNodes().length,
    a.getOscillatorAndNoteOscillatorNodes().length,
    "getNoteOsc + getOsc === getOscAndNoteOsc");
});

test("mutations update lastMutation", function() {
  var a = new Network();
  equal(a.lastMutation, null, "starts null");
  testLastMutation(a.clone().splitMutation(), "splitMutation");
  testLastMutation(a.clone().addOscillator(), "addOscillator");
  testLastMutation(a.clone().addConnection(), "addConnection");
  testLastMutation(a.clone().mutateConnectionWeights(), "mutateConnectionWeights");
  testLastMutation(a.clone().mutateNodeParameters(), "mutateNodeParameters");

  function testLastMutation(net, msg) {
    ok(_.isArray(net.lastMutation.objectsChanged) &&
       _.isString(net.lastMutation.changeDescription), msg);
  }
});

test("createFromJSON", function() {
  var a = new Network();
  var json = a.toJSON();
  var b = Network.createFromJSON(json);
  equal(a.nodes.length, b.nodes.length, "Preserves number of nodes");
  equal(a.connections.length, b.connections.length, "Preserves number of connections");
});
