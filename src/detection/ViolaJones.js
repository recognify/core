import DisjointSet from '../utils/DisjointSet'
import {intersectRect} from '../utils/Math'
import {computeIntegralImage} from '../utils/Image'


/**
 * Fast check to test whether the edges density inside the block is greater
 * than a threshold, if true it tests the stages. This can improve
 * significantly performance.
 * @param {number} edgesDensity Percentage density edges inside the
 *     classifier block.
 * @param {array} integralImageSobel The integral image of a sobel image.
 * @param {number} i Vertical position of the pixel to be evaluated.
 * @param {number} j Horizontal position of the pixel to be evaluated.
 * @param {number} width The image width.
 * @param {number} blockWidth
 * @param {number} blockHeight
 * @return {boolean} True whether the block at position i,j can be skipped,
 *     false otherwise.
 * @static
 * @protected
 */
function isTriviallyExcluded(edgesDensity, integralImageSobel, i, j, width, blockWidth, blockHeight) {
    const wbA = i * width + j
    const wbB = wbA + blockWidth
    const wbD = wbA + blockHeight * width
    const wbC = wbD + blockWidth
    const blockEdgesDensity =
        (integralImageSobel[wbA] - integralImageSobel[wbB] - integralImageSobel[wbD] + integralImageSobel[wbC])
        / (blockWidth * blockHeight * 255)
    return blockEdgesDensity < edgesDensity

}


/**
 * Evaluates if the block size on i,j position is a valid HAAR cascade
 * stage.
 * @param {Float64Array} data The HAAR cascade data.
 * @param {Int32Array} integralImage
 * @param {Int32Array} integralImageSquare
 * @param {Int32Array} tiltedIntegralImage
 * @param {number} i Vertical position of the pixel to be evaluated.
 * @param {number} j Horizontal position of the pixel to be evaluated.
 * @param {number} width The image width.
 * @param {number} blockWidth
 * @param {number} blockHeight
 * @param {number} scale The scale factor of the block size and its original size.
 * @return {boolean} Whether the region passes all the stage tests.
 * @private
 * @static
 */
function evalStages(
    data, integralImage, integralImageSquare, tiltedIntegralImage, i, j, width, blockWidth, blockHeight, scale
) {
    const inverseArea = 1.0 / (blockWidth * blockHeight)
    const wbA = i * width + j
    const wbB = wbA + blockWidth
    const wbD = wbA + blockHeight * width
    const wbC = wbD + blockWidth
    const mean = (integralImage[wbA] - integralImage[wbB] - integralImage[wbD] + integralImage[wbC]) * inverseArea
    const variance = (integralImageSquare[wbA] - integralImageSquare[wbB] - integralImageSquare[wbD] + integralImageSquare[wbC]) * inverseArea - mean * mean

    let standardDeviation = 1
    if (variance > 0) {
        standardDeviation = Math.sqrt(variance)
    }

    const length = data.length

    for (let w = 2; w < length;) {
        let stageSum = 0
        const stageThreshold = data[w++]
        let nodeLength = data[w++]

        while (nodeLength--) {
            let rectsSum = 0
            const tilted = data[w++]
            const rectsLength = data[w++]

            for (let r = 0; r < rectsLength; r++) {
                const rectLeft = (j + data[w++] * scale + 0.5) | 0
                const rectTop = (i + data[w++] * scale + 0.5) | 0
                const rectWidth = (data[w++] * scale + 0.5) | 0
                const rectHeight = (data[w++] * scale + 0.5) | 0
                const rectWeight = data[w++]

                let w1
                let w2
                let w3
                let w4
                if (tilted) {
                    // RectSum(r) = RSAT(x-h+w, y+w+h-1) + RSAT(x, y-1) - RSAT(x-h, y+h-1) - RSAT(x+w, y+w-1)
                    w1 = (rectLeft - rectHeight + rectWidth) + (rectTop + rectWidth + rectHeight - 1) * width
                    w2 = rectLeft + (rectTop - 1) * width
                    w3 = (rectLeft - rectHeight) + (rectTop + rectHeight - 1) * width
                    w4 = (rectLeft + rectWidth) + (rectTop + rectWidth - 1) * width
                    rectsSum += (tiltedIntegralImage[w1] + tiltedIntegralImage[w2] - tiltedIntegralImage[w3] - tiltedIntegralImage[w4]) * rectWeight
                } else {
                    // RectSum(r) = SAT(x-1, y-1) + SAT(x+w-1, y+h-1) - SAT(x-1, y+h-1) - SAT(x+w-1, y-1)
                    w1 = rectTop * width + rectLeft
                    w2 = w1 + rectWidth
                    w3 = w1 + rectHeight * width
                    w4 = w3 + rectWidth
                    rectsSum += (integralImage[w1] - integralImage[w2] - integralImage[w3] + integralImage[w4]) * rectWeight
                    // TODO: Review the code below to analyze performance when using it instead.
                    // w1 = (rectLeft - 1) + (rectTop - 1) * width
                    // w2 = (rectLeft + rectWidth - 1) + (rectTop + rectHeight - 1) * width
                    // w3 = (rectLeft - 1) + (rectTop + rectHeight - 1) * width
                    // w4 = (rectLeft + rectWidth - 1) + (rectTop - 1) * width
                    // rectsSum += (integralImage[w1] + integralImage[w2] - integralImage[w3] - integralImage[w4]) * rectWeight
                }
            }

            const nodeThreshold = data[w++]
            const nodeLeft = data[w++]
            const nodeRight = data[w++]

            if (rectsSum * inverseArea < nodeThreshold * standardDeviation) {
                stageSum += nodeLeft
            } else {
                stageSum += nodeRight
            }
        }

        if (stageSum < stageThreshold) {
            return false
        }
    }
    return true
}


