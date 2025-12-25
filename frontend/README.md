# Zariya - The Thrift and Credit Co-operative Society Limited

A modern, professional single-page website for Zariya microfinance institute built with React.js and SCSS.

## Features

- 🎨 Modern, clean, and professional design
- 📱 Fully responsive (mobile, tablet, desktop)
- ⚡ Ultra-fast load times with optimized performance
- 🎯 Custom SCSS styling (no CSS frameworks)
- 🖼️ Free stock images from Unsplash
- 🚀 Built with Vite for optimal development experience

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and visit `http://localhost:5173`

### Build for Production

To create an optimized production build:

```bash
npm run build
```

The built files will be in the `dist` directory.

### Preview Production Build

To preview the production build locally:

```bash
npm run preview
```

## Project Structure

```
frontend/
├── src/
│   ├── components/          # React components
│   │   ├── Header.jsx
│   │   ├── Hero.jsx
│   │   ├── About.jsx
│   │   ├── Services.jsx
│   │   ├── Features.jsx
│   │   ├── Process.jsx
│   │   ├── Contact.jsx
│   │   └── Footer.jsx
│   ├── styles/              # SCSS stylesheets
│   │   ├── main.scss        # Global styles and variables
│   │   └── App.scss         # App-level styles
│   ├── App.jsx              # Main App component
│   └── main.jsx             # Entry point
├── index.html
├── package.json
└── vite.config.js
```

## Customization

### Colors

Edit the CSS variables in `src/styles/main.scss` to customize the color scheme:

```scss
:root {
  --primary-color: #2563eb;
  --secondary-color: #10b981;
  // ... other variables
}
```

### Content

Edit the component files in `src/components/` to update text, images, and other content.

## Performance Optimizations

- Code splitting with manual chunks
- Image lazy loading
- Minified production builds
- Optimized font loading with preconnect
- Efficient CSS with SCSS

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

© 2024 Zariya - The Thrift and Credit Co-operative Society Limited

