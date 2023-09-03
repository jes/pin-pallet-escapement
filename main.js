"use strict";

let Engine = Matter.Engine,
    Events = Matter.Events,
    Render = Matter.Render,
    Runner = Matter.Runner,
    Bodies = Matter.Bodies,
    Body = Matter.Body,
    Composite = Matter.Composite,
    Constraint = Matter.Constraint,
    Vector = Matter.Vector,
    Vertices = Matter.Vertices,
    Mouse = Matter.Mouse,
    MouseConstraint = Matter.MouseConstraint;

let engine = Engine.create({
    constraintIterations: 1000,
    positionIterations: 1000,
    velocityIterations: 1000,
    gravity: {scale: 0.0},
});
let render = Render.create({
    element: el('matter'),
    engine: engine,
    options: {
        width: 400,
        height: 600,
    },
});
let runner = Runner.create({
    delta: 1000/240,
});
    var mouse = Mouse.create(render.canvas),
        mouseConstraint = MouseConstraint.create(engine, {
            mouse: mouse,
            constraint: {
                stiffness: 1.0,
                render: {
                    visible: true,
                }
            }
        });

    Composite.add(engine.world, mouseConstraint);

let frictionopts = {
    friction: 0.1,
    frictionAir: 0.01,
    frictionStatic: 0.01,
    restitution: 0.1,
};

let WIDTH = el('matter').clientWidth;
let HEIGHT = el('matter').clientHeight;
let MM_PER_PX = 1;
let PX_PER_MM = 1;

Render.run(render);
Runner.run(runner, engine);

let escapeWheel = null;
let escapeWheelConstraint = null;
let palletBody1 = null;
let palletBody2 = null;
let palletConstraint1 = null;
let palletConstraint2 = null;
let palletConstraint3 = null;
let bankingPin1 = null;
let bankingPin2 = null;
let bankingPinConstraint1 = null;
let bankingPinConstraint2 = null;

Events.on(engine, 'afterUpdate', function() {
    if (!escapeWheel) return;

    // rotate escape wheel
    if (Body.getAngularVelocity(escapeWheel) < 0.01)
        escapeWheel.torque = 0.01;
});

function update() {
    // TODO: don't update if nothing has changed

    // general
    let pivotsep = val('pivotsep'); // mm
    let banking = val('banking'); // deg

    // pallets
    let pallet1 = {
        angle: -val('pallet1angle'), // deg
        distance: val('pallet1distance'), // mm
        diameter: val('pallet1diameter'), // mm
    };
    let pallet2 = {
        angle: val('pallet2angle'), // deg
        distance: val('pallet2distance'), // mm
        diameter: val('pallet2diameter'), // mm
    };

    // escape wheel
    let numteeth = Math.abs(val('numteeth'));
    let lockangle = val('lockangle'); // deg
    let impulseangle = val('impulseangle') // deg
    let centrediameter = val('centrediameter'); // mm
    let locklength = val('locklength'); // mm
    let impulselength = val('impulselength'); // mm

    // view scaling
    let width_mm = (centrediameter + locklength*2 + impulselength*2) * 1.2;
    MM_PER_PX = width_mm / WIDTH;
    PX_PER_MM = 1 / MM_PER_PX;

    if (escapeWheel) {
        Composite.remove(engine.world, escapeWheel);
        Composite.remove(engine.world, escapeWheelConstraint);
        Composite.remove(engine.world, palletBody1);
        Composite.remove(engine.world, palletBody2);
        Composite.remove(engine.world, palletConstraint1);
        Composite.remove(engine.world, palletConstraint2);
        Composite.remove(engine.world, palletConstraint3);
        Composite.remove(engine.world, bankingPin1);
        Composite.remove(engine.world, bankingPin2);
        Composite.remove(engine.world, bankingPinConstraint1);
        Composite.remove(engine.world, bankingPinConstraint2);
    }

    escapeWheel = makeEscapeWheel({
        numteeth: numteeth,
        lockangle: lockangle,
        impulseangle: impulseangle,
        centrediameter: centrediameter,
        locklength: locklength,
        impulselength: impulselength,
    });
    Body.setMass(escapeWheel, 0.1);
    Body.translate(escapeWheel, {x:WIDTH/2, y:HEIGHT*2/3});

    escapeWheelConstraint = Constraint.create({
        pointA: {x:escapeWheel.position.x, y:escapeWheel.position.y},
        bodyB: escapeWheel,
        pointB: {x:0, y:0},
    });
    Composite.add(engine.world, [escapeWheel, escapeWheelConstraint]);

    palletBody1 = makePallet(pallet1);
    palletBody2 = makePallet(pallet2);

    Body.translate(palletBody1, {x:WIDTH/2, y:escapeWheel.position.y-PX_PER_MM*pivotsep});
    Body.translate(palletBody2, {x:WIDTH/2, y:escapeWheel.position.y-PX_PER_MM*pivotsep});

    palletConstraint1 = Constraint.create({
        pointA: {x: WIDTH/2, y: escapeWheel.position.y-PX_PER_MM*pivotsep},
        bodyB: palletBody1,
        pointB: {x:0, y:0},
    });

    palletConstraint2 = Constraint.create({
        pointA: {x: WIDTH/2, y: escapeWheel.position.y-PX_PER_MM*pivotsep},
        bodyB: palletBody2,
        pointB: {x:0, y:0},
    });

    palletConstraint3 = Constraint.create({
        bodyA: palletBody1,
        pointA: {x:0, y:0},
        bodyB: palletBody2,
        pointB: {x:0, y:0},
    });

    Composite.add(engine.world, [palletBody1, palletBody2, palletConstraint1, palletConstraint2, palletConstraint3]);

    // TODO: the angle needs to be more, to account for the diameter
    bankingPin1 = makePallet({
        angle: pallet1.angle - banking,
        distance: pallet1.distance,
        diameter: pallet1.diameter,
    });
    bankingPin2 = makePallet({
        angle: pallet2.angle + banking,
        distance: pallet2.distance,
        diameter: pallet2.diameter,
    });

    Body.translate(bankingPin1, {x:WIDTH/2, y:escapeWheel.position.y-PX_PER_MM*pivotsep});
    Body.translate(bankingPin2, {x:WIDTH/2, y:escapeWheel.position.y-PX_PER_MM*pivotsep});

    bankingPinConstraint1 = Constraint.create({
        pointA: {x: bankingPin1.position.x, y: bankingPin1.position.y},
        bodyB: bankingPin1,
        pointB: {x:0, y:0},
    });
    bankingPinConstraint2 = Constraint.create({
        pointA: {x: bankingPin2.position.x, y: bankingPin2.position.y},
        bodyB: bankingPin2,
        pointB: {x:0, y:0},
    });

    Composite.add(engine.world, [bankingPin1, bankingPin2, bankingPinConstraint1, bankingPinConstraint2]);
}

