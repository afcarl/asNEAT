
(function(global) {
  "use strict";

  var ns = (global.asNEAT = global.asNEAT || {}),
      log = ns.Utils.log;

  // TODO: Different kinds of connections?
  var Connection = function(parameters) {
    _.defaults(this, parameters, this.defaultParameters);
    this.gainNode = null;
  };

  Connection.prototype.defaultParameters = {
    inNode: null,
    outNode: null,
    weight: 1.0,
    enabled: true,

    mutationDeltaChance: 0.8,
    mutationDelta: {min: -0.2, max: 0.2},
    randomMutationRange: {min: 0.1, max: 1.5},
    discreteMutation: false
  };
  Connection.prototype.connect = function() {
    if (!this.enabled) return;

    // The gainNode is what carries the connection's 
    // weight attribute
    this.gainNode = ns.context.createGain();
    this.gainNode.gain.value = this.weight;
    this.inNode.node.connect(this.gainNode);
    this.gainNode.connect(this.outNode.node);
  };

  Connection.prototype.disable = function() {
    this.enabled = false;
  };

  Connection.prototype.mutate = function() {
    ns.Utils.mutateParameter({
      obj: this,
      parameter: 'weight',
      mutationDeltaChance: this.mutationDeltaChance,
      mutationDelta: this.mutationDelta,
      randomMutationRange: this.randomMutationRange
    });
  };

  Connection.prototype.toString = function() {
    return (this.enabled? "" : "*") +
            "connection("+this.weight.toFixed(2)+")("+
            this.inNode.id+" --> "+this.outNode.id+")";
  };

  ns.Connection = Connection;
})(this);