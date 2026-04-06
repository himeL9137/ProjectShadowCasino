export class DecimalUtils {
  static toDecimal(value: string | number): string {
    if (typeof value === 'string') {
      const num = parseFloat(value);
      if (isNaN(num)) throw new Error(`Invalid decimal value: ${value}`);
      return num.toFixed(10).replace(/\.?0+$/, '');
    }
    return value.toFixed(10).replace(/\.?0+$/, '');
  }

  static multiply(a: string | number, b: string | number): string {
    const numA = typeof a === 'string' ? parseFloat(a) : a;
    const numB = typeof b === 'string' ? parseFloat(b) : b;
    const result = numA * numB;
    return result.toFixed(10).replace(/\.?0+$/, '');
  }

  static divide(a: string | number, b: string | number): string {
    const numA = typeof a === 'string' ? parseFloat(a) : a;
    const numB = typeof b === 'string' ? parseFloat(b) : b;
    if (numB === 0) throw new Error('Division by zero');
    const result = numA / numB;
    return result.toFixed(10).replace(/\.?0+$/, '');
  }

  static add(a: string | number, b: string | number): string {
    const numA = typeof a === 'string' ? parseFloat(a) : a;
    const numB = typeof b === 'string' ? parseFloat(b) : b;
    const result = numA + numB;
    return result.toFixed(10).replace(/\.?0+$/, '');
  }

  static subtract(a: string | number, b: string | number): string {
    const numA = typeof a === 'string' ? parseFloat(a) : a;
    const numB = typeof b === 'string' ? parseFloat(b) : b;
    const result = numA - numB;
    return result.toFixed(10).replace(/\.?0+$/, '');
  }

  static lessThan(a: string | number, b: string | number): boolean {
    const numA = typeof a === 'string' ? parseFloat(a) : a;
    const numB = typeof b === 'string' ? parseFloat(b) : b;
    return numA < numB;
  }

  static greaterThanOrEqualTo(a: string | number, b: string | number): boolean {
    const numA = typeof a === 'string' ? parseFloat(a) : a;
    const numB = typeof b === 'string' ? parseFloat(b) : b;
    return numA >= numB;
  }

  static isEqual(a: string | number, b: string | number): boolean {
    const numA = typeof a === 'string' ? parseFloat(a) : a;
    const numB = typeof b === 'string' ? parseFloat(b) : b;
    return Math.abs(numA - numB) < 1e-10;
  }
}
