document.getElementById('url-form').addEventListener('submit', function(event) {
    event.preventDefault();

    const longUrl = document.getElementById('long-url').value;
    const resultDiv = document.getElementById('result');
    const shortUrlLink = document.getElementById('short-url');

    if (!isValidUrl(longUrl)) {
        alert('Please enter a valid URL');
        return;
    }

    shortenUrl(longUrl).then(shortUrl => {
        shortUrlLink.href = shortUrl;
        shortUrlLink.textContent = shortUrl;
        resultDiv.classList.remove('hidden');
    }).catch(error => {
        alert('An error occurred while shortening the URL. Please try again later.');
        console.error(error);
    });
});

function isValidUrl(url) {
    try {
        new URL(url);
        return true;
    } catch (_) {
        return false;
    }
}

async function shortenUrl(longUrl) {
    const apiKey = 'cb9f4574ddaa01601cb5fcca3f1fdadb8a5ef433';
    const apiUrl = 'https://api-ssl.bitly.com/v4/shorten'; 
    const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ long_url: longUrl })
    });

    if (!response.ok) {
        throw new Error('Failed to shorten the URL');
    }

    const data = await response.json();
    return data.link; 
}
