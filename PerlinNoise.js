import RandomNoiseGenerator from "./RandomNoiseGenerator.js";

export default class PerlinNoise {
    constructor(seed) {
        this.seed = seed;
        this.randomNoise = new RandomNoiseGenerator(seed);
        this.permutation = new Array(256);
        this.p = new Array(512);
        this.init();
    }

    init() {
        for (let i = 0; i < 256; i++) {
            this.permutation[i] = i;
        }
        this.randomNoise.shuffle(this.permutation, seed);
        for (let i = 0; i < 256; i++) {
            this.p[i] = this.p[i + 256] = this.permutation[i];
        }
    }

    noise(x, y, z) {
        const X = Math.floor(x) & 255;
        const Y = Math.floor(y) & 255;
        const Z = Math.floor(z) & 255;

        x -= Math.floor(x);
        y -= Math.floor(y);
        z -= Math.floor(z);

        const u = this.fade(x);
        const v = this.fade(y);
        const w = this.fade(z);

        const A = this.p[X] + Y, AA = this.p[A] + Z, AB = this.p[A + 1] + Z,
            B = this.p[X + 1] + Y, BA = this.p[B] + Z, BB = this.p[B + 1] + Z;

        return this.lerp(w, this.lerp(v, this.lerp(u, this.grad(this.p[AA], x, y, z), this.grad(this.p[BA], x - 1, y, z)),
            this.lerp(u, this.grad(this.p[AB], x, y - 1, z), this.grad(this.p[BB], x - 1, y - 1, z))),
            this.lerp(v, this.lerp(u, this.grad(this.p[AA + 1], x, y, z - 1), this.grad(this.p[BA + 1], x - 1, y, z - 1)),
                this.lerp(u, this.grad(this.p[AB + 1], x, y - 1, z - 1), this.grad(this.p[BB + 1], x - 1, y - 1, z - 1))));

    }
    lerp(t, a, b){
        return a + t * (b - a);
    }
    fade(t) {
        return t * t * t * (t * (t * 6 - 15) + 10);
    }
    grad(hash, x, y, z) {
        const h = hash & 15;

        switch (h) {
            case 0:
            case 12:
                return x + y;
            case 1:
            case 13:
                return x - y;
            case 2:
            case 14:
                return -x + y;
            case 3:
            case 15:
                return -x - y;
            case 4:
                return x + z;
            case 5:
                return x - z;
            case 6:
                return -x + z;
            case 7:
                return -x - z;
            case 8:
                return y + z;
            case 9:
                return y - z;
            case 10:
                return -y + z;
            case 11:
                return -y - z;
        }
    }
}
