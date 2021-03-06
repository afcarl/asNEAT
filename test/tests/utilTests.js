module("Util Tests");
var Utils = require('asNEAT/utils')['default'];

test('upperCaseFirstLetter', function() {
  equal(Utils.upperCaseFirstLetter('arst'), 'Arst', 'capitalizes first letter');
  equal(Utils.upperCaseFirstLetter('Arst'), 'Arst', 'keeps first letter capital');
});

test('lowerCaseFirstLetter', function() {
  equal(Utils.lowerCaseFirstLetter('Arst'), 'arst', 'lowercases first letter');
  equal(Utils.lowerCaseFirstLetter('arst'), 'arst', 'keeps first letter lowercase');
});

test("randomIn", function() {
  for (var i=0; i<20; ++i) {
    var min = Math.random()*100,
        max = min + Math.random()*100+1,
        randomIn = Utils.randomIn(min, max);
    ok(randomIn < max && randomIn >= min, "In Range ["+min+','+max+')');
  }
});

test("randomElementIn", function() {
  var xs = [];
  equal(Utils.randomElementIn(xs), undefined, "empty returns undefined");
  var x = {id:0};
  equal(Utils.randomElementIn([x], x), undefined, "arr containing notX returns undefined");

  var y = {id:1};
  xs = [x, y];
  var pick = Utils.randomElementIn(xs);
  ok(pick === xs[0] || pick === xs[1], "Picks element in xs");
  equal(Utils.randomElementIn(xs, x), y, "Doesn't pick notX");
});

test("clamp", function() {
  var min = -10,
      max = 10;
  equal(Utils.clamp(5, min, max), 5, 'same within range');
  equal(Utils.clamp(20, min, max), max, 'clamps to max');
  equal(Utils.clamp(-20, min, max), min, 'clamps to min');
});

test("cantorPair", function() {
  var x = 3,
      y = 5,
      z = Utils.cantorPair(x, y);
  equal(x, Utils.reverseCantorPair(z).x, 'can reverse x');
  equal(y, Utils.reverseCantorPair(z).y, 'can reverse y');
});

test("extend", function() {
  var b = {},
      b2 = {},
      def = {a: 1, b:2, x: [], y: {}},
      par = {b:3};

  Utils.extend(b, def, par);
  Utils.extend(b2, def, par);

  equal(b.a, def.a, 'default remains');
  equal(b.b, par.b, 'parameter overrides');
  notEqual(b.x, b2.x, 'default arrays not equal');
  notEqual(b.y, b2.y, 'default objects not equal');
});

test("roundTo2Places", function() {
  equal(Utils.roundTo2Places(1), 1, 'identity');
  equal(Utils.roundTo2Places(1.005), 1.01, 'round up');
  equal(Utils.roundTo2Places(1.0049), 1.00, 'round down');
});

test("solveLinearEqn", function() {
  var soln = Utils.solveLinearEqn(0, 1);
  ok(soln.a === 1 && soln.b === 0, "(0,0),(1,1) y=x");
  soln = Utils.solveLinearEqn(1, 1);
  ok(soln.a === 0 && soln.b === 1, "(0,1),(1,1) constant");
  soln = Utils.solveLinearEqn(0.2, 0.8);
  ok(Number(soln.a.toPrecision(5)) === 0.6 &&
            soln.b === 0.2,
    "(0,0.2),(1,0.8)");
});

test("solveExponentialEqn", function() {
  var soln = Utils.solveExponentialEqn(0.1, 1);
  ok(soln.c === 0.1 &&
     Number(soln.a.toPrecision(5)) === 2.3026,
     "(0,0.1),(1,1)");
  soln = Utils.solveExponentialEqn(0.2, 0.9);
  ok(soln.c === 0.2 &&
     Number(soln.a.toPrecision(5)) === 1.5041,
     "(0,0.2),(1,9)");
});

test("interpolate", function() {
  var y = Utils.interpolate(Utils.InterpolationType.LINEAR, [0, 1], 0);
  equal(y, 0, "linear y=x x=0");
  y = Utils.interpolate(Utils.InterpolationType.LINEAR, [0, 1], 0.5);
  equal(y, 0.5, "linear y=x x=0.5");
  y = Utils.interpolate(Utils.InterpolationType.LINEAR, [0, 1], 1);
  equal(y, 1, "linear y=x x=1");

  y = Utils.interpolate(Utils.InterpolationType.EXPONENTIAL, [0.2, 0.8], 0);
  equal(y, 0.2, "exponential at 0");
  y = Utils.interpolate(Utils.InterpolationType.EXPONENTIAL, [0.2, 0.8], 1);
  equal(y, 0.8, "exponential at 1");
});

