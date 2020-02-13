// an attribute will receive data from a buffer
attribute vec2 a_position;

uniform vec2 u_resolution;

// variable will be passed to fragment during rasterization
varying vec4 v_color;

// all shaders have a main function
void main() {

    // gl_Position is a special variable a vertex shader
    // is responsible for setting
    // преобразуем положение в пикселях к диапазону от 0.0 до 1.0
    vec2 zeroToOne = a_position / u_resolution;

    // преобразуем из 0->1 в 0->2
    vec2 zeroToTwo = zeroToOne * 2.0;

    // преобразуем из 0->2 в -1->+1 (пространство отсечения)
    vec2 clipSpace = zeroToTwo - 1.0;

    gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);

    // преобразование из пространства отсечения в пространство цвета
    // пространство отсечения находится в диапазоне от -1.0 до +1.0
    // пространство цвета находится в диапазоне от 0.0 до 1.0
    v_color = gl_Position * 0.5 + 0.5;
}