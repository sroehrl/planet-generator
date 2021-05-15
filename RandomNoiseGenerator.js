export default class RandomNoiseGenerator{
    constructor(seed) {
        this.seed = this.getSeed(seed) * 394875498754986;	//394875498754986 could be any big number
        this.a = 16807;
        this.c = 0;
        this.m = Math.pow(2, 31)-1;
    }
    getSeed(seed){
        let s = 34737;
        for(let i = 0; i < seed.length; i++){
            s += (i+1)*seed.charCodeAt(i);
        }
        return s;
    }
    unit(){
        this.seed = (this.a * this.seed + this.c) % this.m;
        return this.seed / (this.m-1);
    }
    shuffle(array){
        let end = array.length - 1;
        let temp,i;
        while(end > 0){
            i = Math.round(this.unit() * (end-1));
            temp = array[end];
            array[end] = array[i];
            array[i] = temp;
            end--;
        }
    }
}