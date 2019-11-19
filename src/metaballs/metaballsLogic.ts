import { frag, vert } from './shaders';
import Orb from './Orb';
import { checkCollisionRect, createShaderProgram, randomInRange } from './util';

interface minMax {
    min: number;
    max: number;
}
interface OrbConfig {
    size?: number;

    posX?: number;
    posY?: number;

    colorR?: number;
    colorG?: number;
    colorB?: number;

    moveX?: number;
    moveY?: number;
}

interface Container {
    top: number,
    right: number,
    bottom: number,
    left: number
}

export class MetaBalls {
    canvasRef: HTMLCanvasElement;
    containerRef: HTMLElement;

    orbSettings: Array<OrbConfig> | undefined | null;
    orbCount: number;
    orbArray: Array<Orb> = [];
    onCollisionX: Function = (orb: Orb) => { orb.reflectX() };
    onCollisionY: Function = (orb: Orb) => { orb.reflectY() };

    gl: WebGLRenderingContext | null;
    shaderProgram: WebGLProgram | null = null;
    renderLoop: any;

    lastContainerWidth: number;
    lastContainerHeight: number;

    containIn: Container = { top: 0, right: 0, bottom: 0, left: 0 };

    constructor(canvasRef: HTMLCanvasElement, containerRef: HTMLElement, deflectMovement: minMax | undefined, shiftColor: minMax | undefined, orbSettings?: Array<object> | null | undefined, ) {
        this.canvasRef = canvasRef;
        this.orbSettings = orbSettings;
        this.orbCount = orbSettings ? orbSettings.length : randomInRange(2, 10);
        this.gl = canvasRef.getContext("webgl");
        this.lastContainerWidth = containerRef.clientWidth; /* TODO if canvasRef.size!=containerRef.size find out orbs position inside containerRef */
        this.lastContainerHeight = containerRef.clientHeight;
        this.containerRef = containerRef;

        if (deflectMovement && shiftColor) {
            this.onCollisionX = (orb: Orb) => {
                orb.reflectX();
                orb.deflectMovementX(deflectMovement.min, deflectMovement.max);
                orb.shiftColor(shiftColor.min, shiftColor.max);
            }
            this.onCollisionY = (orb: Orb) => {
                orb.reflectY();
                orb.deflectMovementY(deflectMovement.min, deflectMovement.max);
                orb.shiftColor(shiftColor.min, shiftColor.max);
            }
        } else if (deflectMovement) {
            this.onCollisionX = (orb: Orb) => {
                orb.reflectX();
                orb.deflectMovementX(deflectMovement.min, deflectMovement.max);
            }
            this.onCollisionY = (orb: Orb) => {
                orb.reflectY();
                orb.deflectMovementY(deflectMovement.min, deflectMovement.max);
            }

        } else if (shiftColor) {
            this.onCollisionX = (orb: Orb) => {
                orb.reflectX();
                orb.shiftColor(shiftColor.min, shiftColor.max);
            }
            this.onCollisionY = (orb: Orb) => {
                orb.reflectY();
                orb.shiftColor(shiftColor.min, shiftColor.max);
            }
        }

    }
    setCanvasDim() {
        this.canvasRef.width = this.canvasRef.clientWidth;
        this.canvasRef.height = this.canvasRef.clientHeight;

        /* set the area where orbs spawn and bounce around */
        const { offsetTop, offsetLeft, clientWidth, clientHeight } = this.containerRef;

        this.containIn.bottom = this.canvasRef.clientHeight - offsetTop;  // adjust for webgl coordinate system grows bottom to top but the container position starts at top
        this.containIn.right = offsetLeft + clientWidth;
        this.containIn.top = this.canvasRef.clientHeight - offsetTop - clientHeight;
        this.containIn.left = offsetLeft;

    }

    create() {
        if (this.canvasRef) {
            /* set renderer dimensions */
            this.setCanvasDim();

            this.createOrbs();

            /* change fragment shaderstring with calculated arraysize */
            const fragWithDynamicLength = this.setDynamicLength(frag, this.orbCount);
            this.shaderProgram = createShaderProgram(this.gl, vert, fragWithDynamicLength);
        } else console.log("no reference to the canvas was found")
    }

    private createOrbs() {
        this.orbArray = []

        const { top, right, bottom, left } = this.containIn
        /* if some orbSettings are given use them to create the orbs */
        if (this.orbSettings && this.orbSettings.length > 0) {
            return this.orbSettings.forEach((orbConfig, index) => {
                this.orbArray[index] = new Orb(
                    orbConfig.size || randomInRange(4, 60),
                    (orbConfig.posX && orbConfig.posX > left && orbConfig.posX < right) ? orbConfig.posX : randomInRange(left, right),
                    (orbConfig.posY && orbConfig.posY > top && orbConfig.posY < bottom) ? orbConfig.posY : randomInRange(top, bottom),
                    orbConfig.colorR || randomInRange(0, 255),
                    orbConfig.colorG || randomInRange(0, 255),
                    orbConfig.colorB || randomInRange(0, 255),
                    orbConfig.moveX || randomInRange(1, 5),
                    orbConfig.moveY || randomInRange(1, 5)
                )
            })
        }
        /* else go full random */
        for (let i = 0; i < this.orbCount; i++) {
            this.orbArray[i] = new Orb(
                randomInRange(4, 60),
                randomInRange(left, right), randomInRange(top, bottom),
                randomInRange(0, 255), randomInRange(0, 255), randomInRange(0, 255),
                randomInRange(1, 5), randomInRange(1, 5)
            )
        }
    }




