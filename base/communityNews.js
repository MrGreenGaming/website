let newsItems = [];
const newsRefreshTimeoutSeconds = 20 * 60;

class CommunityNews {
    /**
     * Initialize
     * @return {void}
     */
    static initialize() {
        /**
         * @async
         * @return {void}
         */
        const requestItemsAsync = async () => {
            let items;
            try {
                items = await this.requestFeedItems();
            } catch (error) {
                log.warn(error);
            }

            if (items && items.length) {
                newsItems = items;
                log.debug('Refreshed community news');
            }

            setTimeout(requestItemsAsync, newsRefreshTimeoutSeconds * 1000);
        };

        requestItemsAsync();
    }

    static requestFeedItems() {
        return new Promise(async (resolve, reject) => {
            const Parser = require('rss-parser');
            const parser = new Parser();

            let feed;
            try {
                feed = await parser.parseURL('https://mrgreengaming.com/forums/forum/2-announcements.xml/');
            } catch(error) {
                reject(error);
                return;
            }

            //Only cache data what we need
            const items = [];
            for (const feedItem of feed.items) {
                items.push({
                    title: feedItem.title,
                    link: feedItem.link
                });
            }

            resolve(items);
        });
    }

    /**
     *
     * @return {Array} newsItems
     */
    static getItems() {
        return newsItems;
    }
}
CommunityNews.initialize();

module.exports = CommunityNews;