test("mutateParameter", function() {
  var origValue = 1;
  var obj = {param:origValue};
  Utils.mutateParameter({
    obj: obj,
    parameter: 'param',
    randomMutationRange: {min: 1.1, max: 1.5}
  });
  ok(obj.param !== origValue, "Changes value by default");

  obj = {param:-1};
  var mutationParams = {
    obj: obj,
    parameter: 'param',
    mutationDeltaChance: 1.0,
    mutationDelta: {min:[0, 0], max: [0,0]},
    mutationDeltaAllowableRange: {min: 0, max:1}
  };
  Utils.mutateParameter(mutationParams);
  equal(obj.param, 0, "mutationDeltaAllowablRange clamps min");
  obj.param = 2;
  Utils.mutateParameter(mutationParams);
  equal(obj.param, 1, "mutationDeltaAllowableRange clamps max");
  obj.param = 0.5;
  Utils.mutateParameter(mutationParams);
  equal(obj.param, 0.5, "mutationDeltaAllowableRange allows value in range");
});

test("frequencyForNote", function() {
  equal(Utils.roundTo2Places(Utils.frequencyForNote('c3')), 130.81, 'c3');
  equal(Utils.roundTo2Places(Utils.frequencyForNote('c4')), 261.63, 'c4');
  equal(Utils.roundTo2Places(Utils.frequencyForNote('C4')), 261.63, 'C4');
  equal(Utils.roundTo2Places(Utils.frequencyForNote('C4#')), 277.18, 'C4#');
  equal(Utils.roundTo2Places(Utils.frequencyForNote('D4')), 293.66, 'D4');
  equal(Utils.roundTo2Places(Utils.frequencyForNote('E4b')), 311.13, 'E4b');
  equal(Utils.roundTo2Places(Utils.frequencyForNote('E4')), 329.63, 'E4');
  equal(Utils.roundTo2Places(Utils.frequencyForNote('F4')), 349.23, 'F4');
  equal(Utils.roundTo2Places(Utils.frequencyForNote('F4#')), 369.99, 'F4#');
  equal(Utils.roundTo2Places(Utils.frequencyForNote('G4')), 392.00, 'G4');
  equal(Utils.roundTo2Places(Utils.frequencyForNote('A4b')), 415.30, 'A4b');
  equal(Utils.roundTo2Places(Utils.frequencyForNote('A4')), 440.00, 'A4');
  equal(Utils.roundTo2Places(Utils.frequencyForNote('B4b')), 466.16, 'B4b');
  equal(Utils.roundTo2Places(Utils.frequencyForNote('B4')), 493.88, 'B4');
  equal(Utils.roundTo2Places(Utils.frequencyForNote('C5')), 523.25, 'C5');
});
test("stepsFromRootNote", function() {
  equal(Utils.stepsFromRootNote('A3'), -12, 'A3');
  equal(Utils.stepsFromRootNote('G4'), -2, 'G4');
  equal(Utils.stepsFromRootNote('A4b'), -1, 'A4b');
  equal(Utils.stepsFromRootNote('A4'), 0, 'A4');
  equal(Utils.stepsFromRootNote('B4b'), 1, 'B4b');
  equal(Utils.stepsFromRootNote('B4'), 2, 'B4');
});
test("frequencyOfStepsFromRootNote", function() {
  equal(Utils.roundTo2Places(Utils.frequencyOfStepsFromRootNote(-2)), 392.00, '-2');
  equal(Utils.roundTo2Places(Utils.frequencyOfStepsFromRootNote(-1)), 415.30, '-1');
  equal(Utils.roundTo2Places(Utils.frequencyOfStepsFromRootNote(0)), 440.00, '0');
  equal(Utils.roundTo2Places(Utils.frequencyOfStepsFromRootNote(1)), 466.16, '1');
  equal(Utils.roundTo2Places(Utils.frequencyOfStepsFromRootNote(2)), 493.88, '2');
});
