import '@testing-library/jest-dom';

// Mock environment variables
process.env.REACT_APP_API_URL = 'http://localhost:3001/api';

// Mock window.location
delete window.location;
window.location = { href: '' };