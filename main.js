"use strict";

let Engine = Matter.Engine,
    Render = Matter.Render,
    Runner = Matter.Runner,
    Bodies = Matter.Bodies,
    Body = Matter.Body,
    Composite = Matter.Composite,
    Constraint = Matter.Constraint,
    Vector = Matter.Vector,
    Vertices = Matter.Vertices;

let engine = Engine.create();
let render = Render.create({
    element: el('matter'),
    engine: engine,
    options: {
        width: 400,
        height: 600,
    },
});
let runner = Runner.create();

let WIDTH = el('matter').clientWidth;
let HEIGHT = el('matter').clientHeight;
let MM_PER_PX = 1;
let PX_PER_MM = 1;

Render.run(render);
Runner.run(runner, engine);

let escapeWheel = null;
let escapeWheelConstraint = null;
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
    }

    escapeWheel = makeEscapeWheel({
        numteeth: numteeth,
        lockangle: lockangle,
        impulseangle: impulseangle,
        centrediameter: centrediameter,
        locklength: locklength,
        impulselength: impulselength,
    });
    Body.translate(escapeWheel, {x:WIDTH/2, y:HEIGHT*2/3});

    escapeWheelConstraint = Constraint.create({
        pointA: {x:escapeWheel.position.x, y:escapeWheel.position.y},
        bodyB: escapeWheel,
        pointB: {x:0, y:0},
    });
    Composite.add(engine.world, [escapeWheel, escapeWheelConstraint]);

    let freeBox = Bodies.rectangle(250, 0, 30, 30);
    Composite.add(engine.world, freeBox);
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

    return Body.create({ parts: parts });
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

update();

for (let elem of ['numteeth', 'centrediameter', 'lockangle', 'impulseangle', 'locklength', 'impulselength']) {
    el(elem).onchange = update;
    el(elem).onkeyup = update;
}
