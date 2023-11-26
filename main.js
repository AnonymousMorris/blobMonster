const canvas = document.getElementById("canvas")
const ctx = canvas.getContext("2d");

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
class Perlin{
    constructor(seed){
        this.seed = seed;
    }
    noise(offset, startingPos, chunkSize){
        const left = PRNG(Math.floor(offset + this.seed));
        const right = PRNG(Math.ceil((offset + this.seed - startingPos) % chunkSize + startingPos));
        const dx = (offset + this.seed) % 1;
        return lerp( left * dx, right * dx, fade(dx));
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
    constructor(canvas, x, y, radius, divergence, inertia, perlin, speed){
        this.canvas = canvas;
        this.context = canvas.getContext("2d");
        this.x = x;
        this.y = y;
        this.dx = 0;
        this.dy = 0;
        this.speed = speed;
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
        this.time += 1 / 1000;
        console.log(this.x, this.y)
    }
    render() {
        const resolution = Math.PI / 24;
        this.context.beginPath()
        this.context.moveTo(this.x + Math.cos(0) * this.evaluate(0, this.time), this.y + Math.sin(0) * this.evaluate(0, this.time));
        for(let i = 0; i < 2 * Math.PI; i+= resolution){
            const a = this.evaluate(i, this.time);
            const b = this.evaluate(i + resolution % Math.PI, this.time)
            // this.context.fillRect(this.x + Math.cos(i) * a, this.y + Math.sin(i) * a, 10, 10)
            this.context.lineWidth = 5;
            this.context.lineTo(this.x + Math.cos(i + resolution) * b, this.y + Math.sin(i + resolution) * b)
        }
        this.context.stroke();
        this.context.fill();
    }
    evaluate(angle, offset){
        const vect = new vector(angle);
        let ans = 0;
        const value = angle / ( 2 * Math.PI);
        ans += Math.max(-this.radius, -this.acceleration.dot(vect));
        ans += this.radius;
        ans += this.perlin.noise(value + offset) * 20
        return ans;
    }
}
const perl = new Perlin( 123, 10, 10)
const monster1 = new monster(canvas, 200, 200, 50, 10, 10, perl, 10);
animate();
function animate(){
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    monster1.update();
    monster1.render();
    requestAnimationFrame(animate);
}