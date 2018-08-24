/* global describe, it, before, require */

const chai = require('chai')
const {track} = require('../lib/recognify.min.js')

chai.expect()

const expect = chai.expect

describe('track function', () => {
    it('should be a function', () => {
        expect(track).to.be.a('function')
    })
})