// opts:
//  - numteeth
//  - lockangle (degrees from radial of locking face)
//  - impulseangle (degrees from radial of impulse face)
//  - centrediameter (mm, diameter of central circle)
//  - locklength (mm, length of locking face
//  - impulselength (mm, length of impulse face
function makeEscapeWheel(opts) {
    let parts = [];
    parts.push(Bodies.circle(0, 0, PX_PER_MM * opts.centrediameter/2));

    for (let i = 0; i < opts.numteeth; i++) {
        parts.push(makeEscapeTooth(opts, i*(360/opts.numteeth)));
    }

    return Body.create({ parts: parts, ...frictionopts});
}

// create an escape wheel tooth at the given angle
function makeEscapeTooth(opts, angle) {
    let startpoint = {x: 0, y: PX_PER_MM*opts.centrediameter/2};
    let lockpoint = Vector.add(startpoint, Vector.rotate({x: 0, y: PX_PER_MM*opts.locklength}, opts.lockangle*Math.PI/180));
    let impulsepoint = Vector.add(lockpoint, Vector.rotate({x: 0, y: PX_PER_MM*opts.impulselength}, opts.impulseangle*Math.PI/180));

    // TODO: impulsepoint is wrong because it is translated away from the
    // radial after being rotated relative to the radial, which means the
    // angle is no longer relative to the radial

    startpoint = Vector.rotate(startpoint, angle*Math.PI/180);
    lockpoint = Vector.rotate(lockpoint, angle*Math.PI/180);
    impulsepoint = Vector.rotate(impulsepoint, angle*Math.PI/180);

    // Bodies.fromVertices() automatically translates your vertices so
    // that the centre of mass is at the (x,y) coordinates you pass to it,
    // so we need to first calculate the mean coordinate so that we can put
    // it at the place we asked for
    let mean = Vertices.mean(Vertices.create([startpoint,lockpoint,impulsepoint]));
    return Bodies.fromVertices(mean.x, mean.y, [startpoint, lockpoint, impulsepoint]);
}

// opts:
//  - angle
//  - distance
//  - diameter
function makePallet(opts) {
    let x = opts.distance * Math.sin(opts.angle * Math.PI/180);
    let y = opts.distance * Math.cos(opts.angle * Math.PI/180);
    let b = Bodies.circle(PX_PER_MM*x, PX_PER_MM*y, PX_PER_MM*(opts.diameter/2), frictionopts);
    return b;
}

update();

for (let elem of ['numteeth', 'centrediameter', 'lockangle', 'impulseangle', 'locklength', 'impulselength', 'pivotsep', 'banking', 'pallet1angle', 'pallet1distance', 'pallet1diameter', 'pallet2angle', 'pallet2distance', 'pallet2diameter']) {
    el(elem).onchange = update;
    el(elem).onkeyup = update;
}
