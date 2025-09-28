// Screen width tracking
function updateScreenMeta() {
    const w = window.innerWidth;
    document.querySelector('meta[name="screen-width"]').setAttribute('content', w);
    document.documentElement.setAttribute('data-screen-width', w);
}
window.addEventListener('resize', updateScreenMeta);
updateScreenMeta();

// Search functionality with debounce
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

const searchInput = document.getElementById('search-input');
const searchResults = document.getElementById('search-results');

const performSearch = debounce(async (query) => {
    if (!query.trim()) {
        searchResults.innerHTML = '';
        return;
    }

    try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await response.json();
        
        searchResults.innerHTML = data.results.map(product => `
            <div class="search-result-item">
                <img src="${product.image}" alt="${product.title}" 
                     loading="lazy" class="search-result-img">
                <div class="search-result-info">
                    <h3>${product.title}</h3>
                    <p>${product.price}</p>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Search error:', error);
        searchResults.innerHTML = '<p>Error performing search</p>';
    }
}, 300);

searchInput.addEventListener('input', (e) => performSearch(e.target.value));

// Image overflow detection
document.querySelectorAll('img').forEach(img => {
    img.addEventListener('load', () => {
        const container = img.closest('.container');
        if (!container) return;
        if (img.naturalWidth > container.clientWidth - 32) {
            img.style.display = 'none';
        }
    });
});

// Hamburger menu
const hamburger = document.querySelector('.hamburger-lines');
const menuItems = document.querySelector('.menu-items');

hamburger.addEventListener('click', () => {
    const checkbox = document.querySelector('#checkbox');
    const isExpanded = checkbox.checked;
    hamburger.setAttribute('aria-expanded', !isExpanded);
    checkbox.checked = !isExpanded;
});