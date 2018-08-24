import Tracker from './Tracker'
import TrackerTask from './TrackerTask'
import ObjectTracker from './ObjectTracker'

/**
 * Captures the user camera when tracking a video element and set its source
 * to the camera stream.
 * @param {HTMLVideoElement} element Canvas element to track.
 * @param {object} options Optional configuration to the tracker.
 */
function initUserMedia(element, options={}) {
    window.navigator.mediaDevices.getUserMedia({
        video: true,
        audio: !!(options && options.audio),
    })
        .then(stream => {
            element.srcObject = stream
            element.onloadedmetadata = () => element.play()
        })
        .catch(() => {throw Error('Cannot capture user camera.')})
}

/**
 * Selects a dom node from a CSS3 selector using `document.querySelector`.
 * @param {string|HTMLElement} selector or element
 * @param {object} rootElement The root element for the query. When not
 *     specified `document` is used as root element.
 * @return {HTMLElement} The first dom element that matches to the selector.
 *     If not found, returns `null`.
 */
function one(selector, rootElement=document) {
    if (selector instanceof HTMLElement)
        return selector
    return rootElement.querySelector(selector)
}

/**
 * Tracks a video element based on the specified `tracker` instance. This
 * method extract the pixel information of the input element to pass to the
 * `tracker` instance. The `tracker.track(pixels, width, height)` will be in
 * a `requestAnimationFrame` loop in order to track all video frames.
 * @param {HTMLVideoElement} element Video element to track.
 * @param {Tracker} tracker The tracker instance used to track the element.
 * @private
 */
function trackVideo(element, tracker) {
    let canvas = /** @type {HTMLCanvasElement} */ document.createElement('canvas')
    let context = canvas.getContext('2d')
    let width
    let height


    // FIXME here the video display size of the analysed size
    let resizeCanvas = function() {
        width = element.offsetWidth
        height = element.offsetHeight
        canvas.width = width
        canvas.height = height
    }
    resizeCanvas()
    element.addEventListener('resize', resizeCanvas)

    // FIXME: do a process function - it is up to the caller to handle the frequency of detection
    let timeout
    function raf() {
        if (element.readyState === element.HAVE_ENOUGH_DATA) {
            context.drawImage(element, 0, 0, width, height)
            let imageData = context.getImageData(0, 0, width, height)
            tracker.once('track', () => timeout = setTimeout(raf, 0))
            tracker.track(imageData.data, width, height)
        }
        else
            requestAnimationFrame(raf)
    }

    let task = new TrackerTask(tracker)
    task.on('stop', () => clearTimeout(timeout))
    task.on('run', () => raf())
    return task.run()
}

/**
 * Tracks a canvas, image or video element based on the specified `tracker`
 * instance. This method extract the pixel information of the input element
 * to pass to the `tracker` instance. When tracking a video, the
 * `tracker.track(pixels, width, height)` will be in a
 * `requestAnimationFrame` loop in order to track all video frames.
 *
 * Example:
 * let tracker = new ColorTracker();
 *
 * track('#video', tracker);
 * or
 * track('#video', tracker, { camera: true });
 *
 * tracker.on('track', function(event) {
 *     console.log(event.data[0].x, event.data[0].y)
 * });
 *
 * @param {HTMLElement} element The element to track, canvas, image or video.
 * @param {Tracker} tracker The tracker instance used to track the element.
 * @param {object} options Optional configuration to the tracker.
 */
function track(element, tracker, options={}) {
    element = one(element)
    if (!element) {
        throw new Error('Element not found, try a different element or selector.')
    }
    if (!tracker) {
        throw new Error('Tracker not specified, try to pass some tracker.')
    }

    if (element instanceof HTMLVideoElement) {
        if (options && options.camera)
            initUserMedia(element, options)
        return trackVideo(element, tracker)
    }
    else
        throw new Error('Element not supported, try in a canvas, img, or video.')
}

export {track, Tracker, TrackerTask, ObjectTracker}
