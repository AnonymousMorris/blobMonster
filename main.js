const canvas = document.getElementById("canvas")
const ctx = canvas.getContext("2d");
const canvas2 = document.getElementById("canvas2")
const ctx2 = canvas2.getContext("2d")

// note that dx < 1
function lerp(a, b, dx){
    return a * (1 - dx) + b * dx
}
function PRNG(n){
    n = (n >> 13) ^ n;
    const nn = (n * (n * n * 60493 + 19990303) + 1376312589) & 0x7fffffff;
    return 1.0 - nn / 1073741824.0;
}
function fade(t){
    return Math.pow(((6*t - 15)*t + 10)*t*t*t, 2);
}
function dist(x, y){
    return Math.sqrt(x * x + y * y);
}
// numx is the number of vectors on each row before it loops back around.
// the vectors are at all the integer points.
class Perlin{
    constructor(numx, seed){
        this.numx = numx;
        this.seed = seed;
    }
    noise(x, y){
        const i = Math.floor(x % this.numx);
        const j = Math.floor(y);
        const topLeft = new vector(PRNG(this.seed + this.numx * j + i))
        const topRight = new vector(PRNG(this.seed + this.numx * j + (i + 1) % this.numx))
        const bottomLeft = new vector(PRNG(this.seed + this.numx * (j + 1) + i));
        const bottomRight = new vector(PRNG(this.seed + this.numx * (j + 1) + (i + 1) % this.numx));

        const dx = x % 1;
        const dy = y % 1;
        const v1 = new vector(dx, dy);
        const v2 = new vector(dx - 1, dy);
        const v3 = new vector(dx, dy - 1);
        const v4 = new vector(dx - 1, dy - 1);
        let topLeftNoise = v1.dot(topLeft);
        topLeftNoise += Math.sqrt(2)
        topLeftNoise /= 2* (Math.sqrt(2));
        let topRightNoise = v2.dot(topRight);
        topRightNoise += Math.sqrt(2);
        topRightNoise /= 2 * (Math.sqrt(2))
        let bottomLeftNoise = v3.dot(bottomLeft);
        bottomLeftNoise += Math.sqrt(2);
        bottomLeftNoise /= 2*Math.sqrt(2);
        let bottomRightNoise = v4.dot(bottomRight);
        bottomRightNoise += Math.sqrt(2);
        bottomRightNoise /= 2*Math.sqrt(2);
        return lerp(lerp(topLeftNoise, topRightNoise, fade(dx)), lerp(bottomLeftNoise, bottomRightNoise, fade(dx)), fade(dy));
    }
}
const mousePos = {
    x : 0,
    y : 0
}
canvas.addEventListener("mousemove", e => {
    mousePos.x = e.clientX - canvas.offsetLeft;
    mousePos.y = e.clientY - canvas.offsetTop;
})

class vector {
    constructor(arg1, arg2) {
        if(arguments.length === 1){
            this.angle = arg1;
            this.dx = Math.cos(this.angle);
            this.dy = Math.sin(this.angle);
        }
        else if(arguments.length === 2){
            this.dx = arg1;
            this.dy = arg2;
            this.angle = Math.atan2(this.dy, this.dx);
        }
        else{
            console.log("wrong number of inputs is passed into vector constructor")
        }
    }
    updateAngle(angle){
        this.angle += angle;
        this.angle %= 2*Math.PI;
        this.dx = Math.cos(this.angle);
        this.dy = Math.sin(this.angle);
    }
    updateValue(dx, dy){
        this.dx = dx;
        this.dy = dy;
        this.angle = Math.atan2(this.dy, this.dx);
    }
    dot(vector){
        return this.dx * vector.dx + this.dy * vector.dy;
    }
}

class monster{
    constructor(canvas, x, y, radius, divergence, inertia, perlin, animationSpeed){
        this.canvas = canvas;
        this.context = canvas.getContext("2d");
        this.x = x;
        this.y = y;
        this.dx = 0;
        this.dy = 0;
        this.animationSpeed = animationSpeed;
        this.radius = radius;
        this.divergence = divergence;
        this.perlin = perlin;
        this.acceleration = new vector(0, 0);
        this.time = 0;
    }
    update(){

        // change acceleration based on mouse position
        let ddx = mousePos.x - this.x;
        let ddy = mousePos.y - this.y;
        const distance = dist(ddx, ddy);
        // ddx /= distance;
        // ddy /= distance;
        this.acceleration.updateValue(ddx, ddy);
        this.dx += ddx;
        this.dy += ddy;

        // dampening the speed so it doesn't go crazy
        this.dx /= 10;
        this.dy /= 10;

        this.x += this.dx;
        this.y += this.dy;
        this.time += this.animationSpeed;
    }
    render() {
        const resolution = Math.PI / 24;
        this.context.beginPath()
        this.context.moveTo(this.x + Math.cos(0) * this.evaluate(0, this.time), this.y + Math.sin(0) * this.evaluate(0, this.time));
        for(let i = 0; i < 2 * Math.PI; i+= resolution){
            const a = this.evaluate(i, this.time);
            const b = this.evaluate(i + resolution % Math.PI, this.time)
            this.context.lineWidth = 5;
            this.context.lineTo(this.x + Math.cos(i + resolution) * b, this.y + Math.sin(i + resolution) * b)

            this.debug(i * 800 / (2*Math.PI) + 100, this.evaluate(a))
        }
        this.context.stroke();
        this.context.fill();
    }
    evaluate(angle, offset){
        const vect = new vector(angle);
        let ans = 0;
        const value = angle / ( 2 * Math.PI);
        // ans += Math.max(-this.radius, -this.acceleration.dot(vect));
        // ans += this.radius;
        // controls the number of control points

        // 2 opposite rotating perlin noise
        // ans += this.perlin.noise(value * this.perlin.numx + offset / 2, this.time) * 50;
        // ans += this.perlin.noise(value * this.perlin.numx + this.perlin.numx - offset % this.perlin.numx, this.time) * 50;

        // single perlin noise
        ans += this.perlin.noise(value * this.perlin.numx, this.time) * this.divergence;
        return ans;
    }
    debug(x, y){
        ctx2.lineWidth=5;
        ctx2.beginPath();
        ctx2.moveTo(x, 180);
        ctx2.lineTo(x, 180 - y);
        ctx2.stroke();
    }
}
const perl = new Perlin( 5, 10)
const monster1 = new monster(canvas, 200, 200, 50, 100, 10, perl, 0.001);
animate();
function animate(){
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx2.clearRect(0, 0, canvas.width, canvas.height)
    monster1.update();
    monster1.render();
    requestAnimationFrame(animate);
}