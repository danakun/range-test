import Range from '@/components/Range/Range';
import { FixedValuesConfig } from '@/components/Range/Range.types';

async function getFixedValues(): Promise<FixedValuesConfig> {
  const res = await fetch('http://localhost:8080/api/fixed-values', {
    cache: 'no-store'
  });

  if (!res.ok) {
    throw new Error('Failed to fetch fixed values configuration');
  }

  return res.json();
}

export default async function Exercise2Page() {
  try {
    const config = await getFixedValues();

    return (
      <main>
        <section className='section'>
          <h1>Exercise 2 - Fixed Values</h1>
          <Range mode='fixed' config={config} />
        </section>
      </main>
    );
  } catch (error) {
    return (
      <main>
        <section className='section'>
          <h1>Exercise 2 - Fixed Values</h1>
          <div style={{ padding: '1rem', background: '#f5f5f5', borderRadius: '4px' }}>
            <p>Error: Unable to load fixed values configuration</p>
          </div>
        </section>
      </main>
    );
  }
}
