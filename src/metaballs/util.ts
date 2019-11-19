import Orb from './Orb'



export const checkCollisionRect=(orb: Orb, top: number, right: number, bottom: number, left: number, onCollisionX: Function, onCollisionY: Function):void=>{
    if(orb.positionX>right && orb.lastCollision!=2) {orb.lastCollision=2; onCollisionX(orb)};
    if(orb.positionX<left && orb.lastCollision!=4) {orb.lastCollision=4; onCollisionX(orb)};

    if(orb.positionY>bottom && orb.lastCollision!=3) {orb.lastCollision=3; onCollisionY(orb)};
    if(orb.positionY<top && orb.lastCollision!=1) {orb.lastCollision=1; onCollisionY(orb)};
}

export const switchColor=(orb: Orb)=>{
    orb.colorR=(orb.colorR+randomInRange(0,50))%255;
    orb.colorG=(orb.colorG+randomInRange(0,50))%255;
    orb.colorB=(orb.colorB+randomInRange(0,50))%255;
}

export const randomInRange=(start: number, end: number): number=>{
    return Math.floor(Math.random()*(end-start))+start;
}

export const createShaderProgram = (gl: any, vertexShaderSource: string, fragmentShaderSource: string):WebGLProgram => {

    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource)
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource)

    const program = createProgram(gl, vertexShader, fragmentShader);

    return program
}


const createShader = (gl: any, type: number, source: any) => {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    const succes = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    if (succes) {
        return shader;
    }

    console.log(gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
}

const createProgram = (gl: any, vertexShader: any, fragmentShader: any) => {
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    const success = gl.getProgramParameter(program, gl.LINK_STATUS);
    if (success) {
        return program;
    }

    console.log(gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
}