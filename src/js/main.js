import '@fortawesome/fontawesome-free/css/all.min.css';
import '@fontsource/montserrat/400.css';
import '@fontsource/montserrat/700.css';
import '@fontsource/lato/400.css';
import '@fontsource/lato/700.css';
import '@fontsource/lato/400-italic.css';
import '@fontsource/lato/700-italic.css';
import '../scss/main.scss';

import Collapse from 'bootstrap/js/dist/collapse';

// Sticky navbar background once the page scrolls past 100px
// (replaces the removed Bootstrap 3 "Affix" plugin).
const mainNav = document.getElementById('mainNav');

function updateAffixState() {
  mainNav.classList.toggle('affix', window.scrollY > 100);
}

window.addEventListener('scroll', updateAffixState);
updateAffixState();

// Close the mobile nav menu when a nav link is clicked.
const navCollapseEl = document.getElementById('bs-example-navbar-collapse-1');

navCollapseEl.querySelectorAll('.nav-link').forEach((link) => {
  link.addEventListener('click', () => {
    Collapse.getOrCreateInstance(navCollapseEl, { toggle: false }).hide();
  });
});
