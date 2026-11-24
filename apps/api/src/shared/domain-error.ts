// A broken business rule (bad plate, unknown package...).
// The HTTP layer will turn it into a 400/422 response later.
export class DomainError extends Error {
  override name = "DomainError";
}
