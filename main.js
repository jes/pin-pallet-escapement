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
    Mouse = Matter.Mouse;

let engine = Engine.create({
    constraintIterations: 50,
    positionIterations: 50,
    velocityIterations: 50,
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
        mouseConstraint = MouseConstraintRotate.create(engine, {
            mouse: mouse,
            constraint: {
                stiffness: 1.0,
                render: {
                    visible: true,
                }
            }
        });

    Composite.add(engine.world, mouseConstraint);

let WIDTH = el('matter').clientWidth;
let HEIGHT = el('matter').clientHeight;
let MM_PER_PX = 1;
let PX_PER_MM = 1;

Render.run(render);
Runner.run(runner, engine);

let escapeWheel = null;
let escapeWheelConstraint = null;
let palletBody = null;
let palletBodyConstraint = null;
function update() {
    // TODO: don't update if nothing has changed

    // general
    let pivotsep = 31; // mm
    let banking1 = -15; // deg
    let banking2 = 15; // deg
    let clockwise = true;

    // pallets
    let pallet1 = {
        angle: -45, // deg
        distance: 16, // mm
        diameter: 3, // mm
    };
    let pallet2 = {
        angle: 45, // deg
        distance: 16, // mm
        diameter: 3, // mm
    };

    // escape wheel
    let numteeth = Math.abs(val('numteeth'));
    let lockangle = val('lockangle'); // deg
    let impulseangle = val('impulseangle') // deg
    let centrediameter = val('centrediameter'); // mm
    let locklength = val('locklength'); // mm
    let impulselength = val('impulselength'); // mm

    // view scaling
    let width_mm = (centrediameter + locklength*2 + impulselength*2) * 1.5;
    MM_PER_PX = width_mm / WIDTH;
    PX_PER_MM = 1 / MM_PER_PX;

    if (escapeWheel) {
        Composite.remove(engine.world, escapeWheel);
        Composite.remove(engine.world, escapeWheelConstraint);
        Composite.remove(engine.world, palletBody);
        Composite.remove(engine.world, palletBodyConstraint);
    }

    escapeWheel = makeEscapeWheel({
        numteeth: numteeth,
        lockangle: lockangle,
        impulseangle: impulseangle,
        centrediameter: centrediameter,
        locklength: locklength,
        impulselength: impulselength,
    });
    Body.setMass(escapeWheel, 0.0001);
    Body.translate(escapeWheel, {x:WIDTH/2, y:HEIGHT*2/3});

    escapeWheelConstraint = Constraint.create({
        pointA: {x:escapeWheel.position.x, y:escapeWheel.position.y},
        bodyB: escapeWheel,
        pointB: {x:0, y:0},
    });
    Composite.add(engine.world, [escapeWheel, escapeWheelConstraint]);

    palletBody = Body.create({parts: [makePallet(pallet1), makePallet(pallet2)]});
    Body.setMass(palletBody, 0.0001);
    Body.translate(palletBody, {x:WIDTH/2, y:escapeWheel.position.y-PX_PER_MM*pivotsep});

    palletBodyConstraint = Constraint.create({
        pointA: {x: palletBody.position.x, y: palletBody.position.y},
        bodyB: palletBody,
        pointB: {x:0, y:0},
    });
    Composite.add(engine.world, [palletBody, palletBodyConstraint]);

    let freeBox = Bodies.rectangle(250, 0, 30, 30);
    Body.setMass(freeBox, 0.0001);
    Composite.add(engine.world, freeBox);

    Events.on(engine, 'beforeUpdate', function() {
        if (Body.getAngularVelocity(escapeWheel) < 0.01)
            escapeWheel.torque = 0.00001;
    });
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

    return Body.create({ parts: parts, friction: 0.0, frictionAir: 0.0, frictionStatic: 0.0, restitution: 0.0 });
}

// create 1 escape tooth, with centre of wheel at (0,0)
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
    let x = opts.distance/2 * Math.sin(opts.angle * Math.PI/180);
    let y = opts.distance/2 * Math.cos(opts.angle * Math.PI/180);
    return Bodies.circle(PX_PER_MM*x, PX_PER_MM*y, PX_PER_MM*(opts.diameter/2), {friction:0.0, frictionAir: 0.0, frictionStatic: 0.0, restitution: 0.0});
}

update();

for (let elem of ['numteeth', 'centrediameter', 'lockangle', 'impulseangle', 'locklength', 'impulselength']) {
    el(elem).onchange = update;
    el(elem).onkeyup = update;
}
