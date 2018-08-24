import Tracker from './Tracker'
import detect from './detection/ViolaJones'
import * as detectClassifiers from './detection/classifiers'

export default class ObjectTracker extends Tracker {
    /**
     * ObjectTracker utility.
     * @constructor
     * @param {string|Array.<string|Float64Array>} classifiers Optional
     *     object classifiers to track.
     * @extends {Tracker}
     */
    constructor(classifiers=[]) {
        super()

        const cs = []
        if (classifiers) {
            if (!Array.isArray(classifiers)) {
                classifiers = [classifiers]
            }

            for (let classifier of classifiers) {
                if (typeof classifier !== 'string')
                    throw new Error('Object classifier should be a string.')
                const violaClass = detectClassifiers[classifier]
                if (!violaClass)
                    throw new Error('Object classifier unknown, try `new recognify.ObjectTracker("face")`.')
                cs.push(violaClass)
            }
        }

        this.setClassifiers(cs)
    }


    /**
     * Specifies the edges density of a block in order to decide whether to skip
     * it or not.
     * @default 0.2
     * @type {number}
     */
    edgesDensity = 0.2

    /**
     * Specifies the initial scale to start the feature block scaling.
     * @default 1.0
     * @type {number}
     */
    initialScale = 1.0

    /**
     * Specifies the scale factor to scale the feature block.
     * @default 1.25
     * @type {number}
     */
    scaleFactor = 1.25

    /**
     * Specifies the block step size.
     * @default 1.5
     * @type {number}
     */
    stepSize = 1.5

    /**
     * Gets the tracker HAAR classifiers.
     * @return {Array<Float64Array>}
     */
    getClassifiers() {
        return this.classifiers
    }

    /**
     * Gets the edges density value.
     * @return {number}
     */
    getEdgesDensity() {
        return this.edgesDensity
    }

    /**
     * Gets the initial scale to start the feature block scaling.
     * @return {number}
     */
    getInitialScale() {
        return this.initialScale
    }

    /**
     * Gets the scale factor to scale the feature block.
     * @return {number}
     */
    getScaleFactor() {
        return this.scaleFactor
    }

    /**
     * Gets the block step size.
     * @return {number}
     */
    getStepSize() {
        return this.stepSize
    }

    /**
     * Tracks the `Video` frames. This method is called for each video frame in
     * order to emit `track` event.
     * @param {Uint8ClampedArray} pixels The pixels data to track.
     * @param {number} width The pixels canvas width.
     * @param {number} height The pixels canvas height.
     */
    track(pixels, width, height) {
        let classifiers = this.getClassifiers()

        if (!classifiers) {
            throw new Error('Object classifier not specified, try `new recognify.ObjectTracker("face")`.')
        }

        let results = []

        for (let classifier of classifiers) {
            results.push(...detect(pixels, width, height, this.getInitialScale(), this.getScaleFactor(),
                this.getStepSize(), this.getEdgesDensity(), classifier)
            )
        }

        this.emit('track', {
            data: results
        })
    }

    /**
     * Sets the tracker HAAR classifiers.
     * @param {Array<Float64Array>} classifiers
     */
    setClassifiers(classifiers) {
        this.classifiers = classifiers
    }

    /**
     * Sets the edges density.
     * @param {number} edgesDensity
     */
    setEdgesDensity(edgesDensity) {
        this.edgesDensity = edgesDensity
    }

    /**
     * Sets the initial scale to start the block scaling.
     * @param {number} initialScale
     */
    setInitialScale(initialScale) {
        this.initialScale = initialScale
    }

    /**
     * Sets the scale factor to scale the feature block.
     * @param {number} scaleFactor
     */
    setScaleFactor(scaleFactor) {
        this.scaleFactor = scaleFactor
    }

    /**
     * Sets the block step size.
     * @param {number} stepSize
     */
    setStepSize(stepSize) {
        this.stepSize = stepSize
    }
}
