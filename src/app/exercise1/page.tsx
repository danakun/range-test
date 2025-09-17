import { API_ENDPOINTS } from '@/lib/endpoints';
import Range from '@/components/Range/Range';
import { RangeConfig } from '@/components/Range/Range.types';

async function getRangeConfig(): Promise<RangeConfig> {
  const res = await fetch(API_ENDPOINTS.rangeConfig, {
    cache: 'no-store'
  });

  if (!res.ok) {
    throw new Error('Failed to fetch range configuration');
  }

  return res.json();
}

export default async function Exercise1Page() {
  try {
    const config = await getRangeConfig();

    return (
      <main>
        <section className='section'>
          <h1>Exercise 1 - Normal Range</h1>
          <Range mode='normal' config={config} />
        </section>
      </main>
    );
  } catch (error) {
    console.error('Failed to load range values:', error);

    return (
      <main>
        <section className='section'>
          <h1>Exercise 1 - Normal Range</h1>
          <div style={{ padding: '1rem', background: '#f5f5f5', borderRadius: '4px' }}>
            <p>Error: Unable to load range configuration</p>
          </div>
        </section>
      </main>
    );
  }
}
