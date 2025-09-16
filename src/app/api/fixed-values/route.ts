// For Fixed Values
import { NextResponse } from 'next/server';

// fixed values range
const fixedValuesConfig = {
  rangeValues: [1.99, 5.99, 10.99, 30.99, 50.99, 70.99]
};

export async function GET() {
  try {
    // simulate API delay
    await new Promise(resolve => setTimeout(resolve, 150));

    return NextResponse.json(fixedValuesConfig);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch fixed values configuration' },
      { status: 500 }
    );
  }
}
