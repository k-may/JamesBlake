
precision mediump float;

uniform mat4 u_worldViewProjection;

in vec4 position;
//in vec3 a_normal;
in vec2 texcoord;

out vec2 v_texCoord;
out vec4 v_position;

void main(){

    v_texCoord = texcoord;

    v_position = position;

    gl_Position = (u_worldViewProjection * position);
}