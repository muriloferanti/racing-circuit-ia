var canvas = document.getElementById("myCanvas");
var ctx = canvas.getContext("2d");

var crossedStartLine = false;

var centerX = canvas.width / 2;
var centerY = canvas.height / 2;

var startPointX = centerX - 40;
var startPointY = centerY - 200;

var cars = [];
let learningData = [];

let previousFinishLineDistance = 0;

class Car {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.width = 50;
        this.height = 30;
        this.color = color;
        this.speed = 0;
        this.angle = 0;
        this.maxSpeed = 1;
        this.acceleration = 0.1;
        this.rotationSpeed = 0.034;
        this.score = 0;
    }
}

function initializeCars(numCars) {
    var colors = ["red", "blue", "green", "yellow", "orange", "purple", "cyan", "magenta", "pink", "brown", "teal", "lime", "maroon", "navy", "olive", "indigo", "salmon", "tan", "violet", "turquoise"];
    for (var i = 0; i < numCars; i++) {
        var x = 560;
        var y = 650;
        var color = colors[i % colors.length];
        var car = new Car(x, y, color);
        cars.push(car);
    }
}

function drawCars() {
    for (var i = 0; i < cars.length; i++) {
        var car = cars[i];
        ctx.save();
        ctx.translate(car.x + car.width / 2, car.y + car.height / 2);
        ctx.rotate(car.angle);
        ctx.fillStyle = car.color;
        ctx.fillRect(-car.width / 2, -car.height / 2, car.width, car.height);
        ctx.restore();
    }
}

function updateCarPositions() {
    for (var i = 0; i < cars.length; i++) {
        var car = cars[i];
        var newX = car.x + Math.cos(car.angle) * car.speed;
        var newY = car.y + Math.sin(car.angle) * car.speed;

        if (isCarInsideTrack(newX, newY)) {
            car.x = newX;
            car.y = newY;
        } else {
            car.speed = 0;
        }

        if (car.y < startPointY && !crossedStartLine) {
            crossedStartLine = true;
        } else if (car.y > startPointY && crossedStartLine) {
            car.speed = 0;
        }
    }

    drawTrackAndStartLine();
    drawCars();
}

function drawTrackAndStartLine() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#228B22";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.beginPath();
    ctx.ellipse(centerX, centerY, 500, 255, 0, 0, 2 * Math.PI);
    ctx.closePath();
    ctx.lineWidth = 200;
    ctx.strokeStyle = "#808080";
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(startPointX, startPointY - 155);
    ctx.lineTo(startPointX, startPointY + 60);
    ctx.lineWidth = 7;
    ctx.strokeStyle = "#FFFFFF";
    ctx.stroke();
}

function isCarInsideTrack(x, y) {
    var trackCenterX = (canvas.width / 2) - 30;
    var trackCenterY = (canvas.height / 2) - 20;

    this.width = 50;
    this.height = 30;

    var aTop = (500 + 200 / 2) - 25;
    var bTop = (255 + 200 / 2) - 15;

    var aBottom = (500 - 200 / 2) - 25;
    var bBottom = (255 - 200 / 2) - 15;

    var resultEquationTop = Math.pow((x - trackCenterX) / aTop, 2) + Math.pow((y - trackCenterY) / bTop, 2);
    var resultEquationBottom = Math.pow((x - trackCenterX) / aBottom, 2) + Math.pow((y - trackCenterY) / bBottom, 2);

    return resultEquationTop <= 1 && resultEquationBottom >= 1.3;
}

function moveCarForward(car) {
    if (car.speed < car.maxSpeed) {
        car.speed += car.acceleration;
    }
}

function moveCarBackward(car) {
    if (car.speed > -car.maxSpeed) {
        car.speed -= car.acceleration;
    }
}

function turnCarRight(car) {
    car.angle += car.rotationSpeed;
}

function turnCarLeft(car) {
    car.angle -= car.rotationSpeed;
}

function updateCarList() {
    var carListDiv = document.getElementById("carList");
    carListDiv.innerHTML = "<h3>Car List</h3>";

    for (var i = 0; i < cars.length; i++) {
        var car = cars[i];
        var carInfo = "<p>Car " + (i + 1) + ": " + car.score + "</p>";
        carListDiv.innerHTML += carInfo;
    }
}

function startGame() {
    var numCarsInput = document.getElementById("numCars");
    var numCars = parseInt(numCarsInput.value);

    var numSteps = document.getElementById("numSteps");
    var numSteps = parseInt(numSteps.value);




    initializeCars(numCars);
    trainCars(numSteps);
}



function getObservations(carIndex) {
    return JSON.stringify({
        angle: cars[carIndex].angle.toFixed(2),
        finishLineDistance: (cars[carIndex].y - startPointY).toFixed(2),
        collision: isCarInsideTrack(cars[carIndex].x, cars[carIndex].y)
    });
}

const actions = {
    0: moveCarForward,
    1: moveCarBackward,
    2: turnCarRight,
    3: turnCarLeft
};


function executeAction(actionIndex, carIndex) {
    updateCarPositions();
    updateCarList();
    const action = actions[actionIndex];
    if (action) {
        action(cars[carIndex]);
    }
}

function getReward(carIndex) {
    let reward = 0;

    if (previousFinishLineDistance > cars[carIndex].y - startPointY) {
        cars[carIndex].score += 1;
        reward += 1;
    } else {
        cars[carIndex].score -= 1;
        reward -= 1;
    }
    previousFinishLineDistance = cars[carIndex].y - startPointY;


    if (!isCarInsideTrack(cars[carIndex].x, cars[carIndex].y)) {
        cars[carIndex].score -= 1;
        reward -= 1;
    }

    if (cars[carIndex].speed === 0) {
        cars[carIndex].score -= -1;
        reward -= 1;
    } else {
        cars[carIndex].score += 1;
        reward += 1;
    }

    return reward;
}


function chooseAction(carIndex) {
    const observations = getObservations(carIndex);
    if (learningData[carIndex] && learningData[carIndex][observations] !== undefined && learningData[carIndex][observations] >= 0) {
        return learningData[carIndex][observations];
    } else {
        return Math.trunc(Math.random() * Object.keys(actions).length);
    }
}


function trainCars(numSteps) {
    if (numSteps > 7000) {
        numSteps = 7000;
    }
    numCars = cars.length;

    for (let carIndex = 0; carIndex < numCars; carIndex++) {
        let step = 0;
        const stepInterval = setInterval(() => {
            if (step < numSteps) {


                const actionIndex = chooseAction(carIndex);

                executeAction(actionIndex, carIndex);
                getReward(carIndex);
                updateLearningData(actionIndex, carIndex);

                step++;
            } else {
                clearInterval(stepInterval);
            }
        }, 10);
    }
}


function updateLearningData(actionIndex, carIndex) {
    const observations = getObservations(carIndex);

    const reward = getReward(carIndex);

}

drawTrackAndStartLine();