/**
 * Postprocess the detected sub-windows in order to combine overlapping
 * detections into a single detection.
 * @param {array} rects
 * @param {number} regionsOverlap
 * @return {array}
 * @private
 * @static
 */
function mergeRectangles(rects, regionsOverlap) {
    const disjointSet = new DisjointSet(rects.length)

    for (let i = 0; i < rects.length; i++) {
        const r1 = rects[i]
        for (let j = 0; j < rects.length; j++) {
            const r2 = rects[j]
            if (intersectRect(
                r1.x, r1.y, r1.x + r1.width, r1.y + r1.height,
                r2.x, r2.y, r2.x + r2.width, r2.y + r2.height
            )) {
                const x1 = Math.max(r1.x, r2.x)
                const y1 = Math.max(r1.y, r2.y)
                const x2 = Math.min(r1.x + r1.width, r2.x + r2.width)
                const y2 = Math.min(r1.y + r1.height, r2.y + r2.height)
                const overlap = (x1 - x2) * (y1 - y2)
                const area1 = (r1.width * r1.height)
                const area2 = (r2.width * r2.height)

                if ((overlap / (area1 * (area1 / area2)) >= regionsOverlap) &&
                    (overlap / (area2 * (area1 / area2)) >= regionsOverlap)) {
                    disjointSet.union(i, j)
                }
            }
        }
    }

    const map = {}
    for (let k = 0; k < disjointSet.length; k++) {
        const rep = disjointSet.find(k)
        if (!map[rep]) {
            map[rep] = {
                total: 1,
                width: rects[k].width,
                height: rects[k].height,
                x: rects[k].x,
                y: rects[k].y
            }
            continue
        }
        map[rep].total++
        map[rep].width += rects[k].width
        map[rep].height += rects[k].height
        map[rep].x += rects[k].x
        map[rep].y += rects[k].y
    }

    return Object.keys(map).map(key => {
        const rect = map[key]
        return {
            total: rect.total,
            width: (rect.width / rect.total + 0.5) | 0,
            height: (rect.height / rect.total + 0.5) | 0,
            x: (rect.x / rect.total + 0.5) | 0,
            y: (rect.y / rect.total + 0.5) | 0
        }
    })
}


/**
 * Detects through the HAAR cascade data rectangles matches.
 * @param {Uint8ClampedArray} pixels The pixels in a linear [r,g,b,a,...] array.
 * @param {number} width The image width.
 * @param {number} height The image height.
 * @param {number} initialScale The initial scale to start the block
 *     scaling.
 * @param {number} scaleFactor The scale factor to scale the feature block.
 * @param {number} stepSize The block step size.
 * @param {number} edgesDensity Percentage density edges inside the
 *     classifier block. Value from [0.0, 1.0], defaults to 0.2. If specified
 *     edge detection will be applied to the image to prune dead areas of the
 *     image, this can improve significantly performance.
 * @param {Float64Array} data The HAAR cascade data.
 * @param {number} regionsOverlap Holds the minimum area of intersection that defines when a rectangle is
 * from the same group. Often when a face is matched multiple rectangles are
 * classified as possible rectangles to represent the face, when they
 * intersects they are grouped as one face.
 * @return {array} Found rectangles.
 * @static
 */
export default function detect(
    pixels, width, height, initialScale, scaleFactor, stepSize, edgesDensity, data, regionsOverlap=0.5
) {
    let total = 0
    const rects = []
    const integralImage = new Int32Array(width * height)
    const integralImageSquare = new Int32Array(width * height)
    const tiltedIntegralImage = new Int32Array(width * height)

    let integralImageSobel
    if (edgesDensity > 0) {
        integralImageSobel = new Int32Array(width * height)
    }

    computeIntegralImage(pixels, width, height, integralImage, integralImageSquare, tiltedIntegralImage, integralImageSobel)

    const minWidth = data[0]
    const minHeight = data[1]
    let scale = initialScale * scaleFactor
    let blockWidth = (scale * minWidth) | 0
    let blockHeight = (scale * minHeight) | 0

    while (blockWidth < width && blockHeight < height) {
        const step = (scale * stepSize + 0.5) | 0
        for (let i = 0; i < (height - blockHeight); i += step) {
            for (let j = 0; j < (width - blockWidth); j += step) {

                if (edgesDensity > 0
                    && isTriviallyExcluded(edgesDensity, integralImageSobel, i, j, width, blockWidth, blockHeight))
                    continue

                if (
                    evalStages(data, integralImage, integralImageSquare, tiltedIntegralImage, i, j,
                        width, blockWidth, blockHeight, scale)
                ) {
                    rects[total++] = {
                        width: blockWidth,
                        height: blockHeight,
                        x: j,
                        y: i
                    }
                }
            }
        }

        scale *= scaleFactor
        blockWidth = (scale * minWidth) | 0
        blockHeight = (scale * minHeight) | 0
    }
    return mergeRectangles(rects, regionsOverlap)
}
