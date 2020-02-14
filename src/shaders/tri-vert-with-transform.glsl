precision mediump float;
attribute vec2 a_position;
uniform vec2 u_transform;

void main() {
    gl_Position = vec4(a_position, 0, 1);
}