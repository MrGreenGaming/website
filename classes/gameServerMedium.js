class GameServerMedium {
    /**
     *
     * @param {number} id
     */
    constructor(id) {
        this.id = id;
    }

    /**
     * Get medium id
     * @return {number} id
     */
    getId() {
        return this.id;
    }

    /**
     * Set type
     * @param {string} type
     */
    setType(type) {
        this.type = type;
    }

    /**
     * Set path
     * @param {string} path
     */
    setPath(path) {
        this.path = path;
    }

    /**
     * Set url
     * @param {string} url
     */
    setUrl(url) {
        this.url = url;
    }

    /**
     * Get url
     * @returns {string|void} url
     */
    getUrl() {
        if (this.url)
            return this.url;
        else if (this.path) {
            log.debug('Implement path in getUrl');
        }
    }

    /**
     * Get type
     * @returns {string|void} type
     */
    getType() {
        this.type = type;
    }

    /**
     * Get path
     * @returns {string|void} path
     */
    getPath() {
        this.path = path;
    }
}

module.exports = GameServerMedium;