    private setDynamicLength = (shaderString: string, length: number): string => {
        const dataLengthSet = shaderString.replace(/<DYNAMIC_LENGTH>/, String(length * 6));
        const arrSizeSet = dataLengthSet.replace(/<ORBCOUNT=0>/, `ORBCOUNT=${length}`);
        return arrSizeSet;
    }

    private setPositionInBounds = () => {
        /* TODO find orbs position inside innerContainer containerRef */
        this.orbArray.forEach(e => {
            /* get the relative position with the previos containersize and set it for the new containersize */
            e.positionX = Math.floor(e.positionX / this.lastContainerWidth * this.containerRef.clientWidth) + this.containerRef.offsetLeft
            e.positionY = Math.floor(e.positionY / this.lastContainerHeight * this.containerRef.clientHeight) + this.containerRef.offsetTop
        })

        /* update lastContainer size */
        this.lastContainerWidth = this.canvasRef.clientWidth;
        this.lastContainerHeight = this.canvasRef.clientHeight;
    }

    private u_orbDataFromArray = (orbArray: Array<Orb>) => {
        const u_orbDataArray = [];
        for (let i = 0; i < orbArray.length; i++) {
            u_orbDataArray.push(orbArray[i].size);
            u_orbDataArray.push(orbArray[i].positionX);
            u_orbDataArray.push(orbArray[i].positionY);
            u_orbDataArray.push(orbArray[i].colorR / 255); // scale colors to 0-1.0 for the shader to reduce math in loops there
            u_orbDataArray.push(orbArray[i].colorG / 255);
            u_orbDataArray.push(orbArray[i].colorB / 255);
        }
        return u_orbDataArray;
    }

    private updateOrbs = () => {
        this.orbArray.forEach(orb => {
            orb.updatePosition();
            checkCollisionRect(orb, this.containIn.top, this.containIn.right, this.containIn.bottom, this.containIn.left, this.onCollisionX, this.onCollisionY);
        })
    }



    render = () => {
        if (this.gl && this.shaderProgram) {
            let positionLocation = this.gl.getAttribLocation(this.shaderProgram, "a_position");

            // Create a buffer to put three 2d clip space points in 
            let positionBuffer = this.gl.createBuffer();

            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, positionBuffer);
            this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array([
                -1, -1, // tri 1
                1, -1,
                -1, 1,
                -1, 1, // tri 2
                1, -1,
                1, 1,
            ]), this.gl.STATIC_DRAW);

            // Tell it to use our program (pair of shaders)
            this.gl.useProgram(this.shaderProgram);


            // look up resolution uniform location
            const uResolutionLocation = this.gl.getUniformLocation(this.shaderProgram, "u_resolution");

            // look up orb uniform array location
            const uOrbArrayLocation = this.gl.getUniformLocation(this.shaderProgram, "u_orbData");

            const uDistModifierLocation = this.gl.getUniformLocation(this.shaderProgram, "u_distanceModifier");

            this.gl.uniform1f(uDistModifierLocation, 5.0);
            // set resolution
            this.gl.uniform2fv(uResolutionLocation, [this.canvasRef.clientWidth, this.canvasRef.clientHeight]);



            // Turn on the position attribute
            this.gl.enableVertexAttribArray(positionLocation);

            // Bind the position buffer.
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, positionBuffer);


            // Tell the position attribute how to get data out of positionBuffer (ARRAY_BUFFER)
            let size = 2; // 2 components per iteration
            let type = this.gl.FLOAT; // the data is 32bit floats
            let normalize = false; // don't normalize the data
            let stride = 0; // 0 = move forward size * sizeof(type) each iteration to get the next position
            let offset = 0; // start at the beginning of the buffer
            this.gl.vertexAttribPointer(positionLocation, size, type, normalize, stride, offset);


            this.gl.viewport(0, 0, this.canvasRef.width, this.canvasRef.height);
            // Clear the canvas
            this.gl.clearColor(0, 0, 0, 0);
            this.gl.clear(this.gl.COLOR_BUFFER_BIT);

            window.onresize = () => {
                if (this.gl) {
                    this.setCanvasDim()

                    /* recover orbs that might be off screen */
                    this.setPositionInBounds()

                    this.gl.uniform2fv(uResolutionLocation, [this.canvasRef.clientWidth, this.canvasRef.clientHeight]);
                    this.gl.viewport(0, 0, this.gl.drawingBufferWidth, this.gl.drawingBufferHeight);
                }

            }


            const drawLoop = (gl: WebGLRenderingContext): void => {
                this.updateOrbs();
                gl.uniform1fv(uOrbArrayLocation,
                    this.u_orbDataFromArray(this.orbArray)
                )

                // Draw the rectangle.
                gl.drawArrays(gl.TRIANGLES, 0, 6);



                this.renderLoop = requestAnimationFrame(() => drawLoop(gl));
            }
            drawLoop(this.gl);
        }

    }



    destroy = () => {
        if (this.gl) {
            cancelAnimationFrame(this.renderLoop);
            this.gl.deleteProgram(this.shaderProgram);
        }
    }

}



