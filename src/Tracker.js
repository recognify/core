import EventEmitter from './utils/EventEmitter'

export default class Tracker extends EventEmitter {
  /**
   * Tracker utility.
   * @constructor
   * @extends {EventEmitter}
   */
  constructor() {
    super()
  }

  /**
   * Tracks the pixels on the array. This method is called for each video
   * frame in order to emit `track` event.
   * @param {Uint8ClampedArray} pixels The pixels data to track.
   * @param {number} width The pixels canvas width.
   * @param {number} height The pixels canvas height.
   */
  track(pixels, width, height) {}
}
