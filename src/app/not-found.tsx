import Link from 'next/link';

export default function NotFound() {
  return (
    <section className='section not-found'>
      <h2>Not Found</h2>
      <p>Could not find the requested resource.</p>
      <p>
        <Link href='/'>Return Home</Link>
      </p>
    </section>
  );
}
