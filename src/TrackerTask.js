import EventEmitter from './utils/EventEmitter'

export default class TrackerTask extends EventEmitter {
    /**
     * TrackerTask utility.
     * @constructor
     * @extends {EventEmitter}
     */
    constructor(tracker) {
        super()

        if (!tracker) {
            throw new Error('Tracker instance not specified.');
        }

        this.setTracker(tracker);
    };

    /**
     * Holds the tracker instance managed by this task.
     * @type {Tracker}
     * @private
     */
    tracker_ = null;

    /**
     * Holds if the tracker task is in running.
     * @type {boolean}
     * @private
     */
    running_ = false;

    /**
     * Gets the tracker instance managed by this task.
     * @return {Tracker}
     */
    getTracker() {
        return this.tracker_;
    };

    /**
     * Returns true if the tracker task is in running, false otherwise.
     * @return {boolean}
     * @private
     */
    inRunning() {
        return this.running_;
    };

    /**
     * Sets if the tracker task is in running.
     * @param {boolean} running
     * @private
     */
    setRunning(running) {
        this.running_ = running;
    };

    /**
     * Sets the tracker instance managed by this task.
     * @return {Tracker}
     */
    setTracker(tracker) {
        this.tracker_ = tracker;
    };

    /**
     * Emits a `run` event on the tracker task for the implementers to run any
     * child action, e.g. `requestAnimationFrame`.
     * @return {TrackerTask} Returns itself, so calls can be chained.
     */
    run() {
        if (this.inRunning()) {
            return;
        }

        this.setRunning(true);
        this.reemitTrackEvent_ = event => this.emit('track', event)
        this.tracker_.on('track', this.reemitTrackEvent_);
        this.emit('run');
        return this;
    };

    /**
     * Emits a `stop` event on the tracker task for the implementers to stop any
     * child action being done, e.g. `requestAnimationFrame`.
     * @return {TrackerTask} Returns itself, so calls can be chained.
     */
    stop() {
        if (!this.inRunning()) {
            return;
        }

        this.setRunning(false);
        this.emit('stop');
        this.tracker_.removeListener('track', this.reemitTrackEvent_);
        return this;
    }
}
