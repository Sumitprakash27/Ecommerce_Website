// Enhanced Search functionality for both desktop and mobile
function initializeSearch() {
    const searchInputDesktop = document.getElementById('search-input');
    const searchResultsDesktop = document.getElementById('search-results');
    const searchInputMobile = document.getElementById('search-input-mobile');
    const searchResultsMobile = document.getElementById('search-results-mobile');

    // Function to handle search for both inputs
    async function handleSearch(inputElement, resultsElement) {
        if (!inputElement || !resultsElement) return;
        
        const query = inputElement.value.trim();
        
        if (query.length < 2) {
            resultsElement.innerHTML = '';
            resultsElement.style.display = 'none';
            return;
        }

        try {
            console.log('Searching for:', query);
            const response = await fetch(`http://localhost:5000/api/products/search?q=${encodeURIComponent(query)}`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('Search results:', data);
            
            if (data.results && data.results.length > 0) {
                resultsElement.innerHTML = data.results.map(product => `
                    <div class="search-result-item" onclick="viewProduct('${product._id}')">
                        <img src="${product.mainImage || 'https://via.placeholder.com/50'}" alt="${product.title}" onerror="this.src='https://via.placeholder.com/50'">
                        <div class="search-result-content">
                            <h4>${product.title}</h4>
                            <p class="description">${product.descriptionShort || ''}</p>
                            <p class="price">₹${Math.round(product.price * 83).toLocaleString('en-IN')}</p>
                        </div>
                    </div>
                `).join('');
                resultsElement.style.display = 'block';
            } else {
                resultsElement.innerHTML = '<div class="no-results">No products found for "' + query + '"</div>';
                resultsElement.style.display = 'block';
            }
        } catch (error) {
            console.error('Search error:', error);
            resultsElement.innerHTML = '<div class="search-error">Search temporarily unavailable. Please try again.</div>';
            resultsElement.style.display = 'block';
        }
    }

    // Add event listeners to both search inputs
    if (searchInputDesktop) {
        searchInputDesktop.addEventListener('input', function() {
            handleSearch(this, searchResultsDesktop);
            // Sync with mobile input
            if (searchInputMobile) {
                searchInputMobile.value = this.value;
            }
        });
    }

    if (searchInputMobile) {
        searchInputMobile.addEventListener('input', function() {
            handleSearch(this, searchResultsMobile);
            // Sync with desktop input
            if (searchInputDesktop) {
                searchInputDesktop.value = this.value;
            }
        });
    }

    // Hide search results when clicking outside
    document.addEventListener('click', function(event) {
        const isSearchContainer = event.target.closest('.search-container-nav') || 
                                 event.target.closest('.search-container-mobile');
        if (!isSearchContainer) {
            if (searchResultsDesktop) searchResultsDesktop.style.display = 'none';
            if (searchResultsMobile) searchResultsMobile.style.display = 'none';
        }
    });
}

// Initialize search when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeSearch);
} else {
    initializeSearch();
}