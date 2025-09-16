import Link from 'next/link';

export default function HomePage() {
  return (
    <main>
      <section className='section'>
        <h1>Range Component Exercise</h1>
        <p>
          Custom range slider component with two different modes. Built with Next.js 15, TypeScript,
          and comprehensive accessibility support.
        </p>
      </section>

      <nav className='nav-container'>
        <Link href='/exercise1' className='nav-link'>
          Exercise 1 - Normal Range
        </Link>
        <Link href='/exercise2' className='nav-link'>
          Exercise 2 - Fixed Values
        </Link>
      </nav>

      <section className='section'>
        <h2>Features</h2>
        <ul style={{ paddingLeft: '1.5rem', lineHeight: '1.8' }}>
          <li>Two range modes: Normal (min-max) and Fixed values</li>
          <li>Fully responsive with mobile touch support</li>
          <li>Complete accessibility with keyboard navigation</li>
          <li>Clean, modern design with smooth interactions</li>
          <li>Comprehensive unit test coverage</li>
        </ul>
      </section>
    </main>
  );
}
