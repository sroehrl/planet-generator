import PerlinNoise from "./PerlinNoise.js";

export default class Generate{
    constructor(canvas, output) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");
        this.seed = Math.random().toString(16).substr(2, 16);
        this.detail = 1;
        this.heightmapWidth = 700;
        this.heightmapHeight = 400;
        this.rotation = 0.0;
        this.rotationDirection = -1;
        this.radius = 100;
        this.rotationSpeed = 0.05;
        this.colorThreshold = 120;
        this.hasWater = false;
        this.hasVegetation = false;
        this.playing = false;

        // output
        this.output = output;
        this.outputCtx = output.getContext("2d");
        this.startingTime = undefined;
    }
    set(seed, colorThreshold, hasWater = false, hasVegetation = false, detail = 1, rotationDirection = -1){
        this.seed = seed;
        this.colorThreshold = colorThreshold;
        this.hasWater = hasWater;
        this.hasVegetation = hasVegetation;
        this.detail = detail;
        this.radius = detail > 1 ? (100 + (100 * detail/3)) : 100;
        this.rotationDirection = rotationDirection;
    }
    map(c, a1, a2, b1, b2){
        return b1 + ((c-a1)/(a2-a1))*(b2-b1);
    }
    setColor(data, x, y, w, r, g, b, a){
        for(let xx = x; xx < x+this.detail; xx++){
            for(let yy = y; yy < y+this.detail; yy++){
                data[(xx + yy*w)*4] = r;
                data[(xx + yy*w)*4 + 1] = g;
                data[(xx + yy*w)*4 + 2] = b;
                data[(xx + yy*w)*4 + 3] = a;
            }
        }
    }
    generatePlanet(n, texture_data, x, y){
        let r = n,g,b = Math.round(n/2);
        if(n < this.colorThreshold){
            r = n < this.colorThreshold/2 ? this.colorThreshold : n;
            g = Math.round(n*0.6);
            if(this.hasWater){
                r = 0;
                g = 0;
            }
        } else if(n < (1.6 * this.colorThreshold)){
            r = this.hasVegetation ? 0 : Math.round(n*0.8);
            g = Math.round(n*0.4);
        } else {
            g = Math.round(n/2);
            b = Math.round(n/3);
        }
        this.setColor(texture_data, x, y,this.heightmapWidth, r, g, b, n);

    }
    build(){
        const imageData = this.ctx.createImageData(this.heightmapWidth, this.heightmapHeight);
        this.texture_data = imageData.data;
        const noise = new PerlinNoise(this.seed);


        for(let x = 0; x < this.heightmapWidth; x+=this.detail){
            for(let y = 0; y < this.heightmapHeight; y+=this.detail){
                const phi = this.map(x, 0, this.heightmapWidth-1, (3.0/2.0)*Math.PI+this.rotation, -Math.PI/2.0+this.rotation),
                    theta = this.map(y, 0, this.heightmapHeight-1, Math.PI, 0);
                const xx = this.radius*Math.abs(Math.sin(theta))*Math.cos(phi),
                    yy = this.radius*Math.cos(theta),
                    zz = this.radius*Math.abs(Math.sin(theta))*Math.sin(phi);

                let amplitude = 1.0,
                    frequency = 0.01;
                let n = 0.0;
                for(let o = 0; o < 3; o++){
                    n += amplitude*noise.noise(xx*frequency, yy*frequency, zz*frequency);
                    amplitude *= 0.5;
                    frequency *= 2.0;
                }
                n += 1.0;
                n *= 0.5;
                n = Math.round(n*255);

                this.generatePlanet(n, this.texture_data, x, y, this.heightmapWidth, this.detail)

            }
        }

        this.ctx.putImageData(imageData, 0, 0);
    }
    renderPlanetFrame(canvas_data, texture_data, radius, w, h, x1, x2, angle1, angle2){
        for(let x = x1; x < x2; x++){
            for(let y = 0; y < h; y++){
                const phi = this.map(x, x1, x2, angle1+this.rotation, angle2+this.rotation),
                    theta = this.map(y, 0, h-1, Math.PI, 0);

                const r = texture_data[(x + y*w)*4],
                    g = texture_data[(x + y*w)*4 + 1],
                    b = texture_data[(x + y*w)*4 + 2],
                    a = texture_data[(x + y*w)*4 + 3];

                const rad = radius;

                const zz = rad*Math.abs(Math.sin(theta))*Math.sin(phi),
                    xx = Math.round(rad*Math.abs(Math.sin(theta))*Math.cos(phi)) + 250,
                    yy = Math.round(rad*Math.cos(theta)) + 250;
                if(zz >= 0){
                    this.setColor(canvas_data, xx, yy, 500, r, g, b, 255);
                }
            }
        }
    }
    draw(){
        this.ctx.fillStyle = "black";
        this.ctx.fillRect(0, 0, 500, 500);
        const imageData = this.ctx.createImageData(500, 500);
        const data = imageData.data;
        // FOR now: make transparent
        // later: hook in moon(s)?
        for(let x = 0; x < 500; x++){
            for(let y = 0; y < 500; y++){
                this.setColor(data, x, y, 500, 0, 0, 0, 0);
            }
        }
        this.renderPlanetFrame(data, this.texture_data, this.radius, this.heightmapWidth, this.heightmapHeight, 0, this.heightmapWidth, (3.0/2.0)*Math.PI, -Math.PI/2.0)

        this.ctx.putImageData(imageData, 0, 0);
    }
    togglePlay(){
        this.playing =! this.playing
        this.update();
    }
    update(ts){
        if(!this.playing){
            return;
        }

        if(this.startingTime === undefined){
            this.startingTime = ts;
        }
        this.draw();

        this.rotation -= (this.rotationDirection * this.rotationSpeed);
        window.requestAnimationFrame(this.update.bind(this));

    }
    export(frames){
        this.playing = false;
        this.rotation = 0.0;
        this.draw();
        const step = (Math.PI*2)/frames;
        this.output.height = frames/10*500;

        return new Promise(async resolve => {
            await this.exportFrames(frames, step, 0);
            setTimeout(()=>{
                const outputImg = new Image();
                outputImg.src = this.output.toDataURL("image/png");
                let link = document.createElement("a");
                link.download = "image.png";
                this.output.toBlob(function(blob) {
                    link.href = URL.createObjectURL(blob);
                    link.click();
                }, "image/png");
                resolve(outputImg);
            },1500)
        })


    }
    exportFrames(frames, step, currentFrame){

        this.rotation -= (step * this.rotationDirection);
        this.draw();
        return new Promise(resolve => {
            const img = new Image(500,500);
            img.onload = async ()=>{
                const row = Math.floor(currentFrame/10)
                const posX = (currentFrame - row * 10) * 500;
                const posY = row * 500;
                this.outputCtx.drawImage(img,posX,posY);
                if(frames === currentFrame+1){
                    resolve('done')
                } else {
                    resolve(await this.exportFrames(frames, step, currentFrame+1))
                }

            }
            img.src = this.canvas.toDataURL("image/png");
        })


    }
}