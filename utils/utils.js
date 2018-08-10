class Utils {
    static displayText(text) {
        return this.nl2br(this.escapeHtml(text));

    }

    static nl2br(str) {
        return (str + '').replace(/(\r\n|\n\r|\r|\n)/g, '<br>$1');
    }

    static escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            '\'': '&#039;'
        };

        return text.replace(/[&<>"']/g, m => {
            return map[m];
        });
    }
}

module.exports = Utils;