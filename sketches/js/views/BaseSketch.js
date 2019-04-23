/* eslint-disable */
import {BaseView} from './BaseView.js';

export class BaseSketch extends BaseView {

    constructor(className) {
        super(null, className);
    }

    /***
     * Put your render code here
     */
    draw(time) {
    }

    /***
     * Override this for custom scroll. Defaults to element offsetHeight, then
     * double window height.
     *
     * @returns {number}
     */
    getHeight() {
        return this.el.offsetHeight || window.innerHeight * 2;
    }

    onResize(w, h) {
    }

    onScroll(percentage) {
    }

    onClick(e) {
    }

    onMouseMove(e) {
    }

    onMouseUp() {
    }

    onMouseDown() {
    }

}