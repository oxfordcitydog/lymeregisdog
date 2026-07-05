(function () {
    function escapeHtml(str) {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    const script = document.currentScript;
    const category = (script.dataset.category || '').trim().toLowerCase();
    const container = document.getElementById('listing');
    if (!container || !category) return;

    const csvUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSV1_-NajtwAbXLgtZZ_Os98aFK39NIFEu7mKdVmFyXFk2je23448Y71W8Uejz-1FNV38XOM3vueQpJ/pub?output=tsv';

    fetch(csvUrl)
        .then(res => res.text())
        .then(data => {
            const lines = data.split(/\r?\n/).filter(l => l.trim());
            const rows = lines.slice(1).map(line => line.split('\t')).filter(cols => cols.length >= 8);
            const matches = rows.filter(cols => (cols[1] || '').trim().toLowerCase() === category);

            if (matches.length === 0) {
                container.innerHTML = '<p>No reviews yet in this category &mdash; be the first to <a href="submit.html">add one</a>!</p>';
                return;
            }

            container.innerHTML = '<ul class="listing-list">' + matches.map(cols => {
                const dogName = cols[0] || '';
                const name = cols[2] || '';
                const rating = cols[3] || '';
                const w3w = (cols[4] || '').trim();
                const review = cols[5] || '';
                const avatar = (cols[8] || '').trim() || '🐾';
                const w3wLink = w3w
                    ? ' &mdash; <a href="https://what3words.com/' + encodeURIComponent(w3w) + '" target="_blank" rel="noopener">///' + escapeHtml(w3w) + '</a>'
                    : '';
                const dogLine = dogName
                    ? '<div class="listing-reviewer">Reviewed by ' + escapeHtml(avatar) + ' ' + escapeHtml(dogName) + '</div>'
                    : '';
                return '<li><strong>' + escapeHtml(name) + '</strong> (' + escapeHtml(rating) + '/5)' + w3wLink + dogLine + '<p>' + escapeHtml(review) + '</p></li>';
            }).join('') + '</ul>';

            // Structured data so Google can consider these as rich-snippet-eligible reviews.
            const jsonLd = {
                '@context': 'https://schema.org',
                '@type': 'ItemList',
                'itemListElement': matches.map((cols, i) => {
                    const rating = parseInt(cols[3], 10);
                    const entry = {
                        '@type': 'Review',
                        'position': i + 1,
                        'itemReviewed': { '@type': 'Place', 'name': cols[2] || '' },
                        'reviewBody': cols[5] || ''
                    };
                    if (cols[0]) {
                        entry.author = { '@type': 'Person', 'name': cols[0] };
                    }
                    if (!isNaN(rating)) {
                        entry.reviewRating = { '@type': 'Rating', 'ratingValue': rating, 'bestRating': 5, 'worstRating': 1 };
                    }
                    return entry;
                })
            };
            const ldScript = document.createElement('script');
            ldScript.type = 'application/ld+json';
            ldScript.textContent = JSON.stringify(jsonLd);
            document.head.appendChild(ldScript);
        })
        .catch(err => {
            console.error('Error loading listing:', err);
            container.innerHTML = '<p>Couldn\'t load the review list right now.</p>';
        });
})();
