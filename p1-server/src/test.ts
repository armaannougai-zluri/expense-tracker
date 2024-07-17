import fetch from 'node-fetch';

const url = 'https://api.example.com/data'; // Replace with your API endpoint
const apiKey = 'YOUR_API_KEY'; // If you need an API key or other headers

const fetchData = async () => {
  try {
    const response = await fetch(url, {
      method: 'GET', // or 'POST', 'PUT', etc.
      insecureHTTPParser: true,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.statusText}`);
    }

    const data = await response.json();
  } catch (error) {
    console.error('Error fetching data:', error);
  }
};

fetchData();
