export default class DisjointSet {
    /**
     * DisjointSet utility with path compression. Some applications involve
     * grouping n distinct objects into a collection of disjoint sets. Two
     * important operations are then finding which set a given object belongs to
     * and uniting the two sets. A disjoint set data structure maintains a
     * collection S={ S1 , S2 ,..., Sk } of disjoint dynamic sets. Each set is
     * identified by a representative, which usually is a member in the set.
     * @static
     * @constructor
     */
    constructor(length) {
        if (length === undefined) {
            throw new Error('DisjointSet length not specified.')
        }
        this.length = length
        this.parent = new Uint32Array(length)
        for (let i = 0; i < length; i++) {
            this.parent[i] = i
        }
    }

    /**
     * Holds the length of the internal set.
     * @type {number}
     */
    length = 0

    /**
     * Holds the set containing the representative values.
     * @type {Uint32Array}
     */
    parent = null

    /**
     * Finds a pointer to the representative of the set containing i.
     * @param {number} i
     * @return {number} The representative set of i.
     */
    find(i) {
        if (this.parent[i] === i) {
            return i
        } else {
            return (this.parent[i] = this.find(this.parent[i]))
        }
    }

    /**
     * Unites two dynamic sets containing objects i and j, say Si and Sj, into
     * a new set that Si ∪ Sj, assuming that Si ∩ Sj = ∅
     * @param {number} i
     * @param {number} j
     */
    union(i, j) {
        const iRepresentative = this.find(i)
        this.parent[iRepresentative] = this.find(j)
    }
}
