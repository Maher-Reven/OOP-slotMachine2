var maxNumOfImages = 15;
var imagesLimitFactor = 1;
var rowMatchCoins = 5;
var diagonalMatchCoins = 10;
var imageSize = 60;
var maxSpins = 25;
var minSpins = 5;
var spinStep = 5;
var imageSrcPath = "./src/";
var machines = [];
var coins = 0;
var mainContainer = document.querySelector("main");
var wheelsNumber = document.getElementById("wheels_number");
var rowsNumber = document.getElementById("rows_number");
var minCoinsNumber = document.getElementById("min_coins_number");
var addMachine = document.getElementById("add_machine");
var coinsNumber = document.getElementById("coins_number");
var addCoinsButton = document.getElementById("add_coins");
var currentCoins = document.getElementById("current_coins");
var machineTemplate = document.querySelector(".machine");
var wheelTemplate = document.querySelector(".machine_wheel");
var imageTemplate = document.querySelector(".image");
var addCoins = coinsToAdd => {
    coins += coinsToAdd
    currentCoins.innerText = "You have " + coins + " coins";
}
addCoinsButton.addEventListener("click", function(){
    addCoins(Math.max(Math.min(coinsNumber.value * 1, coinsNumber.max * 1), coinsNumber.min * 1));
});
addCoinsButton.click();
function soundHandler(sound, isLoop, action) {
    sound.loop = isLoop;
    sound[action](); 
}
function calculatePoints(imagesPerWheel, wheelsPerMachine, imageValues) {
    var points = imagesPerWheel * rowMatchCoins;
    if (imagesPerWheel === wheelsPerMachine) {
        points += 2 * diagonalMatchCoins;
    }
    var diagonalFlag1 = true;
    var diagonalFlag2 = true;
    for (var i=0; i<imagesPerWheel; i++) {
        for (var j=1; j<wheelsPerMachine; j++) {
            if (imageValues[j][i] !== imageValues[0][i]) {
                points -= rowMatchCoins;
                break;
            }
        }
        if (
            diagonalFlag1 && imagesPerWheel === wheelsPerMachine &&
            imageValues[i][i] !== imageValues[0][0]
        ) {
            points -= diagonalMatchCoins;
            diagonalFlag1 = false;
        }
        if (
            diagonalFlag2 && imagesPerWheel === wheelsPerMachine &&
            imageValues[i][imagesPerWheel - i - 1] !== imageValues[0][imagesPerWheel - 1]
        ) {
            points -= diagonalMatchCoins;
            diagonalFlag2 = false;
        }
    }
    return points;
}
function Machine(wheelsPerMachine, imagesPerWheel, minCoins) {
    this.wheelsPerMachine = wheelsPerMachine;
    this.imagesPerWheel = imagesPerWheel;
    this.minCoins = minCoins;
    this.muted = false;
    this.spining = false;
    this.imageValues = [];
    this.machineDOM = machineTemplate.cloneNode(true);
    this.machineDOM.querySelector(".machine_spin").addEventListener("click", this.spin.bind(this));
    this.machineDOM.querySelector(".machine_remove").addEventListener("click", this.remove.bind(this));
    this.machineDOM.querySelector(".machine_mute").addEventListener("click", this.mute.bind(this));
    var wheelsContainer = this.machineDOM.querySelector(".wheels_container");
    wheelsContainer.style.width = wheelsPerMachine * imageSize + "px";
    wheelsContainer.style.height = imagesPerWheel * imageSize + "px";
    mainContainer.appendChild(this.machineDOM);
    this.wheels = new Array(wheelsPerMachine).fill(null).map(function(wheel, index) {
        return new Wheel(wheelsContainer, imagesPerWheel, index);
    });
}
Machine.prototype.mute = function() {
    this.muted = !this.muted;
    this.machineDOM.querySelector(".machine_mute").innerText = this.muted ? "Unmute" : "Mute";
    soundHandler(this.machineDOM.querySelector(".spin"), !this.muted, "load");
};
Machine.prototype.remove = function() {
    if (this.spining) {
        return;
    }
    this.wheels.forEach(function(wheel) {
        wheel.remove();
    });
    this.machineDOM.remove();
    machines.splice(machines.indexOf(this), 1);
};
Machine.prototype.spin = function() {
    if (this.spining || this.minCoins > coins) {
        return;
    }
    this.spining = true;
    addCoins(-this.minCoins);
    if (!this.muted) {
        soundHandler(this.machineDOM.querySelector(".spin"), true, "play")
    }
    this.machineDOM.querySelector(".machine_win").innerText = "";
    this.imageValues = [];
    this.wheels.forEach(function(wheel) {
        wheel.spin(this.checkWin.bind(this));
    }, this);
};
Machine.prototype.checkWin = function(imageValues, position) {
    this.imageValues[position] = imageValues;
    for (var i=0; i<this.wheelsPerMachine; i++) {
        if (typeof this.imageValues[i] === "undefined") {
            return;
        }
    }
    soundHandler(this.machineDOM.querySelector(".spin"), false, "load")
    var points = calculatePoints(this.imagesPerWheel, this.wheelsPerMachine, this.imageValues);
    if (points > 0) {
        if (!this.muted) {
            soundHandler(this.machineDOM.querySelector(".win"), false, "play");
        }
        this.machineDOM.querySelector(".machine_win").innerText = points + " coins";
        addCoins(points);
    }
    this.spining = false;
};
function Wheel(wheelsContainer, imagesPerWheel, wheelIndex) {
    var imagesLimit = Math.min(maxNumOfImages, Math.max(imagesPerWheel * imagesLimitFactor, imagesPerWheel + 1));
    this.imagesPerWheel = imagesPerWheel;
    this.wheelIndex = wheelIndex;
    this.wheelDOM = wheelTemplate.cloneNode(true);
    wheelsContainer.appendChild(this.wheelDOM);
    this.imageValues = [];
    for (var i=0; i<imagesLimit; i++) {
        this.imageValues.splice(Math.floor(Math.random() * (this.imageValues.length + 1)), 0, i);
    }
    this.images = this.imageValues.slice(0, imagesPerWheel + 1).map(function(imageValue) {
        var image = imageTemplate.cloneNode(true);
        image.src = imageSrcPath + imageValue + ".jpg";
        this.wheelDOM.appendChild(image);
        return image;
    }, this);
}
Wheel.prototype.remove = function() {
    this.wheelDOM.remove();
};
Wheel.prototype.spin = function(checkWin) {
    var numOfSpins = Math.floor(Math.random() * (maxSpins - minSpins + 1)) + minSpins;
    var wheelTop = - imageSize;
    var spinInterval = setInterval(function() {
        wheelTop += spinStep;
        if (wheelTop === 0) {
            this.imageValues.unshift(this.imageValues.pop());
            this.images.unshift(this.images.pop());
            this.images[0].src = imageSrcPath + this.imageValues[0] + ".jpg";
            this.wheelDOM.insertBefore(this.images[0], this.wheelDOM.childNodes[0]);
            wheelTop = - imageSize;
            numOfSpins--;
            if (numOfSpins === 0) {
                checkWin(this.imageValues.slice(1, this.imagesPerWheel + 1), this.wheelIndex);
                clearInterval(spinInterval)
            }
        }
        this.wheelDOM.style.transform = "translateY(" + wheelTop + "px)";
    }.bind(this), 10);
};
addMachine.addEventListener("click", function() {
    var images = Math.max(Math.min(rowsNumber.value * 1, rowsNumber.max * 1), rowsNumber.min * 1);
    rowsNumber.value = images;
    var wheels = Math.max(Math.min(wheelsNumber.value * 1, wheelsNumber.max * 1), wheelsNumber.min * 1);
    wheelsNumber.value = wheels;
    var minCoins = Math.max(Math.min(minCoinsNumber.value * 1, minCoinsNumber.max * 1), minCoinsNumber.min * 1);
    minCoinsNumber.value = minCoins;
    machines.push(new Machine(wheels, images, minCoins));
});
addMachine.click();