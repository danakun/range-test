# Range Component Exercise

Custom range slider component built with Next.js, TypeScript, and comprehensive testing.

[https://range-test-gamma.vercel.app/](https://range-test-gamma.vercel.app/)

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository

```bash
git clone https://github.com/danakun/range-test.git
```

2. Install dependencies

```bash
npm install
```

3. Run the development server

```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser


## Features

- **Two Range Modes**: Normal range (min-max) and Fixed values
- **Fully Responsive**: Works on desktop, tablet, and mobile devices
- **Accessible**: Full keyboard navigation and screen reader support
- **Touch Support**: Native touch interactions for mobile devices
- **Type Safe**: Built with TypeScript
- **Tested**: Comprehensive unit test coverage

## Exercises

### Exercise 1 - Normal Range

- **Route**: `/exercise1`
- **Features**: Draggable handles, editable min/max labels, continuous values
- **API**: Fetches min/max configuration from server

### Exercise 2 - Fixed Values

- **Route**: `/exercise2`
- **Features**: Snap-to-value handles, currency formatting, predefined values
- **API**: Fetches fixed values array from server

## Testing

Run tests:

```bash
npm run test
```

Run tests in watch mode:

```bash
npm run test:watch
```

## Architecture

```
src/
├── app/
│   ├── exercise1/
│   ├── exercise2/
│   └── api/
└── components/
    └── Range/
        ├── Range.tsx
        ├── Range.module.css
        ├── Range.types.ts
        └── __tests__/
```

## Technologies

- **Next.js 15** (App Router)
- **TypeScript**
- **CSS Modules**
- **Jest + React Testing Library**
- **ESLint**

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run test` - Run tests
- `npm run lint` - Run ESLint

## Notes

- Server-side data fetching for better performance
- Mobile-first responsive design approach
- Comprehensive error handling with user feedback

### Thank you for your time!
