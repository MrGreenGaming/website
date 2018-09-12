//Babel Polyfill must always be first
require('babel-polyfill');

//Display dates and fromNow dates
const Moment = require('moment');
for (const el of document.querySelectorAll('.date')) {
    const parentheses = el.classList.contains('parentheses');
    const moment = Moment(new Date(el.dataset.date || el.textContent));
    const formattedMoment = moment.format(el.dataset.format);
    el.textContent = (parentheses ? '(' : '') + formattedMoment + (parentheses ? ')' : '');

    //Set date to element title
    if (el.classList.contains('titleDate'))
        el.setAttribute('title', formattedMoment);
}
for (const el of document.querySelectorAll('.fromNow')) {
    const parentheses = el.classList.contains('parentheses');
    const withoutSuffix = el.dataset.withoutSuffix === 'true';
    const moment = Moment(new Date(el.dataset.date || el.textContent));
    el.textContent = (parentheses ? '(' : '') + moment.fromNow(withoutSuffix) + (parentheses ? ')' : '');

    //Set date to element title
    if (el.classList.contains('titleDate'))
        el.setAttribute('title', moment.format(el.dataset.format));
}

//Navbar
// Get all "navbar-burger" elements
const navbarBurgersEl = Array.prototype.slice.call(document.querySelectorAll('.navbar-burger'), 0);

// Check if there are any navbar burgers
if (navbarBurgersEl.length > 0) {
    // Add a click event on each of them
    for (const el of navbarBurgersEl) {
        el.addEventListener('click', () => {

            // Get the target from the "data-target" attribute
            const target = el.dataset.target;
            const targetEl = document.getElementById(target);

            // Toggle the "is-active" class on both the "navbar-burger" and the "navbar-menu"
            el.classList.toggle('is-active');
            targetEl.classList.toggle('is-active');

        });
    }
}