export const frag: string= `

precision mediump float;
const int <ORBCOUNT=0>;

uniform float u_time;
uniform vec2 u_resolution;

uniform float u_orbData[<DYNAMIC_LENGTH>];

float aspectRatio=u_resolution.x / u_resolution.y;

uniform float u_distanceModifier;

vec3 getColSum(vec2 uv){
    vec3 sumColor=vec3(0.0);

    for(int i=0; i<ORBCOUNT; i++){
        vec2 normBallPos=vec2(u_orbData[6*i+1], u_orbData[6*i+2]);
        float ballDistance=distance(normBallPos, uv);
        float multDist=ballDistance / u_distanceModifier;

        float distRadius=u_orbData[6*i] / multDist;

        sumColor+=vec3(distRadius*vec3(u_orbData[6*i+3], u_orbData[6*i+4], u_orbData[6*i+5]));
    }
    
    return (sumColor / float(ORBCOUNT));

}

void main() {
    gl_FragColor = vec4(getColSum(gl_FragCoord.xy), 1.0);
}

`

export const vert: string= `
precision mediump float;
attribute vec4 a_position;

void main() {
    gl_Position = a_position;
}

`

