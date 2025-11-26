import * as bcrypt from 'bcryptjs';

export async function hashValue(
  value: string,
  saltRounds: number,
): Promise<string> {
  return bcrypt.hash(value, saltRounds);
}

export async function verifyValue(
  incoming: string,
  hashed: string,
): Promise<boolean> {
  if (!incoming || !hashed) return false;
  return bcrypt.compare(incoming, hashed);
}
