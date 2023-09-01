"use strict";

let Engine = Matter.Engine,
    Render = Matter.Render,
    Runner = Matter.Runner,
    Bodies = Matter.Bodies,
    Body = Matter.Body,
    Composite = Matter.Composite,
    Constraint = Matter.Constraint;

let engine = Engine.create();
let render = Render.create({
    element: el('matter'),
    engine: engine,
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
    let lockangle = -45; // deg
    let impulseangle = 45; // deg
    let lockdiameter = 43; // mm
    let impulsediameter = 48.5; // mm

    // view scaling
    let width_mm = (impulsediameter/2 + pivotsep) * 1.4;
    MM_PER_PX = width_mm / WIDTH;
    PX_PER_MM = 1 / MM_PER_PX;

    if (escapeWheel) {
        Composite.remove(engine.world, escapeWheel);
        Composite.remove(engine.world, escapeWheelConstraint);
    }

    // TODO: if the fork passes over the escape wheel and the pallets
    // engage on the opposite side, we'll infer centrediameter=0, which
    // is wrong
    let centrediameter = (pivotsep - Math.max(pallet1.distance + pallet1.diameter/2, pallet2.distance + pallet2.diameter/2)) * 1.9;
    if (centrediameter < 0) centrediameter = 0;

    escapeWheel = makeEscapeWheel({
        numteeth: numteeth,
        lockangle: lockangle,
        impulseangle: impulseangle,
        centrediameter: centrediameter,
        lockdiameter: lockdiameter,
        impulsediameter: impulsediameter,
    });
    Body.translate(escapeWheel, {x:WIDTH/3, y:HEIGHT/2});

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
//  - lockdiameter (mm, to outside of locking face)
//  - impulsediameter (mm, to outside of impulse face)
function makeEscapeWheel(opts) {
    let parts = [];
    parts.push(Bodies.circle(0, 0, PX_PER_MM * opts.centrediameter/2));

    for (let i = 0; i < opts.numteeth; i++) {
        let tooth = makeEscapeTooth(opts);
        Body.rotate(tooth, i*(2*Math.PI/opts.numteeth), {x:0, y:0});
        parts.push(tooth);
    }

    return Body.create({ parts: parts });
}

// create 1 escape tooth, with centre of wheel at (0,0)
function makeEscapeTooth(opts, angle) {
    let b = Bodies.rectangle(0, 0, 10, PX_PER_MM*opts.impulsediameter/2);
    Body.translate(b, {x: 0, y: PX_PER_MM*opts.impulsediameter/4});
    return b;
}

update();

el('numteeth').onchange = update;
el('numteeth').onkeyup = update;
