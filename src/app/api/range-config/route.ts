// For Normal Range
import { NextResponse } from 'next/server';

// normal range configuration
const rangeConfig = {
  min: 1,
  max: 100
};

export async function GET() {
  try {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 100));

    return NextResponse.json(rangeConfig);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch range configuration' }, { status: 500 });
  }
}
